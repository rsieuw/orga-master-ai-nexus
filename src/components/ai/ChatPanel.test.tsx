import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import ChatPanel from './ChatPanel';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/use-toast';
import { Task } from '@/types/task';
import { supabase } from '@/integrations/supabase/client';

// --- Mock ONLY Hooks --- (Remove Supabase module mock)
vi.mock('../../contexts/AuthContext');
vi.mock('../ui/use-toast');

describe('ChatPanel', () => {
  const mockToast = vi.fn();

  // Spies for supabase methods
  let getUserSpy: Mocked<typeof supabase.auth.getUser>;
  let fromSpy: Mocked<typeof supabase.from>;
  // Mocks for chained methods to control their return values/implementations
  const selectMock = vi.fn();
  const eqMock = vi.fn();
  const orderMock = vi.fn();
  const insertMock = vi.fn();
  const deleteMock = vi.fn();

  // Define a mock task object with all required properties
  const mockTask: Task = {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test Description',
    priority: 'medium',
    status: 'todo',
    deadline: new Date().toISOString(),
    userId: 'test-user-id',
    createdAt: new Date().toISOString(),
    subtasks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // --- Setup Spies --- 
    getUserSpy = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null } as any);

    // Default implementation for chained methods
    eqMock.mockReturnThis(); // .eq() returns the object for further chaining
    orderMock.mockResolvedValue({ data: [], error: null }); // Default empty select result
    insertMock.mockResolvedValue({ data: [{ id: 'new-id' }], error: null });
    deleteMock.mockResolvedValue({ data: null, error: null });
    selectMock.mockReturnValue({ eq: eqMock, order: orderMock } as any);

    // Spy on 'from' and provide default implementation covering TaskProvider load
    fromSpy = vi.spyOn(supabase, 'from').mockImplementation((tableName: string) => {
      if (tableName === 'tasks') {
          // Mock the select chain for tasks (used by TaskProvider)
          return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [mockTask], error: null }) // TaskProvider needs task data
          } as any;
      }
      // Default for other tables used by ChatPanel (chat_messages, notes, research)
      return {
        select: selectMock, // Returns eq/order chain
        insert: insertMock,
        delete: deleteMock.mockReturnValue({ // Mock delete().eq() chain
             eq: eqMock.mockResolvedValue({ data: null, error: null })
           } as any),
      } as any;
    });
    // --- End Spies Setup ---

    // Mock useAuth
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' },
    });

    // Mock useToast
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      toast: mockToast,
    });
  });

  afterEach(() => {
      vi.restoreAllMocks(); // Restore original implementations
  });

  it('should render the chat input and send button', async () => {
    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} onSubtaskHandled={vi.fn()} />);
    
    // Wait for the input field to appear, indicating loading is complete
    await waitFor(() => {
        expect(screen.getByPlaceholderText(/stel een vraag of geef een commando/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /verzend bericht/i })).toBeInTheDocument();
    
    // Verify TaskProvider loaded tasks and ChatPanel loaded auth
    expect(fromSpy).toHaveBeenCalledWith('tasks'); 
    expect(getUserSpy).toHaveBeenCalledTimes(1); 
  });

  it('should load initial chat history on mount', async () => {
    const mockChatHistory = [
      { id: '1', role: 'user', content: 'Initial User Message', created_at: new Date().toISOString(), task_id: mockTask.id, message_type: 'user', user_id: mockTask.userId },
      { id: '2', role: 'assistant', content: 'Initial AI Response', created_at: new Date().toISOString(), task_id: mockTask.id, message_type: 'assistant', user_id: 'ai' }
    ];
    
    // Override the final step (.order) specifically for 'chat_messages'
    orderMock.mockResolvedValueOnce({ data: mockChatHistory, error: null }); // 1st .order call after from('chat_messages')
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // 2nd .order call from('task_notes')
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // 3rd .order call from('saved_research')

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} onSubtaskHandled={vi.fn()} />);

    // Wait for messages to be displayed
    await waitFor(() => {
       expect(screen.getByText('Initial User Message')).toBeInTheDocument();
       expect(screen.getByText('Initial AI Response')).toBeInTheDocument();
    });

    // Verify calls
    expect(getUserSpy).toHaveBeenCalledTimes(1);
    expect(fromSpy).toHaveBeenCalledWith('tasks');
    expect(fromSpy).toHaveBeenCalledWith('chat_messages');
    expect(selectMock).toHaveBeenCalledWith('role, content, created_at, message_type');
    expect(eqMock).toHaveBeenCalledWith('task_id', mockTask.id);
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(fromSpy).toHaveBeenCalledWith('task_notes');
    expect(fromSpy).toHaveBeenCalledWith('saved_research');
  });

  it('should send a message and save it to db', async () => {
    // Specific mock for insert on chat_messages table
    insertMock.mockImplementationOnce(async (dataToInsert) => {
      expect(dataToInsert).toEqual({
        task_id: mockTask.id,
        user_id: 'test-user-id',
        role: 'user',
        content: 'Hallo DB!',
        message_type: 'standard'
      });
      return { data: [{ id: 'inserted-msg-id' }], error: null };
    });

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} onSubtaskHandled={vi.fn()} />);
    const user = userEvent.setup();

    // Wait for initial render to complete
    await waitFor(() => {
        expect(screen.getByPlaceholderText(/stel een vraag of geef een commando/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/stel een vraag of geef een commando/i);
    const sendButton = screen.getByRole('button', { name: /verzend bericht/i });

    await user.type(input, 'Hallo DB!');
    await user.click(sendButton);

    // Check optimistic UI update
    expect(screen.getByText('Hallo DB!')).toBeInTheDocument();

    // Check if the insert function was called correctly
    await waitFor(() => {
      expect(fromSpy).toHaveBeenCalledWith('chat_messages');
      expect(insertMock).toHaveBeenCalledTimes(1);
    });
  });

  // TODO: Add more tests for:
  // - Loading/displaying notes and saved research
  // - Sending message and getting AI response (needs mocking edge function call or another mechanism?)
  // - Handling Supabase errors (auth, select, insert, delete)
  // - Clicking action buttons (regenerate, copy, delete, save research, delete research, save note, delete note)
  // - Triggering subtask generation (needs mocking edge function call)
  // - Triggering deep research (needs mocking edge function call)
  // - Clearing chat history (mocking delete)
  // - Exporting chat
  // - UI states (loading, empty)
}); 