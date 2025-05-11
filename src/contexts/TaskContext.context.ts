import { createContext } from 'react';
import { Task, SubTask, TasksByDate } from '@/types/task.ts';

export interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  getTaskById: (id: string) => Task | undefined;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount'>) => Promise<Task | undefined>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addSubtask: (taskId: string, subtaskTitle: string, subtaskDescription?: string) => Promise<void>;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Omit<SubTask, 'id' | 'taskId' | 'createdAt'>>) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteAllSubtasks: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;
  isGeneratingSubtasksForTask: (taskId: string) => boolean;
  expandTask: (taskId: string) => Promise<void>;
  groupTasksByDate: () => TasksByDate;
  getMaxAiGenerationsForUser: () => number;
  isAiGenerationLimitReached: (task: Task) => boolean;
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined); 