import { createContext, useContext, useState, useEffect } from "react";
import { Task, TaskPriority, TaskStatus, TasksByDate, SubTask } from "../types/task";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TaskContextProps {
  tasks: Task[];
  isLoading: boolean;
  createTask: (task: Omit<Task, "id" | "userId" | "createdAt" | "subtasks">) => Promise<Task>;
  updateTask: (id: string, task: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  groupTasksByDate: () => TasksByDate;
  suggestPriority: (title: string, description: string) => Promise<TaskPriority>;
}

const TaskContext = createContext<TaskContextProps | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setTasks([]);

      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: fetchedTasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Failed to load tasks from Supabase:", error);
          toast({
            variant: "destructive",
            title: "Laden van taken mislukt",
            description: error.message || "Kon geen verbinding maken met de database.",
          });
        } else if (fetchedTasks) {
          const mappedTasks = fetchedTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            priority: task.priority as TaskPriority || 'medium',
            status: task.status as TaskStatus || 'todo',
            deadline: task.deadline ? task.deadline : '',
            userId: task.user_id,
            createdAt: task.created_at,
            subtasks: (task.subtasks as unknown as SubTask[] | null) || [],
          } as Task));
          setTasks(mappedTasks);
        }
      } catch (error) {
        console.error("Unexpected error loading tasks:", error);
        toast({
          variant: "destructive",
          title: "Laden van taken mislukt",
          description: "Er is een onverwachte fout opgetreden.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [user, toast]);

  const createTask = async (
    taskData: Omit<Task, "id" | "userId" | "createdAt" | "subtasks">
  ): Promise<Task> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authenticatie vereist",
        description: "Je moet ingelogd zijn om taken aan te maken.",
      });
      throw new Error("User must be authenticated to create tasks");
    }

    try {
      const taskToInsert = {
        ...taskData,
        user_id: user.id,
        subtasks: [],
        deadline: taskData.deadline ? new Date(taskData.deadline).toISOString() : null
      };

      const { data: newTask, error } = await supabase
        .from('tasks')
        .insert(taskToInsert)
        .select()
        .single();

      if (error) {
        console.error("Failed to create task in Supabase:", error);
        toast({
          variant: "destructive",
          title: "Aanmaken mislukt",
          description: error.message || "Kon de taak niet opslaan in de database.",
        });
        throw error;
      }

      if (newTask) {
        const taskWithValidSubtasks = {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description || '',
          priority: newTask.priority as TaskPriority || 'medium',
          status: newTask.status as TaskStatus || 'todo',
          deadline: newTask.deadline ? newTask.deadline : '',
          userId: newTask.user_id,
          createdAt: newTask.created_at,
          subtasks: (newTask.subtasks as unknown as SubTask[] | null) || [],
        } as Task;

        setTasks((prevTasks) => [taskWithValidSubtasks, ...prevTasks]);

        return taskWithValidSubtasks;
      } else {
        throw new Error("Task creation succeeded but no data returned.");
      }

    } catch (error) {
      console.error("Unexpected error creating task:", error);
      if (!(error instanceof Error && error.message.includes("Kon de taak niet opslaan"))) {
        toast({
          variant: "destructive",
          title: "Aanmaken mislukt",
          description: "Er is een onverwachte fout opgetreden bij het aanmaken van de taak.",
        });
      }
      throw error;
    }
  };

  const updateTask = async (id: string, taskData: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>): Promise<Task> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authenticatie vereist",
        description: "Je moet ingelogd zijn om taken bij te werken.",
      });
      throw new Error("User must be authenticated to update tasks");
    }

    try {
      const taskToUpdate: { [key: string]: any } = {};
      if (taskData.title !== undefined) taskToUpdate.title = taskData.title;
      if (taskData.description !== undefined) taskToUpdate.description = taskData.description;
      if (taskData.priority !== undefined) taskToUpdate.priority = taskData.priority;
      if (taskData.status !== undefined) taskToUpdate.status = taskData.status;
      if (taskData.deadline !== undefined) {
        taskToUpdate.deadline = taskData.deadline ? new Date(taskData.deadline).toISOString() : null;
      }
      if (taskData.subtasks !== undefined) taskToUpdate.subtasks = taskData.subtasks;

      if (Object.keys(taskToUpdate).length === 0) {
        console.log("No changes detected for update.");
        const currentTask = tasks.find(t => t.id === id);
        if (!currentTask) throw new Error("Task not found for no-op update");
        return currentTask;
      }

      const { data: updatedTaskData, error } = await supabase
        .from('tasks')
        .update(taskToUpdate)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Failed to update task in Supabase:", error);
        toast({
          variant: "destructive",
          title: "Bijwerken mislukt",
          description: error.message || "Kon de taak niet bijwerken in de database.",
        });
        throw error;
      }

      if (updatedTaskData) {
        const taskWithValidSubtasks = {
          id: updatedTaskData.id,
          title: updatedTaskData.title,
          description: updatedTaskData.description || '',
          priority: updatedTaskData.priority as TaskPriority || 'medium',
          status: updatedTaskData.status as TaskStatus || 'todo',
          deadline: updatedTaskData.deadline ? updatedTaskData.deadline : '',
          userId: updatedTaskData.user_id,
          createdAt: updatedTaskData.created_at,
          subtasks: (updatedTaskData.subtasks as unknown as SubTask[] | null) || [],
        } as Task;

        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === id ? taskWithValidSubtasks : task
          )
        );

        return taskWithValidSubtasks;
      } else {
        throw new Error("Task update succeeded but no data returned.");
      }

    } catch (error) {
      console.error("Unexpected error updating task:", error);
      if (!(error instanceof Error && error.message.includes("Kon de taak niet bijwerken"))) {
         toast({
           variant: "destructive",
           title: "Bijwerken mislukt",
           description: "Er is een onverwachte fout opgetreden bij het bijwerken.",
         });
      }
      throw error;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    if (!user) {
       toast({
         variant: "destructive",
         title: "Authenticatie vereist",
         description: "Je moet ingelogd zijn om taken te verwijderen.",
       });
      throw new Error("User must be authenticated to delete tasks");
    }

    // Optimistic UI update: remove task from local state immediately
    const originalTasks = [...tasks];
    setTasks((prevTasks) => prevTasks.filter(t => t.id !== id));

    try {
      // Delete the task from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own tasks

      if (error) {
        console.error("Failed to delete task from Supabase:", error);
        toast({
          variant: "destructive",
          title: "Verwijderen mislukt",
          description: error.message || "Kon de taak niet verwijderen uit de database.",
        });
        // Revert optimistic update on error
        setTasks(originalTasks);
        throw error; // Re-throw error
      }

      // Success: local state already updated optimistically
      toast({ // Optional: Show success toast
          title: "Taak verwijderd",
          description: "De taak is succesvol verwijderd.",
      });

    } catch (error) {
       // Catch potential errors from the try block or re-thrown errors
      console.error("Unexpected error deleting task:", error);
      if (!(error instanceof Error && error.message.includes("Kon de taak niet verwijderen"))) {
          toast({
            variant: "destructive",
            title: "Verwijderen mislukt",
            description: "Er is een onverwachte fout opgetreden bij het verwijderen.",
          });
      }
      // Ensure state is reverted if not already
      if (tasks !== originalTasks) {
          setTasks(originalTasks);
      }
      throw error; // Re-throw to allow UI to handle loading state etc.
    }

    // // OLD Local Storage Logic:
    // const updatedTasks = tasks.filter(t => t.id !== id);
    // setTasks(updatedTasks);
    // localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find(t => t.id === id);
  };

  const groupTasksByDate = (): TasksByDate => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + 3);
    
    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);

    return {
      today: tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      }),
      tomorrow: tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === tomorrow.getTime();
      }),
      dayAfterTomorrow: tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === dayAfterTomorrow.getTime();
      }),
      nextWeek: tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return (
          taskDate.getTime() >= nextWeekStart.getTime() && 
          taskDate.getTime() <= nextWeekEnd.getTime()
        );
      }),
      later: tasks.filter(task => {
        if (!task.deadline) return true;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() > nextWeekEnd.getTime();
      })
    };
  };

  const suggestPriority = async (title: string, description: string): Promise<TaskPriority> => {
    console.log("Suggesting priority for:", title, description);
    await new Promise(resolve => setTimeout(resolve, 300));
    const combinedText = (title + " " + (description || "")).toLowerCase();
    if (
      combinedText.includes("urgent") ||
      combinedText.includes("important") ||
      combinedText.includes("critical") ||
      combinedText.includes("asap")
    ) {
      return "high";
    } else if (
      combinedText.includes("soon") ||
      combinedText.includes("review") ||
      combinedText.includes("meeting")
    ) {
      return "medium";
    }
    return "low";
  };

  return (
    <TaskContext.Provider value={{ tasks, isLoading, createTask, updateTask, deleteTask, getTaskById, groupTasksByDate, suggestPriority }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }
  return context;
};
