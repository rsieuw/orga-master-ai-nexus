import { createContext } from 'react';
import { Task, SubTask, TasksByDate } from '@/types/task.ts';

/**
 * Defines the shape of the Task context.
 * Provides state and functions for managing tasks and subtasks.
 *
 * @interface TaskContextType
 */
export interface TaskContextType {
  /** Array of all tasks. */
  tasks: Task[];
  /** Indicates if tasks are currently being loaded. */
  isLoading: boolean;
  /** 
   * Retrieves a task by its ID.
   * @param {string} id - The ID of the task to retrieve.
   * @returns {Task | undefined} The task object if found, otherwise undefined.
   */
  getTaskById: (id: string) => Task | undefined;
  /** 
   * Adds a new task.
   * @param {Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount' | 'isNew'>} task - The task data for the new task.
   * @returns {Promise<Task | undefined>} A promise that resolves with the newly created task or undefined on failure.
   */
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount' | 'isNew'>) => Promise<Task | undefined>;
  /** 
   * Updates an existing task.
   * @param {string} id - The ID of the task to update.
   * @param {Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>} updates - An object containing the task properties to update.
   * @returns {Promise<void>} A promise that resolves when the task is updated.
   */
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => Promise<void>;
  /** 
   * Deletes a task.
   * @param {string} id - The ID of the task to delete.
   * @returns {Promise<void>} A promise that resolves when the task is deleted.
   */
  deleteTask: (id: string) => Promise<void>;
  /** 
   * Adds a new subtask to a task.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskTitle - The title of the new subtask.
   * @param {string} [subtaskDescription] - Optional description for the new subtask.
   * @returns {Promise<void>} A promise that resolves when the subtask is added.
   */
  addSubtask: (taskId: string, subtaskTitle: string, subtaskDescription?: string) => Promise<void>;
  /** 
   * Updates an existing subtask.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to update.
   * @param {Partial<Omit<SubTask, 'id' | 'taskId' | 'createdAt'>>} updates - An object containing the subtask properties to update.
   * @returns {Promise<void>} A promise that resolves when the subtask is updated.
   */
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Omit<SubTask, 'id' | 'taskId' | 'createdAt'>>) => Promise<void>;
  /** 
   * Deletes a subtask.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to delete.
   * @returns {Promise<void>} A promise that resolves when the subtask is deleted.
   */
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  /** 
   * Deletes all subtasks for a given task.
   * @param {string} taskId - The ID of the task whose subtasks will be deleted.
   * @returns {Promise<void>} A promise that resolves when all subtasks are deleted.
   */
  deleteAllSubtasks: (taskId: string) => Promise<void>;
  /** 
   * Toggles the completion status of a task.
   * @param {string} taskId - The ID of the task to toggle.
   * @param {boolean} completed - The new completion status.
   * @returns {Promise<void>} A promise that resolves when the task completion status is updated.
   */
  toggleTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;
  /** 
   * Checks if AI subtask generation is currently in progress for a specific task.
   * @param {string} taskId - The ID of the task to check.
   * @returns {boolean} True if subtasks are being generated, false otherwise.
   */
  isGeneratingSubtasksForTask: (taskId: string) => boolean;
  /** 
   * Expands a task by generating subtasks using AI.
   * @param {string} taskId - The ID of the task to expand.
   * @returns {Promise<void>} A promise that resolves when the subtask generation is complete or attempted.
   */
  expandTask: (taskId: string) => Promise<void>;
  /** 
   * Groups tasks by their due date (e.g., overdue, today, tomorrow).
   * @returns {TasksByDate} An object containing tasks grouped by date categories.
   */
  groupTasksByDate: () => TasksByDate;
  /** 
   * Gets the maximum number of AI generations allowed for the user.
   * @returns {number} The maximum number of AI generations.
   */
  getMaxAiGenerationsForUser: () => number;
  /** 
   * Checks if the AI generation limit has been reached for a specific task.
   * @param {Task} task - The task object to check.
   * @returns {boolean} True if the limit is reached, false otherwise.
   */
  isAiGenerationLimitReached: (task: Task) => boolean;
  /** 
   * Marks a task as having been viewed (clears the 'isNew' flag).
   * @param {string} id - The ID of the task to mark as viewed.
   * @returns {Promise<void>} A promise that resolves when the task is marked as viewed.
   */
  markTaskAsViewed: (id: string) => Promise<void>;
}

/**
 * React context for managing task-related state and actions.
 * Provides access to tasks, subtasks, and functions to manipulate them.
 */
export const TaskContext = createContext<TaskContextType | undefined>(undefined); 