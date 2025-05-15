/**
 * @fileoverview Unit tests for the NewTaskDialog component.
 * These tests cover rendering the dialog, AI-powered task detail generation (success and failure),
 * manual form submission, and interaction with context and toast notifications.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-helpers.ts';
import NewTaskDialog from './NewTaskDialog.tsx';
import { useTask } from '@/contexts/TaskContext.hooks.ts';
import { useToast } from '@/components/ui/use-toast.ts';
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import { supabase } from '@/integrations/supabase/client.ts';
import { User } from '@supabase/supabase-js';

// Mock hooks
vi.mock('@/contexts/TaskContext.hooks');
vi.mock('@/components/ui/use-toast');
// Mock the actual client module using a factory
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => { 
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
          error: null,
        };
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    })),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Helper to render the dialog open directly, passing setOpen
const renderNewDialog = () => {
  const user = userEvent.setup();
  const mockSetOpen = vi.fn();
  renderWithProviders(
    // Render the Dialog open and pass setOpen to NewTaskDialog
    <Dialog open>
      <DialogContent>
        <NewTaskDialog setOpen={mockSetOpen} />
      </DialogContent>
    </Dialog>
  );
  return { user, mockSetOpen }; // Return mockSetOpen for potential assertions
};


describe('NewTaskDialog', () => {
  const mockCreateTask = vi.fn();
  const mockToast = vi.fn();
  const supabaseFunctionsInvokeMock = vi.mocked(supabase.functions.invoke);
  const supabaseAuthGetUserMock = vi.mocked(supabase.auth.getUser);

  const mockUser: User = {
    id: 'test-user-id',
    app_metadata: { provider: 'email' },
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => { 
    vi.clearAllMocks();
    // Provide more complete mock for useTask, including state
    (useTask as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      tasks: [], // Add mock tasks state
      isLoading: false, // Add mock loading state
      error: null, // Add mock error state
      createTask: mockCreateTask, // Keep the function mock
      // Add other TaskContext values if used by NewTaskDialog or its children
      // e.g., updateTask: vi.fn(), deleteTask: vi.fn(), etc.
    });
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      toast: mockToast,
    });
    supabaseAuthGetUserMock.mockResolvedValue({ data: { user: mockUser }, error: null }); 
  });

  it('should render the dialog content when open', () => {
    renderNewDialog(); // Use the updated helper
    // Check for title and initial AI input elements
    expect(screen.getByRole('heading', { name: /create new task/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe your task or idea/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate task details/i })).toBeInTheDocument();
    // Initially, the regular form fields should NOT be visible
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  // --- Tests for AI Generation Flow ---
  it('should show task details form after successful AI generation', async () => {
    const { user } = renderNewDialog();
    const initialInput = screen.getByPlaceholderText(/describe your task or idea/i);
    const generateButton = screen.getByRole('button', { name: /generate task details/i });

    // Configure the mock response for this test
    supabaseFunctionsInvokeMock.mockResolvedValueOnce({
      data: { title: 'AI Generated Title', description: 'AI Generated Description' },
      error: null
    });
    
    await act(async () => {
      await user.type(initialInput, 'Do the groceries');
      await user.click(generateButton);
    });

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    // Check if fields are populated
    expect(screen.getByLabelText(/title/i)).toHaveValue('AI Generated Title');
    expect(screen.getByLabelText(/description/i)).toHaveValue('AI Generated Description');

     // Check if supabase function was called correctly
    expect(supabaseFunctionsInvokeMock).toHaveBeenCalledTimes(1);
    expect(supabaseFunctionsInvokeMock).toHaveBeenCalledWith('generate-task-details', {
      body: { input: 'Do the groceries' },
    });
  });

  it('should show error toast if AI generation fails', async () => {
     const { user } = renderNewDialog();
    const initialInput = screen.getByPlaceholderText(/describe your task or idea/i);
    const generateButton = screen.getByRole('button', { name: /generate task details/i });

    // Configure the mock response for this test
    supabaseFunctionsInvokeMock.mockResolvedValueOnce({ data: null, error: { message: 'AI Error' }});

    await act(async () => {
      await user.type(initialInput, 'Failed task');
      await user.click(generateButton);
    });

    // Check for error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'Generation failed',
        description: 'AI Error',
      }));
    });

    // Ensure regular form fields are still hidden
    expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
  });

  // --- Tests for Manual Form Submission ---
  it('should call createTask with form data on submit after generation', async () => {
    // Setup: Render, trigger AI generation to show the form
    const { user } = renderNewDialog();
    const initialInput = screen.getByPlaceholderText(/describe your task or idea/i);
    const generateButton = screen.getByRole('button', { name: /generate task details/i });
    // Configure mock response for generation
    supabaseFunctionsInvokeMock.mockResolvedValueOnce({ 
      data: { title: 'AI Title', description: 'AI Desc' }, error: null 
    });
    await act(async () => {
      await user.type(initialInput, 'Test input');
      await user.click(generateButton);
    });
    await waitFor(() => { 
        expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    // Now interact with the visible form
    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const prioritySelect = screen.getByLabelText(/priority/i);
    const submitButton = screen.getByRole('button', { name: /create task/i });

    const testData = {
      title: 'Manually Updated Task',
      description: 'Manually Updated Description',
      priority: 'high',
    };

    await act(async () => {
      // Clear existing AI-generated values and type new ones
      await user.clear(titleInput);
      await user.type(titleInput, testData.title);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, testData.description);
      await user.selectOptions(prioritySelect, testData.priority);
      await user.click(submitButton);
    });

    // Check if createTask was called correctly
    expect(mockCreateTask).toHaveBeenCalledTimes(1);
    expect(mockCreateTask).toHaveBeenCalledWith(expect.objectContaining({
      title: testData.title,
      description: testData.description,
      priority: testData.priority,
      status: 'todo',
    }));

    // Optionally check for toast message
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Task created',
        description: 'The new task has been successfully created',
      }));
    });
  });

  // TODO: Consider adding tests for form validation (e.g., empty title) if the form becomes directly accessible
  // or if a "skip AI" option is implemented. Currently, testing this is complex
  // as the main form fields are only shown after AI generation.
  // it('should show validation errors for empty title', async () => { ... }); 

}); 