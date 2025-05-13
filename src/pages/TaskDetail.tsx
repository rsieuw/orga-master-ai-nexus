import { useState, useEffect, useRef } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { ArrowLeft, Trash2, Edit, PlusCircle, Sparkles, X, Save, MessageSquareText, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import TaskAIChat from "@/components/ai/TaskAIChat.tsx";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Task, SubTask, TaskPriority, TaskStatus } from "@/types/task.ts";
import { GradientProgress } from "@/components/ui/GradientProgress.tsx";
import { Tooltip, TooltipContent, TooltipProvider } from "@/components/ui/tooltip.tsx";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth.ts";
import SubtaskRow from "@/components/task/SubtaskRow.tsx";
import { useResizableLayout } from "@/hooks/useResizableLayout.ts";
import TaskInfoDisplay from "@/components/task/TaskInfoDisplay.tsx";
import TaskActions from "@/components/task/TaskActions.tsx";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    getTaskById, 
    deleteTask, 
    isLoading: tasksLoading, 
    updateSubtask,
    addSubtask,
    expandTask,
    deleteSubtask: deleteSubtaskFromContext, 
    toggleTaskCompletion, 
    updateTask, 
    isGeneratingSubtasksForTask,
    getMaxAiGenerationsForUser,
    isAiGenerationLimitReached,
    markTaskAsViewed
  } = useTask();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState(location.hash === '#chat' ? 'chat' : 'details');
  const [selectedSubtaskTitle, setSelectedSubtaskTitle] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isGenerateSubtasksDialogOpen, setIsGenerateSubtasksDialogOpen] = useState(false);
  const [isMobileGenerateDialogOpen, setIsMobileGenerateDialogOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPressedSubtaskId, setLongPressedSubtaskId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);

  const { user } = useAuth();

  const { 
    columnSizes, 
    containerRef, 
    startResize, 
    isResizing
  } = useResizableLayout({ initialLayoutPreference: (user?.layout_preference as '50-50' | '33-67') || '50-50' });

  const task: Task | undefined = getTaskById(id || "");
  const currentAiGenerationCount = task?.aiSubtaskGenerationCount || 0;
  
  const maxGenerations = getMaxAiGenerationsForUser();
  const isLimitReached = task ? isAiGenerationLimitReached(task) : false;
  
  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    if (!task) return;
    try {
      await updateSubtask(task.id, subtaskId, { completed });
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: t('taskDetail.toast.subtaskStatusUpdateFailedDescription') });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    try {
      const titleToAdd = newSubtaskTitle.trim();
      await addSubtask(task.id, titleToAdd);
      toast({ title: t('taskDetail.toast.subtaskAdded'), description: t('taskDetail.toast.subtaskAddedDescription', { subtaskTitle: titleToAdd }) });
      setNewSubtaskTitle("");
      setShowAddSubtaskForm(false);
    } catch (error) {
      toast({ variant: "destructive", title: t('taskDetail.toast.addFailed'), description: t('taskDetail.toast.subtaskAddFailedDescription') });
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleGenerateSubtasks = async () => {
    if (task) {
      try {
        await expandTask(task.id);
      } catch (error) {
        console.error('Error in expandTask:', error);
      }
      setIsGenerateSubtasksDialogOpen(false);
      setIsMobileGenerateDialogOpen(false);
    } else {
      console.error('Task is undefined in handleGenerateSubtasks');
    }
  };

  useEffect(() => {
    if (!location.hash) {
      globalThis.scrollTo(0, 0);
    }
  }, [location.hash]);

  useEffect(() => {
    const shouldLock = isEditDialogOpen || isGenerateSubtasksDialogOpen || isMobileGenerateDialogOpen;
    document.body.style.overflow = shouldLock ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isEditDialogOpen, isGenerateSubtasksDialogOpen, isMobileGenerateDialogOpen]);

  useEffect(() => {
    setActiveMobileView(location.hash === '#chat' ? 'chat' : 'details');
  }, [location.hash]);

  useEffect(() => {
    const INACTIVITY_TIMEOUT = 2500;
    const handleActivity = () => {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
      }
      setShowMobileActions(true);
      hideTimerRef.current = setTimeout(() => {
        setShowMobileActions(false);
      }, INACTIVITY_TIMEOUT) as ReturnType<typeof setTimeout>;
    };
    handleActivity();
    globalThis.addEventListener('scroll', handleActivity, { passive: true });
    globalThis.addEventListener('click', handleActivity, { capture: true });
    globalThis.addEventListener('mousemove', handleActivity, { passive: true });
    globalThis.addEventListener('touchmove', handleActivity, { passive: true });
    return () => {
      globalThis.removeEventListener('scroll', handleActivity);
      globalThis.removeEventListener('click', handleActivity, { capture: true });
      globalThis.removeEventListener('mousemove', handleActivity);
      globalThis.removeEventListener('touchmove', handleActivity);
      if (hideTimerRef.current !== null) { 
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const totalSubtasks = task?.subtasks.length ?? 0;
  const completedSubtasks = task?.subtasks.filter(st => st.completed).length ?? 0;
  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  const handleSubtaskLabelClick = (title: string) => {
    setSelectedSubtaskTitle(title);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!newStatus || !task || newStatus === task.status) return;
    if (newStatus === 'done') {
      toggleTaskCompletion(task.id, true);
    } else if (task.status === 'done' && (newStatus === 'in_progress' || newStatus === 'todo')) {
      toggleTaskCompletion(task.id, false);
    } else if (task.status !== 'done' && (newStatus === 'in_progress' || newStatus === 'todo')) {
      updateTask(task.id, { status: newStatus as TaskStatus });
    }
  };

  const handlePriorityChange = (newPriority: string) => {
    if (!newPriority || !task || newPriority === task.priority) return;
    updateTask(task.id, { priority: newPriority as TaskPriority });
  };

  const priorityBadgeColor: Record<TaskPriority, string> = {
    high: "border-red-400 text-red-400",
    medium: "border-orange-400 text-orange-400",
    low: "border-blue-400 text-blue-400",
    none: "border-green-400 text-green-400",
  };

  let deadlineText = t('taskDetail.noDeadline');
  let deadlineColor = "border-gray-400 text-gray-400";
  let isOverdue = false;

  const currentLocale = i18n.language.startsWith('en') ? enUS : nl;

  if (task && task.deadline) {
    try {
      const parsedDeadline = parseISO(task.deadline);
      const now = new Date();
      isOverdue = parsedDeadline < now && task.status !== 'done';
      deadlineText = format(parsedDeadline, "PPP", { locale: currentLocale });
      if (isOverdue) {
        deadlineColor = "border-red-400 text-red-400";
      } else if (task.status === 'done') {
        deadlineColor = "border-green-400 text-green-400";
      } else {
        deadlineColor = "border-blue-400 text-blue-400";
      }
    } catch (e) {
      deadlineText = t('taskDetail.invalidDate');
      deadlineColor = "border-red-400 text-red-400";
    }
  }

  const statusColor: Record<string, string> = {
    todo: "border-red-400 text-red-400",
    in_progress: "border-yellow-400 text-yellow-400",
    done: "border-green-400 text-green-400",
  };

  const closeSubtaskContextMenu = () => {
    setLongPressedSubtaskId(null);
    setContextMenuPosition(null);
  };

  useEffect(() => {
    if (id && task && !task.isNew) {
      return;
    }
    
    if (id && task) {
      markTaskAsViewed(id);
    }
  }, [id, task, markTaskAsViewed]);

  if (tasksLoading) {
    return null;
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold mb-2">{t('taskDetail.notFound.title')}</h1>
          <Button onClick={() => navigate(-1)} className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast({
        title: t('taskDetail.toast.taskDeleted'),
        description: t('taskDetail.toast.taskDeletedDescription', { taskTitle: task.title }),
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('taskDetail.toast.deleteFailed'),
        description: t('taskDetail.toast.taskDeleteFailedDescription'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout noPadding={globalThis.innerWidth < 1024}>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-12 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground z-10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">{t('common.backSR')}</span>
        </Button>

        <div 
          ref={containerRef} 
          className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] lg:h-[calc(100vh-12rem)] relative z-0 lg:gap-2"
        >
          <Card 
            className={cn(
              "firebase-card flex-col relative overflow-hidden z-10",
              "rounded-none border-none",
              "lg:rounded-lg lg:border",
              "lg:flex-[0_0_auto]",
              activeMobileView === 'chat' ? 'hidden lg:flex' : 'flex w-full'
            )}
            style={globalThis.innerWidth >= 1024 ? { width: `${columnSizes.left}%` } : {}}
          >
            <CardHeader className={cn(
              "transition-all duration-300 ease-in-out",
              "px-4",
              isInfoCollapsed ? "pt-4 pb-0" : "pt-6 pb-3",
              "lg:p-6 lg:pb-3"
            )}>
              <div className="flex items-center">
                <CardTitle className={cn(
                  "font-semibold",
                  "transition-all duration-300 ease-in-out",
                  isInfoCollapsed ? "text-lg" : "text-xl",
                  "lg:text-xl"
                )}>{task?.title}</CardTitle>
              </div>
            </CardHeader>
            <TaskActions 
              task={task}
              isEditDialogOpen={isEditDialogOpen}
              setIsEditDialogOpen={setIsEditDialogOpen}
              handleDelete={handleDelete}
              isDeleting={isDeleting}
              isInfoCollapsed={isInfoCollapsed} 
              t={t}
            />

            {task && (
              <CardContent className="p-0 flex flex-col flex-grow min-h-0">
                <div className="p-6 pt-0 flex flex-col flex-grow min-h-0 px-0 pb-0 lg:p-6 lg:pt-0">
                  <TaskInfoDisplay
                    task={task}
                    isInfoCollapsed={isInfoCollapsed}
                    statusColor={statusColor}
                    priorityBadgeColor={priorityBadgeColor}
                    deadlineText={deadlineText}
                    deadlineColor={deadlineColor}
                    isOverdue={isOverdue}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                  />
                  <div className="px-4 lg:px-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 flex-grow">
                          <h3 className="font-medium flex-shrink-0">{t('common.subtasks')}</h3>
                          {totalSubtasks > 0 && (
                            <div className="flex items-center gap-2 flex-grow">
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {completedSubtasks}/{totalSubtasks}
                              </span>
                              <GradientProgress value={progressValue} className="h-1.5 flex-grow lg:w-40 lg:flex-grow-0" /> 
                              <span className="text-xs font-medium text-muted-foreground/90 flex-shrink-0">
                                ({Math.round(progressValue)}%)
                              </span>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
                          className="h-7 w-7 text-muted-foreground flex-shrink-0 ml-2"
                          aria-label={isInfoCollapsed ? t('taskDetail.expandDescription') : t('taskDetail.collapseDescription')}
                        >
                          {isInfoCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex-grow overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded space-y-1 lg:space-y-1.5 divide-y divide-border/60 lg:divide-y-0",
                    (longPressedSubtaskId || contextMenuPosition) ? "pb-12" : "pb-2"
                  )}>
                    <AnimatePresence mode='wait'>
                      {task.subtasks.length > 0 ? (
                        <motion.div key="subtask-list" layout>
                          {task.subtasks.map((subtaskItem: SubTask, index: number) => (
                            <div key={`subtask-wrapper-${subtaskItem.id}`} className="relative">
                              <SubtaskRow 
                                task={task}
                                subtask={subtaskItem}
                                index={index}
                                handleSubtaskToggle={handleSubtaskToggle}
                                handleSubtaskLabelClick={handleSubtaskLabelClick}
                              />
                              {longPressedSubtaskId === subtaskItem.id && contextMenuPosition && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40 lg:hidden" 
                                    onClick={(e) => { e.stopPropagation(); closeSubtaskContextMenu(); }}
                                  />
                                  <Card 
                                    className="fixed z-50 w-48 bg-popover shadow-xl border border-border lg:hidden rounded-md"
                                    style={{ top: `${contextMenuPosition.top}px`, left: `${contextMenuPosition.left}px` }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="py-1">
                                      <button
                                        type="button"
                                        className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-muted/80 rounded-t-md"
                                        onClick={() => {
                                          setSelectedSubtaskTitle(subtaskItem.title);
                                          setActiveMobileView('chat');
                                          navigate('#chat', { replace: true });
                                          closeSubtaskContextMenu();
                                        }}
                                      >
                                        <MessageSquareText className="mr-2 h-4 w-4" />
                                        {t('chatPanel.researchButton')} 
                                      </button>
                                      <button
                                        type="button"
                                        className="flex items-center w-full text-left px-3 py-2 text-sm hover:bg-muted/80 disabled:opacity-50"
                                        onClick={() => {
                                          closeSubtaskContextMenu();
                                        }}
                                        disabled={subtaskItem.completed}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        {t('taskDetail.subtask.edit')}
                                      </button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <button 
                                            type="button"
                                            className="flex items-center w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-md focus-visible:ring-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('taskDetail.subtask.delete')}
                                          </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogPortal>
                                          <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                                          <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90]">
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>{t('taskDetail.subtask.deleteConfirmation.title')}</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                {t('taskDetail.subtask.deleteConfirmation.description', { subtaskTitle: subtaskItem.title })}
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel onClick={closeSubtaskContextMenu} className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => {
                                                  if (task) {
                                                     deleteSubtaskFromContext(task.id, subtaskItem.id);
                                                  }
                                                  closeSubtaskContextMenu();
                                                }}
                                                className="bg-destructive hover:bg-destructive/90"
                                              >
                                                {t('common.delete')}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialogPortal>
                                      </AlertDialog>
                                    </div>
                                  </Card>
                                </>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.p 
                          key="no-subtasks" 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          className="text-muted-foreground text-sm px-4 lg:px-0"
                        >
                          {t('taskDetail.noSubtasks')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="px-4 lg:px-0">
                    <div className="hidden lg:flex lg:items-center lg:gap-2 lg:px-1 border-t border-border pt-3 mt-auto">
                      {showAddSubtaskForm ? (
                        <form onSubmit={handleAddSubtask} className="flex items-center gap-3 flex-grow">
                          <label htmlFor="new-subtask-title-desktop" className="sr-only">{t('taskDetail.addSubtask.titleDesktopSR')}</label>
                          <Input
                            id="new-subtask-title-desktop"
                            type="text"
                            placeholder={t('taskDetail.addSubtask.placeholder')}
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            className="h-10 flex-grow"
                            disabled={isAddingSubtask}
                          />
                          <Button 
                            type="submit" 
                            size="icon"
                            className="h-10 w-10 p-2.5 rounded-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
                            disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                            aria-label={t('taskDetail.addSubtask.saveAriaLabel')}
                          >
                            {isAddingSubtask ? <GradientLoader size="sm" /> : <Save className="h-5 w-5" />}
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            className="h-10 w-10 p-2.5 rounded-full"
                            onClick={() => setShowAddSubtaskForm(false)} 
                            disabled={isAddingSubtask}
                            aria-label={t('common.cancelAriaLabel')}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </form>
                      ) : (
                        <Dialog open={isGenerateSubtasksDialogOpen} onOpenChange={setIsGenerateSubtasksDialogOpen}>
                          <div className="flex flex-wrap items-center gap-2 h-10">
                            <Button 
                              variant="default"
                              onClick={() => setShowAddSubtaskForm(true)} 
                              className="h-10 px-4 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
                            >
                               <PlusCircle className="mr-2 h-4 w-4" />
                               {t('taskDetail.addSubtask.buttonText')}
                            </Button>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <DialogTrigger asChild>
                                  <Button
                                    disabled={isGeneratingSubtasksForTask(task.id) || isAddingSubtask || isLimitReached}
                                    className="h-10 p-[1px] rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 relative transition-colors duration-200"
                                  >
                                    <div className="bg-card h-full w-full rounded-[5px] flex items-center justify-center px-4">
                                      <span className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                        {isGeneratingSubtasksForTask(task.id) ? (
                                          <Loader2 className="animate-spin h-4 w-4 mr-2 text-blue-500" />
                                        ) : (
                                          <Sparkles className="mr-1 h-4 w-4 text-blue-500" />
                                        )}
                                        {t('taskDetail.generateSubtasks.buttonText')}
                                      </span>
                                    </div>
                                  </Button>
                                </DialogTrigger>
                                {isLimitReached && (
                                  <TooltipContent side="top">
                                    <p>{t('taskDetail.generateSubtasks.limitReachedTooltip', { count: currentAiGenerationCount, limit: maxGenerations })}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          <DialogPortal>
                            <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                            <DialogContent className="sm:max-w-[425px] bg-card/90 backdrop-blur-md border border-white/10 shadow-lg">
                              <DialogHeader>
                                <DialogTitle>{t('common.generateSubtasksDialogTitle')}</DialogTitle>
                                <DialogDescription>
                                  {t('common.generateSubtasksDialogDescription', { taskTitle: task?.title })}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 space-y-3">
                                <Button
                                  disabled={isGeneratingSubtasksForTask(task.id) || isLimitReached}
                                  variant="default"
                                  className="w-full h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                                  onClick={handleGenerateSubtasks}
                                >
                                  {isGeneratingSubtasksForTask(task.id) ? (
                                    <div className="flex items-center gap-2 justify-center">
                                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                      {t('common.generatingText')}
                                    </div>
                                  ) : (
                                    t('taskDetail.generateSubtasks.confirmButton')
                                  )}
                                </Button>
                                <DialogClose asChild>
                                  <Button variant="outline" className="w-full h-12 bg-secondary/80 border-white/10">{t('common.cancel')}</Button>
                                </DialogClose>
                              </div>
                            </DialogContent>
                          </DialogPortal>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Draggable divider - only visible on desktop */}
          <div
            className={cn(
              "hidden lg:flex items-center justify-center w-px cursor-ew-resize bg-border hover:bg-primary/40 transition-all duration-300 relative z-30 mx-1 shrink-0 hover:shadow-[0_0_8px_rgba(var(--primary),.4)]",
              "group" // Added group for potential hover effects on children
            )}
            onMouseDown={startResize} // Ensured startResize is used
          >
            {/* Stylish arrow handle */}
            <div 
              className={cn(
                "absolute w-4 h-8 rounded-full bg-primary/25 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300",
                isResizing ? "opacity-100 bg-primary/40 scale-110" : "", // Ensured isResizing is used
                "lg:group-hover:opacity-100" // Made consistent with parent group hover
              )}
            >
              <div className="flex items-center justify-center flex-row gap-0.5">
                <svg width="5" height="7" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
                  <path d="M5 7L2 4L5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="w-px h-4 bg-white/60"></div>
                <svg width="5" height="7" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
                  <path d="M1 1L4 4L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          <Card 
            className={cn(
              "firebase-card overflow-hidden flex flex-col flex-grow min-h-0",
              "lg:flex-[1_1_auto]",
              activeMobileView === 'details' ? 'hidden lg:flex' : 'flex w-full lg:w-auto',
              activeMobileView === 'chat' && 'h-full p-0'
            )}
            style={globalThis.innerWidth >= 1024 ? { width: `${columnSizes.right}%` } : { /* Do not explicitly set height here, let flexbox do the work */ }}
          >
            {task && (
              <div className="flex-grow min-h-0 h-full">
                <TaskAIChat
                  task={task}
                  selectedSubtaskTitle={selectedSubtaskTitle}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      {showAddSubtaskForm && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[60] p-4 bg-card border-t border-border shadow-lg">
          <form onSubmit={handleAddSubtask} className="flex items-center gap-3">
            <div className="relative flex-grow">
              <label htmlFor="new-subtask-title-mobile" className="sr-only">{t('taskDetail.addSubtask.titleMobileSR')}</label>
              <Input
                id="new-subtask-title-mobile"
                type="text"
                placeholder={t('taskDetail.addSubtask.placeholderMobile')}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="h-10 bg-background/50 rounded-md pr-10"
                disabled={isAddingSubtask}
                autoFocus
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground"
                onClick={() => setShowAddSubtaskForm(false)} 
                disabled={isAddingSubtask}
                aria-label={t('common.cancelAriaLabel')}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Button 
              type="submit" 
              size="icon"
              className="h-10 w-10 p-2.5 rounded-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 flex-shrink-0"
              disabled={isAddingSubtask || !newSubtaskTitle.trim()}
              aria-label={t('taskDetail.addSubtask.saveAriaLabel')}
            >
              {isAddingSubtask ? <GradientLoader size="sm" /> : <Save className="h-5 w-5" />} 
            </Button>
          </form>
        </div>
      )}

      <AnimatePresence>
        {showMobileActions && !showAddSubtaskForm && globalThis.innerWidth < 1024 && activeMobileView === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              "fixed bottom-16 left-0 right-0 z-40 flex justify-between items-start p-3",
              'transition-opacity duration-300 ease-in-out'
            )}
          >
            <div className="flex flex-col items-center">
              <Button 
                variant="default"
                size="icon" 
                className="aspect-square rounded-full h-14 w-14 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white shadow-lg mb-1"
                disabled={isGeneratingSubtasksForTask(task.id) || isLimitReached}
                onClick={() => setIsMobileGenerateDialogOpen(true)}
                aria-label={t('taskDetail.generateSubtasks.buttonAriaLabel')}
              >
                {isGeneratingSubtasksForTask(task.id) ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <Sparkles className="h-6 w-6" />
                )}
              </Button>
              <span className="text-xs text-muted-foreground">{t('taskDetail.generateSubtasks.fabText')}</span>
            </div>

            <div className="flex flex-col items-center">
              <Button 
                variant="default"
                size="icon" 
                className="aspect-square rounded-full h-14 w-14 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 shadow-lg mb-1"
                onClick={() => setShowAddSubtaskForm(true)}
                disabled={isAddingSubtask || isGeneratingSubtasksForTask(task.id) || isLimitReached}
                aria-label={t('taskDetail.addSubtask.buttonAriaLabel')}
              >
                <PlusCircle className="h-7 w-7" />
              </Button>
              <span className="text-xs text-muted-foreground">{t('taskDetail.addSubtask.fabText')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={isMobileGenerateDialogOpen} onOpenChange={setIsMobileGenerateDialogOpen}>
        <AlertDialogPortal>
          <AlertDialogOverlay className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialogContent className="sm:max-w-xl z-[101] border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.generateSubtasksDialogTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('common.generateSubtasksDialogDescription', { taskTitle: task?.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 space-y-3">
              <Button
                disabled={isGeneratingSubtasksForTask(task.id) || isLimitReached}
                variant="default"
                className="w-full h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                onClick={handleGenerateSubtasks}
              >
                {isGeneratingSubtasksForTask(task.id) ? (
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    {t('common.generatingText')}
                  </div>
                ) : (
                  t('taskDetail.generateSubtasks.confirmButton')
                )}
              </Button>
              <AlertDialogCancel className="w-full h-12 bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </AppLayout>
  );
}