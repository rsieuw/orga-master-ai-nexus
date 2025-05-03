import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import TaskCard from './TaskCard';
import { Task } from '@/types/task';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Taak',
    description: 'Dit is een testbeschrijving',
    status: 'todo',
    priority: 'medium',
    deadline: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    userId: 'user123',
    subtasks: [
      { id: 'sub1', title: 'Subtaak 1', completed: true, taskId: '1' },
      { id: 'sub2', title: 'Subtaak 2', completed: false, taskId: '1' }
    ]
  };

  it('toont de taak titel correct', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Taak')).toBeInTheDocument();
  });

  it('toont de taak beschrijving correct', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    expect(screen.getByText('Dit is een testbeschrijving')).toBeInTheDocument();
  });

  it('toont het juiste aantal afgeronde subtaken', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('toont geen subtaken teller wanneer er geen subtaken zijn', () => {
    const taskWithoutSubtasks = { ...mockTask, subtasks: [] };
    renderWithProviders(<TaskCard task={taskWithoutSubtasks} />);
    expect(screen.queryByText('0/0')).not.toBeInTheDocument();
  });

  it('heeft een link naar de taakdetailpagina', () => {
    renderWithProviders(<TaskCard task={mockTask} />);
    const linkElement = screen.getByRole('link');
    expect(linkElement).toHaveAttribute('href', '/task/1');
  });
}); 