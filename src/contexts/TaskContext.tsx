import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Task,
  SubTask,
  TaskStatus,
  TaskPriority,
  TasksByDate,
  DbTask,
} from "@/types/task.ts";
import { supabase } from "../integrations/supabase/client.ts";
import { Json } from "@/types/supabase.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { useTranslation } from "react-i18next";
import {
  MAX_FREE_USER_AI_SUBTASK_GENERATIONS,
  MAX_PAID_USER_AI_SUBTASK_GENERATIONS,
} from "@/constants/taskConstants.ts";
import { AiGenerationLimits } from "@/constants/databaseTables.ts";
import { 
  isToday, 
  isTomorrow, 
  isPast, 
  parseISO, 
  startOfDay, 
  differenceInCalendarDays,
} from "date-fns";
import { TaskContext } from "./TaskContext.context.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { tasksCache } from "@/lib/cache-utils.ts";
import { column, castTaskUpdate } from "@/lib/type-helpers.ts";

/**
 * Represents the structure for updating a task in the database.
 * All fields are optional.
 * @interface DbTaskUpdate
 */
interface DbTaskUpdate {
  /** The new title for the task. */
  title?: string;
  /** The new description for the task. */
  description?: string;
  /** The new priority for the task. */
  priority?: string;
  /** The new status for the task. */
  status?: string;
  /** The new category for the task, can be null. */
  category?: string | null;
  /** The new deadline for the task, can be null. */
  deadline?: string | null;
  /** The updated subtasks, stored as JSON. */
  subtasks?: Json;
  /** The new update timestamp. */
  updated_at?: string;
  /** The updated count of AI-generated subtasks. */
  ai_subtask_generation_count?: number;
  /** The new timestamp for when the task was last viewed, can be null. */
  last_viewed_at?: string | null;
  /** The new emoji for the task. */
  emoji?: string | null;
  /** The new favorite status for the task. */
  is_favorite?: boolean;
}

/**
 * Provides task management functionality to its children components.
 * Handles fetching, creating, updating, and deleting tasks and subtasks.
 *
 * @param {{ children: React.ReactNode }} props - The props for the component.
 * @param {React.ReactNode} props.children - The child components that will have access to the task context.
 * @returns {JSX.Element} The TaskProvider component.
 */
