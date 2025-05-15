/**
 * @fileoverview Unit tests for the EditTaskDialog component.
 * These tests cover rendering the dialog with pre-filled data, form submission,
 * task update functionality, and dialog closure.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-helpers.ts';
import EditTaskDialog from './EditTaskDialog.tsx';
import { useTask } from '@/contexts/TaskContext.hooks.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { Task } from '@/types/task.ts';
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";

// Mock hooks
vi.mock('@/contexts/TaskContext.tsx');
vi.mock('@/hooks/use-toast.tsx');

// Helper to render the dialog open directly
const renderEditDialog = (task: Task) => {
  const user = userEvent.setup();
  const mockSetOpen = vi.fn(); 
  renderWithProviders(
    <Dialog open onOpenChange={mockSetOpen}> 
      <DialogContent>
        <EditTaskDialog task={task} setOpen={mockSetOpen} />
      </DialogContent>
    </Dialog>
  );
  return { user, mockSetOpen }; 
}

describe('EditTaskDialog', () => {
  const mockUpdateTask = vi.fn();
  const mockToast = vi.fn();

  const mockTask: Task = {
    id: 'task-to-edit-id',
    title: 'Original Title',
    description: 'Original Description',
    priority: 'medium',
    status: 'todo',
    deadline: '2024-12-31T00:00:00.000Z',
    userId: 'test-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subtasks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTask as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ updateTask: mockUpdateTask });
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ toast: mockToast });
    mockUpdateTask.mockResolvedValue({ ...mockTask, title: 'Updated Task' });
  });

  it('should render dialog content and pre-fill form fields', () => {
    renderEditDialog(mockTask); 

    expect(screen.getByRole('heading', { name: /edit task/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue(mockTask.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(mockTask.description);
    expect(screen.getByRole('combobox', { name: /priority/i })).toHaveTextContent(/medium/i);
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveTextContent(/todo/i);
    // Add deadline check if needed
  });

  it('should call updateTask and setOpen(false) on submit', async () => {
    const { user, mockSetOpen } = renderEditDialog(mockTask);

    const titleInput = screen.getByLabelText(/title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    const newTitle = 'New Test Title';
    const newDescription = 'New Test Description';

    await user.clear(titleInput);
    await user.type(titleInput, newTitle);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, newDescription);
    
    await user.click(saveButton);

    await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledTimes(1);
        expect(mockUpdateTask).toHaveBeenCalledWith(mockTask.id, expect.objectContaining({
            title: newTitle,
            description: newDescription,
        }));
        // Check if setOpen(false) was called after successful save
        expect(mockSetOpen).toHaveBeenCalledWith(false);
    });
  });

  // TODO: Add tests for the following scenarios:
  // - Validation errors (e.g., empty title).
  // - Handling API errors during task update (e.g., displaying an error toast).
  // - Correctly updating priority, status, and deadline fields.
  // - Ensuring the dialog calls setOpen(false) when the cancel button or escape key is pressed.
}); 