import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import TaskSection from './TaskSection';
import { Task } from '@/types/task';

describe('TaskSection', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Taak 1',
      description: 'Beschrijving van taak 1',
      status: 'todo',
      priority: 'medium',
      deadline: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId: 'user123',
      subtasks: []
    },
    {
      id: '2',
      title: 'Taak 2',
      description: 'Beschrijving van taak 2',
      status: 'in_progress',
      priority: 'high',
      deadline: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      userId: 'user123',
      subtasks: []
    }
  ];

  it('toont de sectietitel correct', () => {
    renderWithProviders(<TaskSection title="Te Doen" tasks={mockTasks} />);
    expect(screen.getByText('Te Doen')).toBeInTheDocument();
  });

  it('toont alle taken in de sectie', () => {
    renderWithProviders(<TaskSection title="Alle Taken" tasks={mockTasks} />);
    expect(screen.getByText('Taak 1')).toBeInTheDocument();
    expect(screen.getByText('Taak 2')).toBeInTheDocument();
  });

  it('toont het standaard lege bericht wanneer er geen taken zijn', () => {
    renderWithProviders(<TaskSection title="Lege Sectie" tasks={[]} />);
    expect(screen.getByText('Geen taken gevonden')).toBeInTheDocument();
  });

  it('toont een aangepast lege bericht wanneer er geen taken zijn', () => {
    renderWithProviders(
      <TaskSection 
        title="Lege Sectie" 
        tasks={[]} 
        emptyMessage="Geen te doen taken beschikbaar"
      />
    );
    expect(screen.getByText('Geen te doen taken beschikbaar')).toBeInTheDocument();
  });
}); 