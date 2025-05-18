/**
 * @fileoverview Defines types and interfaces related to tasks, subtasks, and AI research results.
 */

/**
 * Represents the priority levels for a task.
 * @typedef {"high" | "medium" | "low" | "none"} TaskPriority
 */
export type TaskPriority = 'high' | 'medium' | 'low' | 'none';

/**
 * Represents the status of a task.
 * @typedef {"todo" | "in_progress" | "done"} TaskStatus
 */
export type TaskStatus = "todo" | "in_progress" | "done";

/**
 * Interface representing a subtask associated with a main task.
 * @interface SubTask
 */
export interface SubTask {
  /** The unique identifier for the subtask. */
  id: string;
  /** The title of the subtask. */
  title: string;
  /** Optional description for the subtask. */
  description?: string;
  /** Indicates whether the subtask is completed. */
  completed: boolean;
  /** Optional ID of the parent task this subtask belongs to. */
  taskId?: string;
  /** Optional creation timestamp of the subtask (ISO string). */
  createdAt?: string;
  /** Optional last update timestamp of the subtask (ISO string). */
  updatedAt?: string;
}

/**
 * Interface representing a main task.
 * @interface Task
 */
export interface Task {
  /** The unique identifier for the task. */
  id: string;
  /** The title of the task. */
  title: string;
  /** The description of the task. */
  description: string;
  /** The priority of the task. */
  priority: TaskPriority;
  /** The current status of the task. */
  status: TaskStatus;
  /** The deadline for the task (ISO date string). Can be null if no deadline is set. */
  deadline: string | null; // ISO date string - Aangepast om null toe te staan
  /** The ID of the user to whom the task is assigned. */
  userId: string;
  /** The creation timestamp of the task (ISO string). */
  createdAt: string;
  /** The last update timestamp of the task (ISO string). */
  updatedAt: string; // ISO string
  /** An array of subtasks associated with this task. */
  subtasks: SubTask[];
  /** Optional count of how many times AI subtasks have been generated for this task. */
  aiSubtaskGenerationCount?: number; // Nieuw veld
  /** Optional flag indicating if the task is new and has not been opened yet. */
  isNew?: boolean; // Geeft aan of de taak nieuw en nog niet geopend is
  /** Optional category for the task. */
  category?: string | null; // Nieuw veld voor categorie
  /** Optional emoji representation for the task. */
  emoji?: string | null; // Added field for task emoji representation
  /** Optional last viewed timestamp of the task (ISO string). */
  lastViewedAt?: string | null;
  /** Optional flag indicating if the task is a favorite. */
  isFavorite?: boolean; // ***** NIEUW VELD *****
}

/**
 * Interface representing the result of AI-powered research for a task.
 * @interface AIResearchResult
 */
export interface AIResearchResult {
  /** The unique identifier for the research result. */
  id: string;
  /** The ID of the task this research result is associated with. */
  taskId: string;
  /** The content of the research result. */
  content: string;
  /** The source of the AI research (e.g., "openai", "perplexity"). */
  source: "openai" | "perplexity";
  /** The creation timestamp of the research result (ISO string). */
  createdAt: string;
}

/**
 * Interface representing tasks grouped by their due dates relative to the current date.
 * @interface TasksByDate
 */
export interface TasksByDate {
  /** Completed tasks. */
  completed: Task[];
  /** Tasks that are overdue. */
  overdue: Task[];
  /** Tasks due today. */
  today: Task[];
  /** Tasks due tomorrow. */
  tomorrow: Task[];
  /** Tasks due the day after tomorrow. */
  dayAfterTomorrow: Task[];
  /** Tasks due next week. */
  nextWeek: Task[];
  /** Tasks due at a later date (beyond next week). */
  later: Task[];
  /** Favoriete taken. */
  favorites: Task[];
  /** Potentieel hier ook alvast 'favorites': Task[]; toevoegen */
}

/**
 * Interface representing a task in the database.
 * @interface DbTask
 */
export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'inprogress' | 'done';
  priority: TaskPriority;
  deadline?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
  subtasks: SubTask[] | null; // Aangepast van Json/any naar SubTask[] | null
  is_new?: boolean;
  ai_subtask_generation_count?: number;
  last_viewed_at?: string | null;
  emoji?: string | null;
  is_favorite?: boolean; // ***** NIEUW VELD *****
}
