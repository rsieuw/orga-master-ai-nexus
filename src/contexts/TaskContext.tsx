import { useState, useEffect } from "react";
import { Task, TaskPriority, TaskStatus, TasksByDate, SubTask } from "../types/task.ts";
import { useAuth } from "./AuthContext.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { v4 as uuidv4 } from 'uuid';
// Import the context and props type from the hooks file
import { TaskContext, type TaskContextProps } from "./TaskContext.hooks.ts";

// Define the structure of the raw data fetched from Supabase
interface FetchedTaskData {
  id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  deadline?: string | null;
  user_id: string;
  created_at: string;
  subtasks?: unknown | null; // Keep as unknown for initial fetch, cast later
}

// Define a type for the fields that can be updated in the database
// Use database column names (e.g., user_id)
// Ensure subtasks are handled correctly if they are stored as JSONB or similar
type TaskDatabaseUpdatePayload = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: string | null;
  subtasks?: SubTask[];
};

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
          const mappedTasks = fetchedTasks.map((task: FetchedTaskData) => ({
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
      } catch (error: unknown) {
        console.error("Tasks: Unexpected error loading tasks:", error);
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
      const taskToUpdate: TaskDatabaseUpdatePayload = {};
      if (taskData.title !== undefined) taskToUpdate.title = taskData.title;
      if (taskData.description !== undefined) taskToUpdate.description = taskData.description;
      if (taskData.priority !== undefined) taskToUpdate.priority = taskData.priority;
      if (taskData.status !== undefined) taskToUpdate.status = taskData.status;
      if (taskData.deadline !== undefined) {
        taskToUpdate.deadline = taskData.deadline ? new Date(taskData.deadline).toISOString() : '';
      }
      if (taskData.subtasks !== undefined) {
         taskToUpdate.subtasks = taskData.subtasks;
      }

      if (Object.keys(taskToUpdate).length === 0) {
        console.log("No changes detected for update.");
        const currentTask = tasks.find((t: Task) => t.id === id);
        if (!currentTask) throw new Error("Task not found for no-op update");
        return currentTask;
      }

      const payloadForSupabase: TaskDatabaseUpdatePayload = { ...taskToUpdate };
      if (payloadForSupabase.deadline === '') {
         payloadForSupabase.deadline = null;
      }

      const { data: updatedTaskData, error } = await supabase
        .from('tasks')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(payloadForSupabase as any)
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
          prevTasks.map((task: Task) =>
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

    const originalTasks = [...tasks];
    setTasks((prevTasks) => prevTasks.filter(t => t.id !== id));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error("Failed to delete task from Supabase:", error);
        toast({
          variant: "destructive",
          title: "Verwijderen mislukt",
          description: error.message || "Kon de taak niet verwijderen uit de database.",
        });
        setTasks(originalTasks);
        throw error;
      }

      toast({
          title: "Taak verwijderd",
          description: "De taak is succesvol verwijderd.",
      });

    } catch (error) {
       console.error("Unexpected error deleting task:", error);
      if (!(error instanceof Error && error.message.includes("Kon de taak niet verwijderen"))) {
          toast({
            variant: "destructive",
            title: "Verwijderen mislukt",
            description: "Er is een onverwachte fout opgetreden bij het verwijderen.",
          });
      }
      if (tasks !== originalTasks) {
          setTasks(originalTasks);
      }
      throw error;
    }
  };

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((t: Task) => t.id === id);
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
      overdue: tasks.filter(task => {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() < today.getTime();
      }),
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
    console.warn(`suggestPriority is a placeholder for: ${title} / ${description}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const priorities: TaskPriority[] = ['high', 'medium', 'low'];
    return priorities[Math.floor(Math.random() * priorities.length)];
  };

  const generateSubtasksAI = async (taskId: string): Promise<SubTask[]> => {
    const task = tasks.find((t: Task) => t.id === taskId);
    if (!task) {
      console.error("Task not found for AI generation");
      toast({ variant: "destructive", title: "Fout", description: "Taak niet gevonden om subtaken te genereren." });
      return [];
    }

    console.log(`Calling generate-subtasks function for task: ${task.id}`);

    try {
      // Voorbereiden van de data voor de Edge Function
      const taskDetails = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        deadline: task.deadline,
        // TODO: Voeg eventueel chat context toe (zie Edge Function)
      };

      // Aanroepen van de Edge Function
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: taskDetails,
      });

      if (error) {
        throw error; // Wordt opgevangen door de catch hieronder
      }

      // Verwerken van de response
      if (data?.error) { // Check voor functionele errors vanuit de Edge Function
        throw new Error(data.error);
      }

      if (!data?.subtasks || !Array.isArray(data.subtasks)) {
        console.error("Ongeldige response van generate-subtasks function:", data);
        throw new Error("Ongeldig antwoord ontvangen van de AI-subtaak generator.");
      }

      // Map de suggesties naar het SubTask formaat
      const generatedSubtasks: SubTask[] = data.subtasks.map((suggestion: { title: string }) => ({
        id: uuidv4(),
        taskId: taskId,
        title: suggestion.title,
        completed: false,
      }));

      console.log(`Successfully generated ${generatedSubtasks.length} subtasks via AI.`);
      return generatedSubtasks;

    } catch (error: unknown) {
      console.error("Error calling generate-subtasks function:", error);
      const errorMessage = error instanceof Error ? error.message : "Onbekende fout bij genereren subtaken";
      toast({
        variant: "destructive",
        title: "Genereren Mislukt",
        description: errorMessage,
      });
      return []; // Return lege array bij fout
    }
  };

  const addSubtask = async (taskId: string, title: string): Promise<void> => {
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex === -1) {
      toast({ variant: "destructive", title: "Taak niet gevonden" });
      return;
    }

    const newSubtask: SubTask = {
      id: uuidv4(),
      taskId: taskId,
      title,
      completed: false,
    };

    const updatedTasks = [...tasks];
    const currentSubtasks = updatedTasks[taskIndex].subtasks || [];
    const updatedSubtasks = [...currentSubtasks, newSubtask];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], subtasks: updatedSubtasks };

    setTasks(updatedTasks);

    try {
      await updateTask(taskId, { subtasks: updatedSubtasks });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subtaak opslaan mislukt",
        description: "Kon de subtaak niet synchroniseren met de database.",
      });
      setTasks(tasks);
    }
  };

  const updateSubtask = async (taskId: string, subtaskId: string, updates: Partial<Omit<SubTask, 'id' | 'taskId'>>): Promise<void> => {
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex === -1) {
      toast({ variant: "destructive", title: "Taak niet gevonden" });
      return;
    }

    const originalTask = tasks[taskIndex];
    const originalSubtasks = originalTask.subtasks || [];
    const subtaskIndex = originalSubtasks.findIndex((st: SubTask) => st.id === subtaskId);

    if (subtaskIndex === -1) {
      toast({ variant: "destructive", title: "Subtaak niet gevonden" });
      return;
    }

    const updatedTasks = [...tasks];
    const updatedSubtasks = [...originalSubtasks];
    updatedSubtasks[subtaskIndex] = { ...updatedSubtasks[subtaskIndex], ...updates };
    updatedTasks[taskIndex] = { ...originalTask, subtasks: updatedSubtasks };

    setTasks(updatedTasks);

    try {
      await updateTask(taskId, { subtasks: updatedSubtasks });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subtaak bijwerken mislukt",
        description: "Kon de wijzigingen niet synchroniseren met de database.",
      });
      setTasks(tasks);
    }
  };

  const deleteSubtask = async (taskId: string, subtaskId: string): Promise<void> => {
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex === -1) {
      toast({ variant: "destructive", title: "Taak niet gevonden" });
      return;
    }

    const originalTask = tasks[taskIndex];
    const originalSubtasks = originalTask.subtasks || [];
    const updatedSubtasks = originalSubtasks.filter((st: SubTask) => st.id !== subtaskId);

    if (updatedSubtasks.length === originalSubtasks.length) {
         toast({ variant: "destructive", title: "Subtaak niet gevonden" });
         return;
    }

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...originalTask, subtasks: updatedSubtasks };

    setTasks(updatedTasks);

    try {
      await updateTask(taskId, { subtasks: updatedSubtasks });
      toast({ title: "Subtaak verwijderd" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subtaak verwijderen mislukt",
        description: "Kon de subtaak niet verwijderen uit de database.",
      });
      setTasks(tasks);
    }
  };

  const deleteAllSubtasks = async (taskId: string): Promise<void> => {
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex === -1) {
      toast({ variant: "destructive", title: "Taak niet gevonden" });
      return;
    }

    const originalTask = tasks[taskIndex];
    if (!originalTask.subtasks || originalTask.subtasks.length === 0) {
      toast({ title: "Geen subtaken", description: "Er zijn geen subtaken om te verwijderen." });
      return; // No subtasks to delete
    }

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = { ...originalTask, subtasks: [] }; // Clear subtasks locally

    setTasks(updatedTasks); // Optimistic update

    try {
      await updateTask(taskId, { subtasks: [] }); // Update in database
      toast({ title: "Alle subtaken verwijderd" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verwijderen mislukt",
        description: "Kon de subtaken niet verwijderen uit de database.",
      });
      // Revert optimistic update on error
      setTasks(tasks.map(t => t.id === taskId ? originalTask : t));
    }
  };

  const expandTask = async (taskId: string): Promise<void> => {
    const taskIndex = tasks.findIndex((t: Task) => t.id === taskId);
    if (taskIndex === -1) {
      toast({ variant: "destructive", title: "Taak niet gevonden" });
      throw new Error("Task not found for expansion");
    }
    
    const originalTask = tasks[taskIndex];
    
    try {
      const generatedSubtasks = await generateSubtasksAI(taskId);
      
      if (generatedSubtasks.length === 0) {
        toast({ title: "Geen subtaken gegenereerd", description: "De AI kon geen subtaken voorstellen." });
        return;
      }
      
      const currentSubtasks = originalTask.subtasks || [];
      const combinedSubtasks = [...currentSubtasks, ...generatedSubtasks];
      
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = { ...originalTask, subtasks: combinedSubtasks };
      setTasks(updatedTasks);
      
      await updateTask(taskId, { subtasks: combinedSubtasks });
      
      toast({ title: "Subtaken gegenereerd", description: `${generatedSubtasks.length} nieuwe subtaken toegevoegd.` });
      
    } catch (error) {
      console.error("Error expanding task with AI:", error);
      toast({ variant: "destructive", title: "Genereren mislukt", description: "Kon geen AI subtaken genereren." });
      setTasks(prevTasks => prevTasks.map((t: Task) => t.id === taskId ? originalTask : t));
      throw error;
    }
  };

  const contextValue: TaskContextProps = {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    groupTasksByDate,
    suggestPriority,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    expandTask,
    deleteAllSubtasks,
  };

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>;
}
