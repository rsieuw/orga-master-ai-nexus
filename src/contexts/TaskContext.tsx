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
import { useAuth } from './AuthContext.tsx';

interface DbTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string | null;
  subtasks: Json;
  ai_subtask_generation_count: number | null;
}

interface DbTaskUpdate {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  deadline?: string | null;
  subtasks?: Json;
  updated_at?: string;
  ai_subtask_generation_count?: number;
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation(); 
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
          // Het kan ook een JSON object zijn dat al geparsed is
          parsedSubtasks = dbTask.subtasks as unknown as SubTask[];
        }
      }
    } catch (error) {
      console.error("Error parsing subtasks:", error, dbTask.subtasks);
      parsedSubtasks = [];
    }
    
    return {
      id: dbTask.id,
      userId: dbTask.user_id,
      title: dbTask.title,
      description: dbTask.description || '',
      priority: (dbTask.priority || 'medium') as TaskPriority,
      status: (dbTask.status || 'todo') as TaskStatus,
      deadline: dbTask.deadline ? new Date(dbTask.deadline).toISOString() : null,
      createdAt: new Date(dbTask.created_at).toISOString(),
      updatedAt: dbTask.updated_at ? new Date(dbTask.updated_at).toISOString() : new Date(dbTask.created_at).toISOString(),
      subtasks: parsedSubtasks,
      aiSubtaskGenerationCount: dbTask.ai_subtask_generation_count || 0,
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
      console.error('Error fetching tasks:', error);
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

  const addTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'userId' | 'aiSubtaskGenerationCount'>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error(t('taskContext.toast.notAuthenticated'));
    
    const dbTask = {
      title: task.title,
      description: task.description || null,
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      deadline: task.deadline || null,
      user_id: session.user.id,
      subtasks: JSON.stringify([]),
      ai_subtask_generation_count: 0
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
    if (taskUpdates.deadline !== undefined) dbRecord.deadline = taskUpdates.deadline;
    if (taskUpdates.subtasks !== undefined) {
        try {
            if (typeof taskUpdates.subtasks === 'string') {
                JSON.parse(taskUpdates.subtasks);
                dbRecord.subtasks = taskUpdates.subtasks as unknown as Json;
            } else {
                dbRecord.subtasks = JSON.stringify(taskUpdates.subtasks) as unknown as Json;
            }
        } catch (error) {
            console.error("Error converting subtasks to JSON:", error);
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
      console.log("Updating task with data:", JSON.stringify(dbUpdates));
      
      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id)
        .select('*');

      if (error) {
        console.error("Error updating task:", error, "Updates:", dbUpdates);
        toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.updateTaskFailed') });
        throw error;
      }
    } catch (exception) {
      console.error("Exception updating task:", exception);
      toast({ variant: "destructive", title: t('common.error'), description: t('taskContext.toast.updateTaskFailed') });
      throw exception;
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  const addSubtask = async (taskId: string, subtaskTitle: string, subtaskDescription?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found to add subtask');
    
    const newSubtask: SubTask = {
      id: uuidv4(),
      title: subtaskTitle,
      description: subtaskDescription || '',
      completed: false,
      taskId: taskId,
      createdAt: new Date().toISOString(),
    };
    
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const updateSubtask = async (taskId: string, subtaskId: string, updates: Partial<Omit<SubTask, 'id' | 'taskId' | 'createdAt'>>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found to update subtask');
    
    const updatedSubtasks = (task.subtasks || []).map(st =>
      st.id === subtaskId ? { ...st, ...updates } : st
    );
    
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found to delete subtask');
    
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const deleteAllSubtasks = async (taskId: string) => {
    await updateTask(taskId, { subtasks: [] });
  };
  
  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    const newStatus = completed ? 'done' as TaskStatus : 'in_progress' as TaskStatus;
    await updateTask(taskId, { status: newStatus });
  };

  const expandTask = async (taskId: string) => {
    console.log('expandTask aangeroepen met taskId:', taskId);
    const task = tasks.find(t => t.id === taskId);
    console.log('Task gevonden:', task);
    if (!task) {
      console.error(`Task with id ${taskId} not found.`);
      toast({
        title: t('common.error'),
        description: t('taskContext.taskNotFound', { taskId }), 
      });
      return;
    }

    // Bepaal de limiet op basis van de gebruikersrol
    const maxGenerations = getMaxAiGenerationsForUser();
    
    const currentGenerationCount = task.aiSubtaskGenerationCount || 0;
    console.log('Current generation count:', currentGenerationCount, 'Limiet:', maxGenerations);
    
    if (currentGenerationCount >= maxGenerations) {
      console.log('Generatie limiet bereikt');
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('taskContext.aiSubtaskGenerationLimitReached', { count: currentGenerationCount, limit: maxGenerations }),
      });
      return;
    }
    
    console.log('Markeren als genereren...');
    setIsGeneratingAISubtasks(taskId);
    try {
      const existingSubtaskTitles = task.subtasks.map(st => st.title);
      console.log('Bestaande subtaak titels:', existingSubtaskTitles);
      const languagePreference = i18n.language.startsWith('nl') ? 'nl' : 'en';
      console.log('Aanroepen van Supabase functie met taal:', languagePreference);
      
      const requestBody = {
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        taskPriority: task.priority,
        taskDeadline: task.deadline,
        languagePreference: languagePreference,
        existingSubtaskTitles: existingSubtaskTitles,
      };
      console.log('Request body:', requestBody);
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-subtasks', {
        body: requestBody,
      });
      console.log('Supabase functie resultaat:', data, 'Error:', functionError);
      if (functionError) throw new Error(functionError.message);
      if (data && data.subtasks && Array.isArray(data.subtasks)) {
        const newSubtasks = data.subtasks.filter(
          (newSubtask: Partial<SubTask>) =>
            newSubtask.title && !existingSubtaskTitles.includes(newSubtask.title)
        );
        if (newSubtasks.length > 0) {
          const subtasksToAdd: SubTask[] = newSubtasks.map((sub: Partial<SubTask>) => ({
            id: uuidv4(),
            title: sub.title!,
            description: sub.description || '',
            completed: false,
            taskId: task.id,
            createdAt: new Date().toISOString(),
          }));
          
          const allSubtasks = [...task.subtasks, ...subtasksToAdd];
          await updateTask(taskId, { 
            subtasks: allSubtasks,
            aiSubtaskGenerationCount: currentGenerationCount + 1 
          });
          
          if (newSubtasks.length > 0) {
            toast({
                title: t('common.success'),
                description: t('taskContext.aiSubtasksGeneratedSuccessfully'),
            });
          } else {
            toast({
                title: t('common.information'),
                description: t('taskContext.aiNoNewSubtasksGenerated'),
            });
          }
        }
      } else {
        const errorMessage = data?.error || 'No subtasks data returned or invalid format from AI.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Failed to expand task with AI:', error);
      const err = error as Error;
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: err.message || t('taskContext.aiSubtaskGenerationFailed'),
      });
    } finally {
      clearIsGeneratingAISubtasks(taskId);
    }
  };

  const groupTasksByDate = useCallback((): TasksByDate => {
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
        const deadlineDate = startOfDay(parseISO(task.deadline));

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
          } else if (diffDays > 7) {
            grouped.later.push(task);
          } else {
            grouped.later.push(task);
          }
        }
      } catch (e) {
        console.error(`Invalid date format for task deadline: ${task.deadline}`, e);
        grouped.later.push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Functies die helpen bij het beheren van de AI generatie limieten
  const getMaxAiGenerationsForUser = useCallback(() => {
    const isPaidUser = user?.role === 'paid' || user?.role === 'admin';
    return isPaidUser ? MAX_PAID_USER_AI_SUBTASK_GENERATIONS : MAX_FREE_USER_AI_SUBTASK_GENERATIONS;
  }, [user?.role]);

  const isAiGenerationLimitReached = useCallback((task: Task) => {
    const currentCount = task.aiSubtaskGenerationCount || 0;
    return currentCount >= getMaxAiGenerationsForUser();
  }, [getMaxAiGenerationsForUser]);

  const contextValue = {
    tasks,
    isLoading,
    getTaskById,
    addTask,
    updateTask,
    deleteTask,
    addSubtask,
    updateSubtask,
    deleteSubtask,
    deleteAllSubtasks,
    toggleTaskCompletion,
    isGeneratingSubtasksForTask,
    expandTask,
    groupTasksByDate,
    getMaxAiGenerationsForUser,
    isAiGenerationLimitReached,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}
