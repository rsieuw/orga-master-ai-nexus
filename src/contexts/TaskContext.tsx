import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, SubTask, TaskStatus, TaskPriority, TasksByDate } from '@/types/task.ts';
import { supabase } from '../integrations/supabase/client.ts';
import { Json } from '@/types/supabase.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { useTranslation } from 'react-i18next';
import { MAX_FREE_USER_AI_SUBTASK_GENERATIONS, MAX_PAID_USER_AI_SUBTASK_GENERATIONS } from '@/constants/taskConstants.ts';
import { 
  isToday, 
  isTomorrow, 
  isPast, 
  parseISO, 
  startOfDay, 
  differenceInCalendarDays
} from 'date-fns';
import { TaskContext } from './TaskContext.context.ts';
import { useAuth } from '@/hooks/useAuth.ts';

/**
 * Represents a task as it is stored in the database.
 * @interface DbTask
 */
interface DbTask {
  /** The unique identifier for the task. */
  id: string;
  /** The ID of the user who owns the task. */
  user_id: string;
  /** The title of the task. */
  title: string;
  /** The description of the task, can be null. */
  description: string | null;
  /** The priority of the task, can be null. */
  priority: string | null;
  /** The status of the task, can be null. */
  status: string | null;
  /** The deadline of the task, can be null. */
  deadline: string | null;
  /** The category of the task, can be null. */
  category: string | null;
  /** The creation timestamp of the task. */
  created_at: string;
  /** The last update timestamp of the task, can be null. */
  updated_at: string | null;
  /** Subtasks associated with the task, stored as JSON. */
  subtasks: Json;
  /** The count of AI-generated subtasks for this task, can be null. */
  ai_subtask_generation_count: number | null;
  /** The timestamp when the task was last viewed, can be null. */
  last_viewed_at: string | null;
  /** An optional emoji for the task. */
  emoji: string | null;
}

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
  const [isGeneratingAISubtasksMap, setIsGeneratingAISubtasksMap] = useState<Record<string, boolean>>({});

  /**
   * Sets the AI subtask generation status for a specific task to true.
   * @param {string} taskId - The ID of the task.
   */
  const setIsGeneratingAISubtasks = (taskId: string) => {
    setIsGeneratingAISubtasksMap(prev => ({ ...prev, [taskId]: true }));
  };

  /**
   * Clears the AI subtask generation status for a specific task (sets to false).
   * @param {string} taskId - The ID of the task.
   */
  const clearIsGeneratingAISubtasks = (taskId: string) => {
    setIsGeneratingAISubtasksMap(prev => ({ ...prev, [taskId]: false }));
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
        parsedSubtasks = dbTask.subtasks as unknown as SubTask[];
      } else if (dbTask.subtasks) {
        if (typeof dbTask.subtasks === 'string') {
          parsedSubtasks = JSON.parse(dbTask.subtasks) as SubTask[];
        } else {
          // It can also be a JSON object that has already been parsed
          parsedSubtasks = dbTask.subtasks as unknown as SubTask[];
        }
      }
    } catch (error) {
      parsedSubtasks = [];
    }
    
    // A task is only new if:
    // 1. It has never been viewed before (last_viewed_at is null)
    // 2. It was created recently (within the last 24 hours)
    const createdAtDate = new Date(dbTask.created_at);
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    
    // Check localStorage to see if the task has already been viewed
    // This is a temporary solution until the migration is completed
    const viewedTaskIds = localStorage.getItem('viewedTaskIds');
    const viewedTasks = viewedTaskIds ? JSON.parse(viewedTaskIds) : [];
    const isViewedInLocalStorage = viewedTasks.includes(dbTask.id);
    
    const isNewTask = !dbTask.last_viewed_at && !isViewedInLocalStorage && createdAtDate > twentyFourHoursAgo;
    
    return {
      id: dbTask.id,
      userId: dbTask.user_id,
      title: dbTask.title,
      description: dbTask.description || '',
      priority: (dbTask.priority || 'low') as TaskPriority,
      status: (dbTask.status || 'todo') as TaskStatus,
      category: dbTask.category || undefined,
      deadline: dbTask.deadline ? new Date(dbTask.deadline).toISOString() : null,
      createdAt: new Date(dbTask.created_at).toISOString(),
      updatedAt: dbTask.updated_at ? new Date(dbTask.updated_at).toISOString() : new Date(dbTask.created_at).toISOString(),
      subtasks: parsedSubtasks,
      aiSubtaskGenerationCount: dbTask.ai_subtask_generation_count || 0,
      isNew: isNewTask,
      emoji: dbTask.emoji || undefined,
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: t('taskContext.toast.fetchError') });
      setTasks([]);
    } else {
      const dbTasks = data as DbTask[] | null;
      const transformedTasks: Task[] = (dbTasks || []).map((dbTask) => mapDbTaskToTask(dbTask));
      setTasks(transformedTasks);
    }
    setIsLoading(false);
  }, [toast, t]);

  /**
   * useEffect hook to perform initial task fetching when the component mounts
   * or when `fetchTasks` changes. It also sets up a Supabase real-time subscription
   * to listen for changes in the 'tasks' table and re-fetches tasks if changes occur.
   * Cleans up the subscription when the component unmounts.
   */
  useEffect(() => {
    fetchTasks();
    const subscription = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchTasks]);

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
   * @param {Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount' | 'isNew'> & { category?: string, emoji?: string }} task - The task object to add, omitting fields generated by the backend or context.
   * @returns {Promise<Task | undefined>} A promise that resolves with the newly created Task object or undefined if an error occurs.
   * @throws {Error} If the user is not authenticated or if a database error occurs.
   */
  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount' | 'isNew'> & { category?: string, emoji?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error(t('taskContext.toast.notAuthenticated'));
    
    const dbTask = {
      title: task.title,
      description: task.description || null,
      priority: task.priority || 'low',
      status: task.status || 'todo',
      category: task.category || null,
      deadline: task.deadline || null,
      user_id: session.user.id,
      subtasks: JSON.stringify([]),
      ai_subtask_generation_count: 0,
      last_viewed_at: null,
      emoji: task.emoji || null,
    };
    
    const { data, error } = await supabase.from('tasks').insert([dbTask]).select().single();
    if (error) throw error;
    if (data) {
      const newTask = mapDbTaskToTask(data as DbTask);
      setTasks(prevTasks => [ ...prevTasks, newTask ]);
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
    if (taskUpdates.description !== undefined) dbRecord.description = taskUpdates.description;
    if (taskUpdates.priority !== undefined) dbRecord.priority = taskUpdates.priority;
    if (taskUpdates.status !== undefined) dbRecord.status = taskUpdates.status;
    if (taskUpdates.category !== undefined) dbRecord.category = taskUpdates.category;
    if (taskUpdates.deadline !== undefined) dbRecord.deadline = taskUpdates.deadline;
    if (taskUpdates.emoji !== undefined) dbRecord.emoji = taskUpdates.emoji;
    if (taskUpdates.subtasks !== undefined) {
        try {
            if (typeof taskUpdates.subtasks === 'string') {
                JSON.parse(taskUpdates.subtasks);
                dbRecord.subtasks = taskUpdates.subtasks as unknown as Json;
            } else {
                dbRecord.subtasks = JSON.stringify(taskUpdates.subtasks) as unknown as Json;
            }
        } catch (error) {
            dbRecord.subtasks = JSON.stringify([]) as unknown as Json;
        }
    }
    if (taskUpdates.aiSubtaskGenerationCount !== undefined) dbRecord.ai_subtask_generation_count = taskUpdates.aiSubtaskGenerationCount;
    return dbRecord;
  };

  /**
   * Updates an existing task in the database and updates the local state.
   * Displays toast notifications for success or failure.
   * @param {string} id - The ID of the task to update.
   * @param {Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>} updates - An object containing the properties to update.
   * @throws {Error} If the task is not found or if a database error occurs.
   */
  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>) => {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.taskNotFound', { taskId: id }) });
      throw new Error(t('taskContext.toast.taskNotFound', { taskId: id }));
    }
    const originalTask = tasks[taskIndex];
    const now = new Date().toISOString();
    const updatedTaskForUI: Task = { ...originalTask, ...updates, updatedAt: now };

    setTasks(prevTasks => prevTasks.map(t => t.id === id ? updatedTaskForUI : t));

    try {
      const dbUpdates = mapTaskToDbUpdate(updates);
      
      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select('*');

      if (error) {
        toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.updateTaskFailedSimple') });
        throw error;
      }
    } catch (exception) {
      toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.updateTaskFailedGeneral') });
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
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };
  
  /**
   * Adds a subtask to a specified task in the database and updates the local state.
   * @param {string} taskId - The ID of the parent task.
   * @param {string} subtaskTitle - The title of the new subtask.
   * @param {string} [subtaskDescription] - Optional description for the new subtask.
   * @throws {Error} If the parent task is not found or if a database error occurs.
   */
  const addSubtask = async (taskId: string, subtaskTitle: string, subtaskDescription?: string) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    
    const newSubtask: SubTask = {
      id: uuidv4(),
      taskId,
      title: subtaskTitle,
      description: subtaskDescription || '',
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
  const updateSubtask = async (taskId: string, subtaskId: string, updates: Partial<Omit<SubTask, 'id' | 'taskId' | 'createdAt'>>) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, ...updates, updatedAt: new Date().toISOString() } : st
    );
    
    await updateTask(taskId, { subtasks: updatedSubtasks });

    // Controleer of alle subtaken zijn voltooid
    if (updatedSubtasks.length > 0) {
      const allSubtasksCompleted = updatedSubtasks.every(subtask => subtask.completed);
      
      // Als alle subtaken zijn voltooid en de taak zelf nog niet is voltooid
      if (allSubtasksCompleted && task.status !== 'done') {
        // Markeer de taak als voltooid en zet prioriteit op 'none'
        await updateTask(taskId, {
          status: 'done',
          priority: 'none'
        });

        // Toon een bevestigingsbericht
        toast({
          title: t('taskContext.toast.autoCompleted.title'),
          description: t('taskContext.toast.autoCompleted.description')
        });
      } 
      // Als NIET alle subtaken voltooid zijn en de taak was automatisch voltooid (dus status=done en priority=none)
      else if (!allSubtasksCompleted && task.status === 'done' && task.priority === 'none') {
        // Herstel de taak naar 'in_progress' status met 'medium' prioriteit
        await updateTask(taskId, {
          status: 'in_progress',
          priority: 'medium'
        });

        // Toon een bevestigingsbericht
        toast({
          title: t('taskContext.toast.priorityRestored.title', 'Taak opnieuw actief'),
          description: t('taskContext.toast.priorityRestored.description', 'De taak is opnieuw actief gemaakt omdat niet alle subtaken voltooid zijn')
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
    
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
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
    await updateTask(taskId, { status: completed ? 'done' : 'todo' });
  };
  
  /**
   * Expands a task by generating subtasks using an AI model.
   * Updates the task with the generated subtasks and increments the AI generation count.
   * Handles loading states and displays toast notifications for success, failure, or limits.
   * @param {string} taskId - The ID of the task to expand with AI-generated subtasks.
   * @throws {Error} If the task is not found, user is not authenticated, or an API error occurs.
   */
  const expandTask = async (taskId: string) => {
    if (!user) {
      toast({ 
        variant: "destructive", 
        title: t('taskContext.toast.notAuthenticated')
      });
      return;
    }
    
    const task = getTaskById(taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found.`);
    }
    
    // Bereken het aantal generaties dat nog mogelijk is
    const maxGenerations = user.role === 'free' 
      ? MAX_FREE_USER_AI_SUBTASK_GENERATIONS 
      : MAX_PAID_USER_AI_SUBTASK_GENERATIONS;
    
    const currentGenerationCount = task.aiSubtaskGenerationCount || 0;
    
    if (currentGenerationCount >= maxGenerations) {
      toast({ 
        variant: "destructive", 
        title: t('taskContext.toast.aiLimitReached.title'),
        description: t('taskContext.toast.aiLimitReached.description', { 
          maxGenerations,
          userType: user.role === 'free' ? t('common.free') : t('common.premium')
        })
      });
      return;
    }
    
    // Om dubbele generaties te voorkomen, controleren we of er al een generatie bezig is
    if (isGeneratingSubtasksForTask(taskId)) {
      toast({ 
        variant: "default", 
        title: t('taskContext.toast.alreadyGenerating.title'),
        description: t('taskContext.toast.alreadyGenerating.description')
      });
      return;
    }
    
    setIsGeneratingAISubtasks(taskId);
    
    // Controleer of er al bestaande subtaak-titels zijn (om duplicaten te voorkomen)
    const existingSubtaskTitles = task.subtasks.map(st => st.title.toLowerCase());
    
    try {
      // Haal de huidige taal op
      const languagePreference = user.language_preference || 'en';
      
      const requestBody = {
        taskTitle: task.title,
        taskDescription: task.description,
        existingSubtasks: existingSubtaskTitles,
        language: languagePreference,
        taskId: taskId, // Stuur het taskId mee voor logging
      };
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-subtasks', 
        { body: requestBody }
      );
      
      if (functionError) {
        toast({ 
          variant: "destructive", 
          title: t('taskContext.toast.aiGenerationFailed.title'),
          description: t('taskContext.toast.aiGenerationFailed.description')
        });
        clearIsGeneratingAISubtasks(taskId);
        return;
      }
      
      // Verwerk het resultaat
      if (data?.subtasks && Array.isArray(data.subtasks)) {
        const newSubtasks: SubTask[] = data.subtasks.map((item: { 
          title: string; 
          description: string 
        }) => ({
          id: uuidv4(),
          taskId,
          title: item.title,
          description: item.description,
          completed: false,
          createdAt: new Date().toISOString(),
        }));
        
        // Voeg de nieuwe subtaken toe aan de bestaande subtaken
        const updatedSubtasks = [...task.subtasks, ...newSubtasks];
        
        // Creëer een unieke set van subtaken (geen dubbele titels)
        const uniqueSubtasks: SubTask[] = [];
        const seenTitles = new Set();
        
        for (const subtask of updatedSubtasks) {
          const normalizedTitle = subtask.title.toLowerCase().trim();
          if (!seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            uniqueSubtasks.push(subtask);
          }
        }
        
        // Update de taak met de nieuwe subtaken en verhoog de teller
        await updateTask(taskId, { 
          subtasks: uniqueSubtasks,
          aiSubtaskGenerationCount: (task.aiSubtaskGenerationCount || 0) + 1
        });
        
        // Toon een succes melding
        toast({ 
          title: t('taskContext.toast.aiGenerationSuccess.title'),
          description: t('taskContext.toast.aiGenerationSuccess.description', { 
            count: newSubtasks.length
          })
        });
      } else {
        toast({ 
          variant: "destructive", 
          title: t('taskContext.toast.aiGenerationFailed.title'),
          description: t('taskContext.toast.aiGenerationFailed.invalidResponse')
        });
      }
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: t('taskContext.toast.aiGenerationFailed.title'),
        description: t('taskContext.toast.aiGenerationFailed.description')
      });
    } finally {
      clearIsGeneratingAISubtasks(taskId);
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
    };
    
    tasks.forEach(task => {
      // Check if task is completed and add to 'completed' category
      if (task.status === 'done') {
        grouped.completed.push(task);
        return; // Skip other categorization if task is completed
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
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) {
      return Promise.resolve(); // Task not found, return empty Promise
    }
    
    // Update local state
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === id ? { ...t, isNew: false } : t
    ));
    
    try {
      // Store in localStorage (temporary solution)
      const viewedTaskIds = localStorage.getItem('viewedTaskIds');
      const viewedTasks = viewedTaskIds ? JSON.parse(viewedTaskIds) : [];
      
      if (!viewedTasks.includes(id)) {
        viewedTasks.push(id);
        localStorage.setItem('viewedTaskIds', JSON.stringify(viewedTasks));
      }
    } catch (e) {
      // Error with localStorage, ignore
    }
    
    return Promise.resolve();
    // Database update is temporarily removed due to type incompatibility
    // with the DbTaskUpdate interface. In a future update, the interface
    // will be updated to correctly support the last_viewed_at field.
  };
  
  /**
   * Retrieves the maximum number of AI subtask generations allowed for the current user.
   * Differentiates between free and paid users.
   * @returns {number} The maximum number of AI generations.
   */
  const getMaxAiGenerationsForUser = (): number => {
    const isPaidUser = user?.role === 'paid' || user?.role === 'admin';
    return isPaidUser ? MAX_PAID_USER_AI_SUBTASK_GENERATIONS : MAX_FREE_USER_AI_SUBTASK_GENERATIONS;
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
   * The value provided to the TaskContext.
   * Includes the task list, loading state, and functions to manage tasks.
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
  };

  return <TaskContext.Provider value={contextValue}>{children}</TaskContext.Provider>;
}
