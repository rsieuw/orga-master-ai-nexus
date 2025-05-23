import { useContext } from "react";
import { TaskContext, TaskContextType } from "./TaskContext.context.ts";

// Define Props interface here
// export interface TaskContextProps {
//   tasks: Task[];
//   isLoading: boolean;
//   createTask: (task: Omit<Task, "id" | "userId" | "createdAt" | "subtasks">) => Promise<Task>;
//   updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
//   deleteTask: (id: string) => Promise<void>;
//   getTaskById: (id: string) => Task | undefined;
//   groupTasksByDate: () => TasksByDate;
//   suggestPriority: (title: string, description: string) => Promise<TaskPriority>;
//   addSubtask: (taskId: string, title: string) => Promise<void>;
//   updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Omit<SubTask, 'id' | 'taskId'>>) => Promise<void>;
//   deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
//   expandTask: (taskId: string) => Promise<void>;
//   deleteAllSubtasks: (taskId: string) => Promise<void>;
//   toggleTaskCompletion: (taskId: string, isDone: boolean) => Promise<void>;
// }

// Define Context here
// export const TaskContext = createContext<TaskContextProps | undefined>(undefined);

/**
 * Custom hook to access the TaskContext.
 *
 * Provides access to task data and functions for managing tasks,
 * such as creating, updating, deleting, and grouping tasks.
 *
 * @throws {Error} If used outside of a TaskProvider.
 * @returns {TaskContextType} The task context, providing task state and actions.
 */
export const useTask = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
}; 