export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation(); 
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingAISubtasksMap, setIsGeneratingAISubtasksMap] = useState<
    Record<string, boolean>
  >({});
  const [lastResearchOutputs, setLastResearchOutputs] = useState<
    Record<string, string | undefined>
  >({});

  // State to store AI generation limits from database
  const [aiGenerationLimits, setAiGenerationLimits] = useState<AiGenerationLimits>({
    free_user_limit: MAX_FREE_USER_AI_SUBTASK_GENERATIONS,
    paid_user_limit: MAX_PAID_USER_AI_SUBTASK_GENERATIONS,
  });

  /**
   * Sets the AI subtask generation status for a specific task to true.
   * @param {string} taskId - The ID of the task.
   */
  const setIsGeneratingAISubtasks = (taskId: string) => {
    setIsGeneratingAISubtasksMap((prev) => ({ ...prev, [taskId]: true }));
  };

  /**
   * Clears the AI subtask generation status for a specific task (sets to false).
   * @param {string} taskId - The ID of the task.
   */
  const clearIsGeneratingAISubtasks = (taskId: string) => {
    setIsGeneratingAISubtasksMap((prev) => ({ ...prev, [taskId]: false }));
  };

  /**
   * Checks if AI subtasks are currently being generated for a specific task.
   * @param {string} taskId - The ID of the task.
   * @returns {boolean} True if AI subtasks are being generated, false otherwise.
   */
  const isGeneratingSubtasksForTask = (taskId: string): boolean => {
    return !!isGeneratingAISubtasksMap[taskId];
  };

  /**
   * Maps a database task object (DbTask) to a client-side Task object.
   * Handles parsing of subtasks and determining if a task is new.
   * @param {DbTask} dbTask - The database task object.
   * @returns {Task} The mapped client-side Task object.
   */
  const mapDbTaskToTask = (dbTask: DbTask): Task => {
    let parsedSubtasks: SubTask[] = [];
    
    try {
      if (Array.isArray(dbTask.subtasks)) {
        parsedSubtasks = dbTask.subtasks;
      } else if (dbTask.subtasks && typeof dbTask.subtasks === "string") {
        parsedSubtasks = JSON.parse(dbTask.subtasks);
      } else {
        // If it's an object but not an array (unlikely now, but for safety)
        // Or if it's null, parsedSubtasks remains an empty array.
      }
    } catch (error) {
      console.error(
        "Error parsing subtasks in mapDbTaskToTask:",
        error,
        "Subtasks received:",
        dbTask.subtasks
      );
      parsedSubtasks = [];
    }
    
    const createdAtDate = new Date(dbTask.created_at);
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    const viewedTaskIds = localStorage.getItem("viewedTaskIds");
    const viewedTasks = viewedTaskIds ? JSON.parse(viewedTaskIds) : [];
    const isViewedInLocalStorage = viewedTasks.includes(dbTask.id);
    
    const isNewTask =
      !dbTask.last_viewed_at &&
      !isViewedInLocalStorage &&
      createdAtDate > twentyFourHoursAgo;
    
    return {
      id: dbTask.id,
      userId: dbTask.user_id,
      title: dbTask.title,
      description: dbTask.description || "",
      priority: (dbTask.priority || "low") as TaskPriority,
      status: (dbTask.status || "todo") as TaskStatus,
      category: dbTask.category || undefined,
      deadline: dbTask.deadline
        ? new Date(dbTask.deadline).toISOString()
        : null,
      createdAt: new Date(dbTask.created_at).toISOString(),
      updatedAt: dbTask.updated_at
        ? new Date(dbTask.updated_at).toISOString()
        : new Date(dbTask.created_at).toISOString(),
      subtasks: parsedSubtasks,
      aiSubtaskGenerationCount: dbTask.ai_subtask_generation_count || 0,
      isNew: isNewTask,
      emoji: dbTask.emoji || undefined,
      isFavorite: dbTask.is_favorite || false,
    };
  };

  /**
   * Fetches tasks from the Supabase database for the authenticated user.
   * Sets the loading state and updates the tasks state.
   * Displays a toast notification on error.
   * This function is memoized using useCallback.
   */
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    // Cache key gebaseerd op gebruiker ID
    const cacheKey = `tasks_${session.user.id}`;

    try {
      // Gebruik cache of haal nieuwe data op
      const fetchAndTransformTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
          .eq(column('user_id'), session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
          throw error;
        }
  
        // Veilige type casting en transformatie
        const dbTasks = data || [];
        const transformedTasks: Task[] = dbTasks.map((dbTask) =>
          mapDbTaskToTask(dbTask as DbTask)
        );
        return transformedTasks;
      };

      // Gebruik de cache of haal data op
      const cachedTasks = await tasksCache.getOrFetch(cacheKey, fetchAndTransformTasks);
      setTasks(cachedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        variant: "destructive",
        title: t("taskContext.toast.fetchError"),
      });
      setTasks([]);
    } finally {
    setIsLoading(false);
    }
  }, [toast, t]);

  /**
   * useEffect hook to perform initial task fetching when the component mounts
   * or when `fetchTasks` changes. It also sets up a Supabase real-time subscription
   * to listen for changes in the 'tasks' table and re-fetches tasks if changes occur.
   * Cleans up the subscription when the component unmounts.
   */
  useEffect(() => {
    fetchTasks();
    
    // Alleen realtime gebruiken als er een gebruiker is ingelogd
    if (!user?.id) return;

    // Geoptimaliseerde Realtime subscription met specifieke filters
    // om alleen wijzigingen te volgen voor de huidige gebruiker
    const subscription = supabase
      .channel(`public:tasks:user_id=eq.${user.id}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "tasks",
          filter: `user_id=eq.${user.id}` // Alleen luisteren naar wijzigingen voor deze gebruiker
        },
        (payload) => {
          console.log("Realtime task update ontvangen:", payload.eventType);

          // Log to realtime_monitor
          const logRealtimeEvent = () => {
            if (!user?.id) return; // Ensure user.id is available
            try {
              // const entityName = `tasks_user_${user.id}`;
              // await supabase.rpc('log_request', {
              //   p_entity: entityName,
              //   p_duration_ms: 0, 
              //   p_result_count: 1, 
              //   p_has_cursor: false, 
              //   p_cursor_value: undefined // Gebruik undefined voor optionele parameter
              // });
            } catch (error) {
              console.error("Error logging realtime event to realtime_monitor:", error);
            }
          };
          logRealtimeEvent();

          // Alleen de hele lijst opnieuw ophalen bij INSERT en DELETE
          // Bij UPDATE alleen de specifieke taak bijwerken
          if (payload.eventType === 'UPDATE') {
            // Specifieke taak bijwerken in plaats van alles opnieuw op te halen
            const updatedTask = payload.new as DbTask;
            setTasks(prevTasks => {
              return prevTasks.map(task => 
                task.id === updatedTask.id 
                  ? mapDbTaskToTask(updatedTask) 
                  : task
              );
            });
          } else {
            // Voor INSERT en DELETE de volledige lijst opnieuw ophalen
            fetchTasks();
          }
        }
      )
      .subscribe();

    return () => {
      // Cleanup subscription wanneer de component unmount
      supabase.removeChannel(subscription);
    };
  }, [fetchTasks, user?.id]);

  /**
   * Fetches AI generation limits from the database when the component mounts
   */
  useEffect(() => {
    const fetchAiGenerationLimits = async () => {
      try {
        // System_settings exists in the database but not in the TypeScript definitions
        const { data, error } = await supabase
          // Table bestaat in de database maar niet in type definitie
          .from("system_settings")
          .select("setting_value")
          .eq(column('setting_name'), "ai_generation_limits")
          .single();

        if (error) {
          console.error("Error fetching AI generation limits:", error);
          return; // Use default values from constants
        }

        if (data) {
          interface SystemSettings {
            setting_value: AiGenerationLimits;
          }
          const settings = (data as unknown as SystemSettings).setting_value;
          if (settings) {
            setAiGenerationLimits(settings);
          }
        }
      } catch (err) {
        console.error("Exception fetching AI generation limits:", err);
        // Keep default values from constants
      }
    };

    fetchAiGenerationLimits();
  }, []);

  /**
   * Retrieves a specific task by its ID from the local state.
   * @param {string} id - The ID of the task to retrieve.
   * @returns {Task | undefined} The task object if found, otherwise undefined.
   */
  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((task: Task) => task.id === id);
  };

  /**
   * Adds a new task to the database and updates the local state.
   * @param {Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount' | 'isNew'> & { category?: string | null | undefined, emoji?: string | null | undefined }} task - The task object to add, omitting fields generated by the backend or context.
   * @returns {Promise<Task | undefined>} A promise that resolves with the newly created Task object or undefined if an error occurs.
   * @throws {Error} If the user is not authenticated or if a database error occurs.
   */
  const addTask = async (
    task: Omit<
      Task,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "subtasks"
      | "userId"
      | "aiSubtaskGenerationCount"
      | "isNew"
    > & {
      category?: string | null | undefined;
      emoji?: string | null | undefined;
    }
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user)
      throw new Error(t("taskContext.toast.notAuthenticated"));
    
    const dbTask = {
      title: task.title,
      description: task.description || null,
      priority: task.priority || "low",
      status: task.status || "todo",
      category: task.category || null,
      deadline: task.deadline || null,
      user_id: session.user.id,
      subtasks: JSON.stringify([]),
      ai_subtask_generation_count: 0,
      last_viewed_at: null,
      emoji: task.emoji || null,
    };
    
    const { data, error } = await supabase
      .from("tasks")
      .insert([dbTask])
      .select()
      .single();
    if (error) throw error;
    if (data) {
      // Type assertion voor data
      const newTask = mapDbTaskToTask((data as unknown) as DbTask);
      // Add the new task to the beginning of the array to show it first
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      return newTask;
    }
    return undefined;
  };

  /**
   * Maps a client-side Task update object to a database-compatible update object (DbTaskUpdate).
   * @param {Partial<Task>} taskUpdates - The partial task object containing updates.
   * @returns {DbTaskUpdate} The database-compatible update object.
   */
  const mapTaskToDbUpdate = (taskUpdates: Partial<Task>): DbTaskUpdate => {
    const dbRecord: DbTaskUpdate = {};
    if (taskUpdates.title !== undefined) dbRecord.title = taskUpdates.title;
    if (taskUpdates.description !== undefined)
      dbRecord.description = taskUpdates.description;
    if (taskUpdates.priority !== undefined)
      dbRecord.priority = taskUpdates.priority;
    if (taskUpdates.status !== undefined) dbRecord.status = taskUpdates.status;
    if (taskUpdates.category !== undefined)
      dbRecord.category = taskUpdates.category;
    if (taskUpdates.deadline !== undefined)
      dbRecord.deadline = taskUpdates.deadline;
    if (taskUpdates.emoji !== undefined) dbRecord.emoji = taskUpdates.emoji;
    if (taskUpdates.isFavorite !== undefined) {
      dbRecord.is_favorite = taskUpdates.isFavorite;
    }
    if (taskUpdates.subtasks !== undefined) {
        try {
        if (typeof taskUpdates.subtasks === "string") {
                JSON.parse(taskUpdates.subtasks);
                dbRecord.subtasks = taskUpdates.subtasks as unknown as Json;
            } else {
          dbRecord.subtasks = JSON.stringify(
            taskUpdates.subtasks
          ) as unknown as Json;
            }
        } catch (error) {
            dbRecord.subtasks = JSON.stringify([]) as unknown as Json;
        }
    }
    if (taskUpdates.aiSubtaskGenerationCount !== undefined)
      dbRecord.ai_subtask_generation_count =
        taskUpdates.aiSubtaskGenerationCount;
    return dbRecord;
  };

  /**
   * Updates an existing task in the database and updates the local state.
   * Displays toast notifications for success or failure.
   * @param {string} id - The ID of the task to update.
   * @param {Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>} updates - An object containing the properties to update.
   * @throws {Error} If the task is not found or if a database error occurs.
   */
  const updateTask = async (
    id: string,
    updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "userId">>
  ) => {
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("taskContext.toast.taskNotFound", { taskId: id }),
      });
      throw new Error(t("taskContext.toast.taskNotFound", { taskId: id }));
    }
    const originalTask = tasks[taskIndex];
    const now = new Date().toISOString();
    const updatedTaskForUI: Task = {
      ...originalTask,
      ...updates,
      updatedAt: now,
    };

    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? updatedTaskForUI : t))
    );

    try {
      const dbUpdates = mapTaskToDbUpdate(updates);
      
      const { error } = await supabase
        .from("tasks")
        .update(castTaskUpdate(dbUpdates))
        .eq(column('id'), id)
        .select("*");

      if (error) {
        toast({
          variant: "destructive",
          title: t("common.error"),
          description: t("taskContext.toast.updateTaskFailedSimple"),
        });
        throw error;
      }
    } catch (exception) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("taskContext.toast.updateTaskFailedGeneral"),
      });
      throw exception;
    }
  };

  /**
   * Deletes a task from the database and updates the local state.
   * Displays toast notifications for success or failure.
   * @param {string} id - The ID of the task to delete.
   * @throws {Error} If a database error occurs.
   */
  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq(column('id'), id);
    if (error) throw error;
    
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id));
  };
  
  /**
   * Adds a subtask to a specified task in the database and updates the local state.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskTitle - The title of the new subtask.
   * @param {string} [subtaskDescription] - Optional description for the new subtask.
   * @throws {Error} If the parent task is not found or if a database error occurs.
   */
  const addSubtask = async (
    taskId: string,
    subtaskTitle: string,
    subtaskDescription?: string
  ) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    
    const newSubtask: SubTask = {
      id: uuidv4(),
      taskId,
      title: subtaskTitle,
      description: subtaskDescription || "",
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    const updatedSubtasks = [...task.subtasks, newSubtask];
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };
  
  /**
   * Updates an existing subtask for a specified task in the database and local state.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to update.
   * @param {Partial<Omit<SubTask, 'id' | 'taskId' | 'createdAt'>>} updates - An object containing the properties to update on the subtask.
   * @throws {Error} If the parent task or subtask is not found, or if a database error occurs.
   */
  const updateSubtask = async (
    taskId: string,
    subtaskId: string,
    updates: Partial<Omit<SubTask, "id" | "taskId" | "createdAt">>
  ) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId
        ? { ...st, ...updates, updatedAt: new Date().toISOString() }
        : st
    );
    
    await updateTask(taskId, { subtasks: updatedSubtasks });

    // Check if all subtasks are completed
    if (updatedSubtasks.length > 0) {
      const allSubtasksCompleted = updatedSubtasks.every(
        (subtask) => subtask.completed
      );
      
      // If all subtasks are completed and the task itself is not yet completed
      if (allSubtasksCompleted && task.status !== "done") {
        // Mark the task as completed and set priority to 'none'
        await updateTask(taskId, {
          status: "done",
          priority: "none",
        });

        // Show a confirmation message
        toast({
          title: t("taskContext.toast.autoCompleted.title"),
          description: t("taskContext.toast.autoCompleted.description"),
        });
      } 
      // If NOT all subtasks are completed and the task was automatically completed (i.e., status=done and priority=none)
      else if (
        !allSubtasksCompleted &&
        task.status === "done" &&
        task.priority === "none"
      ) {
        // Restore the task to 'in_progress' status with 'medium' priority
        await updateTask(taskId, {
          status: "in_progress",
          priority: "medium",
        });

        // Show a confirmation message
        toast({
          title: t(
            "taskContext.toast.priorityRestored.title",
            "Taak opnieuw actief"
          ),
          description: t(
            "taskContext.toast.priorityRestored.description",
            "De taak is opnieuw actief gemaakt omdat niet alle subtaken voltooid zijn"
          ),
        });
      }
    }
  };

  /**
   * Deletes a subtask from a specified task in the database and updates the local state.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskId - The ID of the subtask to delete.
   * @throws {Error} If the parent task is not found or if a database error occurs.
   */
  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    
    const updatedSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };
  
  /**
   * Deletes all subtasks associated with a specific task from the database and updates local state.
   * @param {string} taskId - The ID of the task whose subtasks are to be deleted.
   * @throws {Error} If the task is not found or if a database error occurs.
   */
  const deleteAllSubtasks = async (taskId: string) => {
    await updateTask(taskId, { subtasks: [] });
  };
  
  /**
   * Toggles the completion status of a task.
   * @param {string} taskId - The ID of the task.
   * @param {boolean} completed - The new completion status (true for completed, false for incomplete).
   */
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? "done" : "todo" });
  };
  
  /**
   * Expands a task by generating subtasks using an AI model.
   * Updates the task with the generated subtasks and increments the AI generation count.
   * Handles loading states and displays toast notifications for success, failure, or limits.
   * @param {string} taskId - The ID of the task to expand with AI-generated subtasks.
   * @param {Task | undefined} initialTaskData - Optional initial task data to use if the task is not found in the local state.
   * @throws {Error} If the task is not found, user is not authenticated, or an API error occurs.
   */
  const expandTask = async (taskId: string, initialTaskData?: Task, languagePreference?: string) => {
    const taskToExpand = initialTaskData || tasks.find((t) => t.id === taskId);

    if (!taskToExpand) {
      console.error(`[TaskContext] expandTask: Task with id ${taskId} not found.`);
      toast({
        variant: "destructive",
        title: t("taskContext.toast.taskNotFound.title"),
        description: t("taskContext.toast.taskNotFound.description", { taskId }),
      });
      return;
    }

    if (isGeneratingSubtasksForTask(taskId)) {
      toast({
        title: t("taskContext.toast.alreadyGenerating.title"),
        description: t("taskContext.toast.alreadyGenerating.description"),
      });
      return;
    }

    const isDeepResearch = taskToExpand.category === 'Diepgaand Onderzoek'; // Of een andere indicator

    // Check AI generation limits if not deep research
    if (!isDeepResearch && isAiGenerationLimitReached(taskToExpand)) {
      toast({
        variant: "destructive",
        title: t("taskContext.toast.limitReached.title"),
        description: t("taskContext.toast.limitReached.description", {
          limit: getMaxAiGenerationsForUser(),
        }),
      });
      return;
    }

    setIsGeneratingAISubtasks(taskId);

    try {
      const functionName = isDeepResearch ? 'deep-research' : 'generate-subtasks';
      // console.log(`[TaskContext] Invoking ${functionName} for task: ${taskToExpand.title}`);


      const requestBody: { 
        taskId: string; 
        taskTitle: string; 
        taskDescription?: string; 
        existingSubtasks?: SubTask[];
        languagePreference?: string; // Add languagePreference here
      } = {
        taskId: taskToExpand.id,
        taskTitle: taskToExpand.title,
        taskDescription: taskToExpand.description,
        existingSubtasks: taskToExpand.subtasks,
      };

      if (languagePreference) {
        requestBody.languagePreference = languagePreference;
      }
      
      const { data: newSubtasksData, error: invokeError } =
        await supabase.functions.invoke<{ subtasks?: SubTask[], researchOutput?: string, error?: string }>(functionName, {
          body: requestBody,
        });

      if (invokeError) {
        console.error(`[TaskContext] Error invoking ${functionName}:`, invokeError);
        throw invokeError;
      }

      if (newSubtasksData?.error) {
        console.error(`[TaskContext] Error from ${functionName} function:`, newSubtasksData.error);
        throw new Error(newSubtasksData.error);
      }
      
      let updatedSubtasks: SubTask[] = taskToExpand.subtasks;

      if (isDeepResearch && newSubtasksData?.researchOutput) {
        // console.log("[TaskContext] Deep research output received:", newSubtasksData.researchOutput);
        setLastResearchOutputs(prev => ({...prev, [taskId]: newSubtasksData.researchOutput}));
        // For deep research, we might not get subtasks directly, or we might.
        // If subtasks are also returned by deep-research, handle them:
        if (newSubtasksData.subtasks && Array.isArray(newSubtasksData.subtasks)) {
            const incomingSubtasks = newSubtasksData.subtasks.map((st) => ({
              ...st,
              id: st.id || uuidv4(), // Ensure ID exists
              taskId: taskToExpand.id,
              completed: st.completed || false,
              createdAt: st.createdAt || new Date().toISOString(),
            }));
            updatedSubtasks = [...taskToExpand.subtasks, ...incomingSubtasks];
        }

      } else if (!isDeepResearch && newSubtasksData?.subtasks && Array.isArray(newSubtasksData.subtasks)) {
        // console.log("[TaskContext] Subtasks received from generate-subtasks:", newSubtasksData.subtasks);
        const incomingSubtasks = newSubtasksData.subtasks.map((st) => ({
          ...st,
          id: st.id || uuidv4(), // Ensure ID exists
          taskId: taskToExpand.id,
          completed: st.completed || false,
          createdAt: st.createdAt || new Date().toISOString(),
        }));
        updatedSubtasks = [...taskToExpand.subtasks, ...incomingSubtasks];
      } else if (!isDeepResearch) {
        // Handle case where generate-subtasks might not return subtasks as expected
        console.warn(`[TaskContext] ${functionName} did not return expected subtasks array.`);
      }


      // Optimistic update for subtasks in local state
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { 
                ...taskToExpand, // Use the taskToExpand which has the full data before this operation
                subtasks: updatedSubtasks, 
                // Increment count only if it was not deep research
                aiSubtaskGenerationCount: isDeepResearch ? taskToExpand.aiSubtaskGenerationCount : (taskToExpand.aiSubtaskGenerationCount || 0) + 1,
                updatedAt: new Date().toISOString(), 
              }
            : t
        )
      );
      
      // Update the database with the new subtasks and potentially incremented count
      const dbUpdates: DbTaskUpdate = {
        subtasks: updatedSubtasks as unknown as Json, // Cast, assuming subtasks structure is JSON compatible
        updated_at: new Date().toISOString(),
      };
      if (!isDeepResearch) {
        dbUpdates.ai_subtask_generation_count = (taskToExpand.aiSubtaskGenerationCount || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from("tasks")
        .update(dbUpdates)
        .eq(column("id"), taskId);

      if (updateError) {
        console.error("[TaskContext] Error updating task with new subtasks in DB:", updateError);
        // Potentially revert optimistic update or notify user
        toast({
          variant: "destructive",
          title: t("taskContext.toast.subtaskUpdateError.title"),
          description: t("taskContext.toast.subtaskUpdateError.description"),
        });
      } else {
        // console.log("[TaskContext] Task updated successfully in DB with new subtasks/research.");
        if (!isDeepResearch) {
          toast({
            title: t("taskContext.toast.subtasksGenerated.title"),
            description: t("taskContext.toast.subtasksGenerated.description"),
          });
        } else {
           toast({
            title: t("taskContext.toast.researchCompleted.title"),
            description: t("taskContext.toast.researchCompleted.description"),
          });
        }
      }
    } catch (error) {
      console.error("[TaskContext] General error in expandTask:", error);
      const errorMessage = error instanceof Error ? error.message : t("taskContext.toast.subtaskGenerationFailed.default");
      toast({
        variant: "destructive",
        title: t("taskContext.toast.subtaskGenerationFailed.title"),
        description: errorMessage,
      });
    } finally {
      clearIsGeneratingAISubtasks(taskId);
    }
  };

  /**
   * Promotes a subtask to a new main task.
   * @param {string} parentTaskId - The ID of the parent task from which the subtask originates.
   * @param {string} subtaskId - The ID of the subtask to promote.
   * @returns {Promise<Task | undefined>} A promise that resolves with the newly created main task, or undefined on failure.
   * @throws {Error} If subtask cannot be found or task creation fails.
   */
  const promoteSubtaskToTask = async (
    parentTaskId: string,
    subtaskId: string
  ): Promise<Task | undefined> => {
    const task = getTaskById(parentTaskId);
    if (!task) {
      throw new Error("Parent task not found");
    }

    const subtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!subtask) {
      throw new Error("Subtask not found");
    }

    // Create a new main task based on the subtask
    try {
      // Maintain the priority, category, etc. of the main task
      // If there is no description, use the title as the description
      const subtaskDescription =
        subtask.description && subtask.description.trim() !== ""
          ? subtask.description
          : subtask.title;

      const newTask = await addTask({
        title: subtask.title,
        description: subtaskDescription,
        priority: task.priority,
        status: subtask.completed ? "done" : "todo",
        category: task.category,
        deadline: task.deadline,
        emoji: task.emoji,
      });

      if (newTask) {
        // Remove the subtask from the original task
        await deleteSubtask(parentTaskId, subtaskId);
        return newTask;
      }
      return undefined;
    } catch (error) {
      console.error("Error promoting subtask to task:", error);
      throw error;
    }
  };

  /**
   * Groups tasks based on their deadline into categories: overdue, today, tomorrow, upcoming, and someday.
   * @returns {TasksByDate} An object where keys are date categories and values are arrays of tasks.
   */
  const groupTasksByDate = (): TasksByDate => {
    const today = startOfDay(new Date());
    
    const grouped: TasksByDate = {
      completed: [],
      overdue: [],
      today: [],
      tomorrow: [],
      dayAfterTomorrow: [],
      nextWeek: [],
      later: [],
      favorites: [],
    };
    
    tasks.forEach((task) => {
      // First, check if task is completed and add to 'completed' category
      if (task.status === "done") {
        grouped.completed.push(task);
        return;
      }
      
      if (task.isFavorite) {
        grouped.favorites.push(task);
        return;
      }
      
      if (!task.deadline) {
        grouped.later.push(task);
        return;
      }
      
      try {
        const deadlineDate = parseISO(task.deadline);
        
        if (isPast(deadlineDate) && !isToday(deadlineDate)) {
          grouped.overdue.push(task);
        } else if (isToday(deadlineDate)) {
          grouped.today.push(task);
        } else if (isTomorrow(deadlineDate)) {
          grouped.tomorrow.push(task);
        } else {
          const diffDays = differenceInCalendarDays(deadlineDate, today);
          if (diffDays === 2) {
            grouped.dayAfterTomorrow.push(task);
          } else if (diffDays > 2 && diffDays <= 7) {
            grouped.nextWeek.push(task);
          } else {
            grouped.later.push(task);
          }
        }
      } catch (e) {
        // If the date cannot be parsed, treat it as 'no deadline'
        grouped.later.push(task);
      }
    });
    
    return grouped;
  };

  /**
   * Marks a task as viewed by setting its `last_viewed_at` timestamp.
   * This also updates the task in the local state to reflect that it's no longer "new".
   * @param {string} id - The ID of the task to mark as viewed.
   */
  const markTaskAsViewed = (id: string) => {
    const taskIndex = tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return Promise.resolve(); // Task not found, return empty Promise
    }
    
    // Update local state immediately for responsiveness
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, isNew: false } : t))
    );
    
    try {
      // Store in localStorage as a temporary solution until backend `last_viewed_at` is consistently updated/used
      const viewedTaskIds = localStorage.getItem("viewedTaskIds");
      const viewedTasks = viewedTaskIds ? JSON.parse(viewedTaskIds) : [];
      
      if (!viewedTasks.includes(id)) {
        viewedTasks.push(id);
        localStorage.setItem("viewedTaskIds", JSON.stringify(viewedTasks));
      }
    } catch (e) {
      // Error with localStorage, ignore. This is a non-critical enhancement.
    }
    
    return Promise.resolve();
    // Database update for `last_viewed_at` is temporarily removed.
    // It was causing issues or was not fully implemented with `DbTaskUpdate`.
    // The `isNew` flag is primarily handled by frontend logic (creation time + localStorage).
  };
  
  /**
   * Retrieves the maximum number of AI subtask generations allowed for the current user.
   * Differentiates between free, paid and admin users.
   * Admins have an effectively unlimited number of generations.
   * @returns {number} The maximum number of AI generations.
   */
  const getMaxAiGenerationsForUser = (): number => {
    if (user?.role === "admin") {
      return Number.MAX_SAFE_INTEGER; // Effectively infinite for admins
    }
    const isPaidUser = user?.role === "paid";
    return isPaidUser
      ? aiGenerationLimits.paid_user_limit
      : aiGenerationLimits.free_user_limit;
  };

  /**
   * Checks if the AI generation limit for subtasks has been reached for a given task.
   * @param {Task} task - The task object to check.
   * @returns {boolean} True if the limit has been reached, false otherwise.
   */
  const isAiGenerationLimitReached = (task: Task): boolean => {
    const currentCount = task.aiSubtaskGenerationCount || 0;
    return currentCount >= getMaxAiGenerationsForUser();
  };

  /**
   * Stores the text output of the last completed deep research for a specific task.
   *
   * @param {string} taskId - The ID of the task.
   * @param {string} researchText - The text content of the research output.
   */
  const setLastResearchOutput = (taskId: string, researchText: string) => {
    setLastResearchOutputs((prev) => ({ ...prev, [taskId]: researchText }));
  };

  /**
   * Retrieves the text output of the last completed deep research for a specific task.
   *
   * @param {string} taskId - The ID of the task.
   * @returns {string | undefined} The research text if available, otherwise undefined.
   */
  const getLastResearchOutput = (taskId: string): string | undefined => {
    return lastResearchOutputs[taskId];
  };

  /**
   * Toggles the favorite status of a task.
   * @param {string} taskId - The ID of the task to toggle.
   */
  const toggleFavorite = async (taskId: string) => {
    const task = getTaskById(taskId);
    if (!task) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("taskContext.toast.taskNotFound", { taskId }),
      });
      return;
    }
    await updateTask(taskId, { isFavorite: !task.isFavorite });
  };

  /**
   * The value provided to the TaskContext.
   * Includes the task list, loading state, and various functions to manage tasks and their properties.
   */
  const contextValue = {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    deleteAllSubtasks,
    toggleTaskCompletion,
    expandTask,
    isGeneratingSubtasksForTask,
    groupTasksByDate,
    getMaxAiGenerationsForUser,
    isAiGenerationLimitReached,
    markTaskAsViewed,
    toggleFavorite,
    setLastResearchOutput,
    getLastResearchOutput,
    promoteSubtaskToTask,
  };

  return (
    <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>
  );
}

export interface TaskContextType {
  tasks: Task[];
  isLoading: boolean;
  addTask: (
    task: Omit<
      Task,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "subtasks"
      | "userId"
      | "aiSubtaskGenerationCount"
      | "isNew"
    > & {
      category?: string | null | undefined;
      emoji?: string | null | undefined;
    }
  ) => Promise<Task | undefined>;
  updateTask: (
    id: string,
    updates: Partial<Omit<Task, "id" | "createdAt" | "updatedAt" | "userId">>
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  addSubtask: (
    taskId: string,
    subtaskTitle: string,
    subtaskDescription?: string
  ) => Promise<void>;
  updateSubtask: (
    taskId: string,
    subtaskId: string,
    updates: Partial<Omit<SubTask, "id" | "taskId" | "createdAt">>
  ) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteAllSubtasks: (taskId: string) => Promise<void>;
  toggleTaskCompletion: (taskId: string, completed: boolean) => Promise<void>;
  expandTask: (taskId: string, initialTaskData?: Task, languagePreference?: string) => Promise<void>;
  isGeneratingSubtasksForTask: (taskId: string) => boolean;
  groupTasksByDate: () => TasksByDate;
  getMaxAiGenerationsForUser: () => number;
  isAiGenerationLimitReached: (task: Task) => boolean;
  markTaskAsViewed: (id: string) => void; // Should be Promise<void> if it becomes async
  toggleFavorite: (taskId: string) => Promise<void>;
  setLastResearchOutput: (taskId: string, researchText: string) => void;
  getLastResearchOutput: (taskId: string) => string | undefined;
  promoteSubtaskToTask: (
    parentTaskId: string,
    subtaskId: string
  ) => Promise<Task | undefined>;
}
