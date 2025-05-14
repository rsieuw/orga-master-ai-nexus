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

interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  deadline: string | null;
  category: string | null;
  created_at: string;
  updated_at: string | null;
  subtasks: Json;
  ai_subtask_generation_count: number | null;
  last_viewed_at: string | null;
  emoji: string | null;
}

interface DbTaskUpdate {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  category?: string | null;
  deadline?: string | null;
  subtasks?: Json;
  updated_at?: string;
  ai_subtask_generation_count?: number;
  last_viewed_at?: string | null;
  emoji?: string | null;
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { t } = useTranslation(); 
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingAISubtasksMap, setIsGeneratingAISubtasksMap] = useState<Record<string, boolean>>({});

  const setIsGeneratingAISubtasks = (taskId: string) => {
    setIsGeneratingAISubtasksMap(prev => ({ ...prev, [taskId]: true }));
  };

  const clearIsGeneratingAISubtasks = (taskId: string) => {
    setIsGeneratingAISubtasksMap(prev => ({ ...prev, [taskId]: false }));
  };

  const isGeneratingSubtasksForTask = (taskId: string): boolean => {
    return !!isGeneratingAISubtasksMap[taskId];
  };

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

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((task: Task) => task.id === id);
  };

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
        toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.updateTaskFailed') });
        throw error;
      }
    } catch (exception) {
      toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.updateTaskFailed') });
      throw exception;
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };
  
  // Add a new subtask
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
  
  // Update a subtask
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

  // Delete a subtask
  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = getTaskById(taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found.`);
    
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };
  
  // Delete all subtasks
  const deleteAllSubtasks = async (taskId: string) => {
    await updateTask(taskId, { subtasks: [] });
  };
  
  // Mark a task as completed/incomplete
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { status: completed ? 'done' : 'todo' });
  };
  
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

  // Group tasks based on deadline
  const groupTasksByDate = (): TasksByDate => {
    const today = startOfDay(new Date());
    
    const grouped: TasksByDate = {
      overdue: [],
      today: [],
      tomorrow: [],
      dayAfterTomorrow: [],
      nextWeek: [],
      later: [],
    };
    
    tasks.forEach(task => {
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

  // Mark that a task has been viewed
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
  
  // Functions that help manage AI generation limits
  const getMaxAiGenerationsForUser = (): number => {
    const isPaidUser = user?.role === 'paid' || user?.role === 'admin';
    return isPaidUser ? MAX_PAID_USER_AI_SUBTASK_GENERATIONS : MAX_FREE_USER_AI_SUBTASK_GENERATIONS;
  };

  const isAiGenerationLimitReached = (task: Task): boolean => {
    const currentCount = task.aiSubtaskGenerationCount || 0;
    return currentCount >= getMaxAiGenerationsForUser();
  };

  return (
    <TaskContext.Provider
      value={{
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
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}
