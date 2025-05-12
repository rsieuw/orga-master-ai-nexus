import { describe, it, expect, vi, beforeEach, afterEach, Mocked } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils.tsx';
import ChatPanel from './ChatPanel.tsx';
import { useAuth } from '@/hooks/useAuth.ts';
import { useToast } from '../../hooks/use-toast.ts';
import { Task } from '@/types/task.ts';
import { supabase } from '@/integrations/supabase/client.ts';

// --- Mock ONLY Hooks --- (Remove Supabase module mock)
vi.mock('../../contexts/AuthContext.tsx');
vi.mock('../../hooks/use-toast.ts');

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
    // @ts-expect-error: Type mismatch between MockInstance and Mocked type
    getUserSpy = vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null });

    // Default implementation for chained methods
    eqMock.mockReturnThis(); // .eq() returns the object for further chaining
    orderMock.mockResolvedValue({ data: [], error: null }); // Default empty select result
    insertMock.mockResolvedValue({ data: [{ id: 'new-id' }], error: null });
    deleteMock.mockResolvedValue({ data: null, error: null });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectMock.mockReturnValue({ eq: eqMock, order: orderMock } as any);

    // Spy on 'from' and provide default implementation covering TaskProvider load
    // @ts-expect-error: Type mismatch between MockInstance and Mocked type
    fromSpy = vi.spyOn(supabase, 'from').mockImplementation((tableName: string) => {
      if (tableName === 'tasks') {
          // Mock the select chain for tasks (used by TaskProvider)
          return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [mockTask], error: null }) // TaskProvider needs task data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any;
      } else {
        // Default mock for chat_messages, task_notes, saved_research etc.
        // Ensure the chain works: select -> eq -> order
        const eqOrderChain = { order: orderMock };
        const selectEqChain = { eq: vi.fn(() => eqOrderChain) }; // eq returns order chain
        selectMock.mockReturnValue(selectEqChain); // select returns eq chain

        return {
          select: selectMock, // Use the configured selectMock
          insert: insertMock,
          delete: deleteMock.mockReturnValue({
             eq: eqMock.mockResolvedValue({ data: null, error: null })
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           } as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
    });
    // --- End Spies Setup ---

    // Mock useAuth correctly
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id', email: 'test@example.com' } as any, // Cast user to any to satisfy broader type if needed
      // Voeg hier eventueel andere gemockte functies/waarden van useAuth toe indien nodig voor ChatPanel
      session: null, // Add missing properties with mock values
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      updateUser: vi.fn(),
    });

    // Mock useToast correctly
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    });
  });

  afterEach(() => {
      vi.restoreAllMocks(); // Restore original implementations
  });

  it('should render the chat input and send button', async () => {
    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} />);
    
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

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} />);

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
    insertMock.mockImplementationOnce((dataToInsert) => {
      expect(dataToInsert).toEqual({
        task_id: mockTask.id,
        user_id: 'test-user-id',
        role: 'user',
        content: 'Hallo DB!',
        message_type: 'standard'
      });
      return { data: [{ id: 'inserted-msg-id' }], error: null };
    });

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} />);
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

  it('should load and display saved notes', async () => {
    const mockNotes = [
      { id: 'note-1', content: 'Dit is een opgeslagen notitie', created_at: new Date().toISOString(), task_id: mockTask.id, user_id: mockTask.userId },
    ];

    // Mock specific responses for this test
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // chat_messages
    orderMock.mockResolvedValueOnce({ data: mockNotes, error: null }); // task_notes
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // saved_research

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} />);

    // Wait for the note to be displayed
    await waitFor(() => {
      expect(screen.getByText('Dit is een opgeslagen notitie')).toBeInTheDocument();
      // Optionally check for a specific class or structure indicating it's a note
      // expect(screen.getByText('Dit is een opgeslagen notitie').closest('.chat-message-note-saved')).toBeInTheDocument();
    });

    // Verify calls for notes
    expect(fromSpy).toHaveBeenCalledWith('task_notes');
    expect(selectMock).toHaveBeenCalledWith('id, content, created_at');
    expect(eqMock).toHaveBeenCalledWith('task_id', mockTask.id);
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('should load and display saved research', async () => {
    const mockResearch = [
      { id: 'research-1', research_content: 'Dit is opgeslagen onderzoek.', created_at: new Date().toISOString(), task_id: mockTask.id, user_id: mockTask.userId, citations: ['http://example.com'] },
    ];

    // Mock specific responses for this test
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // chat_messages
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // task_notes
    orderMock.mockResolvedValueOnce({ data: mockResearch, error: null }); // saved_research

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} />);

    // Wait for the research to be displayed
    await waitFor(() => {
      expect(screen.getByText('Dit is opgeslagen onderzoek.')).toBeInTheDocument();
      // Optionally check for a specific class or structure indicating it's research
      // expect(screen.getByText('Dit is opgeslagen onderzoek.').closest('.chat-message-saved-research')).toBeInTheDocument();
    });

    // Verify calls for research
    expect(fromSpy).toHaveBeenCalledWith('saved_research');
    expect(selectMock).toHaveBeenCalledWith('id, research_content, created_at, citations');
    expect(eqMock).toHaveBeenCalledWith('task_id', mockTask.id);
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: true });
  });

  it('should copy message content when copy button is clicked', async () => {
    const mockMessages = [
      { id: 'msg-1', role: 'assistant' as const, content: 'Inhoud om te kopiëren', created_at: new Date().toISOString(), task_id: mockTask.id, message_type: 'assistant', user_id: 'ai' }
    ];
    orderMock.mockResolvedValueOnce({ data: mockMessages, error: null }); // chat_messages
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // task_notes
    orderMock.mockResolvedValueOnce({ data: [], error: null }); // saved_research

    // Mock clipboard API
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    writeTextSpy.mockResolvedValueOnce(); // Mock succesvol schrijven

    renderWithProviders(<ChatPanel task={mockTask} selectedSubtaskTitle={null} />);
    const user = userEvent.setup();

    // Wacht tot het bericht is weergegeven
    await waitFor(() => {
      expect(screen.getByText('Inhoud om te kopiëren')).toBeInTheDocument();
    });

    // Zoek de kopieerknop bij het bericht
    // De knop is niet direct gelabeld, we vinden hem via de title
    const messageContainer = screen.getByText('Inhoud om te kopiëren').closest('.group'); // Ga naar de parent div met class 'group'
    expect(messageContainer).toBeInTheDocument();
    // querySelector is hier een pragmatische manier om de knop binnen de container te vinden
    const copyButton = messageContainer?.querySelector('button[title="Kopieer bericht"]'); 
    expect(copyButton).toBeInTheDocument();

    if (copyButton) {
        await user.click(copyButton);
    }

    // Verifieer clipboard call en toast
    expect(writeTextSpy).toHaveBeenCalledWith('Inhoud om te kopiëren');
    expect(mockToast).toHaveBeenCalledWith({
      title: "Gekopieerd",
      description: "Tekst gekopieerd naar klembord",
    });
  });

  // TODO: Add more tests for:
  // - Sending message and getting AI response (needs mocking edge function call or another mechanism?)
  // - Handling Supabase errors (auth, select, insert, delete)
  // - Clicking action buttons (regenerate, copy, delete, save research, delete research, save note, delete note)
  // - Triggering subtask generation (needs mocking edge function call)
  // - Triggering deep research (needs mocking edge function call)
  // - Clearing chat history (mocking delete)
  // - Exporting chat
  // - UI states (loading, empty)
}); 