import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils.tsx';
import EditTaskDialog from './EditTaskDialog.tsx';
import { useTask } from '@/contexts/TaskContext.hooks.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { Task } from '@/types/task.ts';
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";

// Mock hooks
vi.mock('@/contexts/TaskContext.tsx');
vi.mock('@/hooks/use-toast.tsx');

// Helper renders the dialog open directly
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
    title: 'Originele Titel',
    description: 'Originele Beschrijving',
    priority: 'medium',
    status: 'todo',
    deadline: '2024-12-31T00:00:00.000Z',
    userId: 'test-user-id',
    createdAt: new Date().toISOString(),
    subtasks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTask as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ updateTask: mockUpdateTask /* other mocks */ });
    (useToast as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ toast: mockToast });
    mockUpdateTask.mockResolvedValue({ ...mockTask, title: 'Updated Task' });
  });

  it('should render dialog content and pre-fill form fields', () => {
    renderEditDialog(mockTask); 

    expect(screen.getByRole('heading', { name: /taak bewerken/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/titel/i)).toHaveValue(mockTask.title);
    expect(screen.getByLabelText(/beschrijving/i)).toHaveValue(mockTask.description);
    expect(screen.getByRole('combobox', { name: /prioriteit/i })).toHaveTextContent(/medium/i);
    expect(screen.getByRole('combobox', { name: /status/i })).toHaveTextContent(/todo/i);
    // Add deadline check if needed
  });

  it('should call updateTask and setOpen(false) on submit', async () => {
    const { user, mockSetOpen } = renderEditDialog(mockTask);

    const titleInput = screen.getByLabelText(/titel/i);
    const descriptionInput = screen.getByLabelText(/beschrijving/i);
    const saveButton = screen.getByRole('button', { name: /wijzigingen opslaan/i });

    const newTitle = 'Nieuwe Titel Test';
    const newDescription = 'Nieuwe Beschrijving Test';

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

  // TODO: Add tests for:
  // - Validation errors (if any)
  // - Handling updateTask failure (e.g., showing error toast)
  // - Updating priority, status, deadline fields
  // - Cancelling the dialog (calls setOpen(false))
}); 