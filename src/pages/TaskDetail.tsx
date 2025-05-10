import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { ArrowLeft, Trash2, Edit, PlusCircle, Sparkles, X, Save, MoreVertical, Flag, CalendarClock, Info, MessageSquareText, Loader2, ChevronsUp, ChevronsDown } from "lucide-react";
import { Separator } from "@/components/ui/separator.tsx";
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
import { Checkbox } from "@/components/ui/checkbox.tsx";
import TaskAIChat from "@/components/ai/TaskAIChat.tsx";
import { GradientLoader } from "@/components/ui/loader.tsx";
import EditTaskDialog from "@/components/tasks/EditTaskDialog.tsx";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Task, SubTask, TaskPriority, TaskStatus } from "@/types/task.ts";
import { GradientProgress } from "@/components/ui/GradientProgress.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useSwipeable } from 'react-swipeable';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// --- SubtaskRow Component ---
interface SubtaskRowProps {
  task: Task;
  subtask: SubTask;
  index: number;
  editingSubtaskId: string | null;
  editingSubtaskTitle: string;
  handleSubtaskToggle: (subtaskId: string, completed: boolean) => void;
  handleSubtaskLabelClick: (title: string) => void;
  startEditingSubtask: (subtask: SubTask) => void;
  handleSaveSubtaskEdit: () => Promise<void>;
  handleSubtaskEditKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  setEditingSubtaskTitle: (title: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  onSubtaskLongPress: (subtaskId: string, event: React.TouchEvent | React.MouseEvent) => void;
}

function SubtaskRow({
  task,
  subtask,
  index,
  editingSubtaskId,
  editingSubtaskTitle,
  handleSubtaskToggle,
  handleSubtaskLabelClick,
  startEditingSubtask,
  handleSaveSubtaskEdit,
  handleSubtaskEditKeyDown,
  setEditingSubtaskTitle,
  deleteSubtask,
  onSubtaskLongPress,
}: SubtaskRowProps) {
  const { t } = useTranslation();
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressThreshold = 500;

  const handlePressStart = (event: React.TouchEvent | React.MouseEvent) => {
    if (editingSubtaskId === subtask.id) return;
    longPressTimerRef.current = setTimeout(() => {
      onSubtaskLongPress(subtask.id, event);
      longPressTimerRef.current = null;
    }, pressThreshold);
  };

  const handlePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };
  
  const handlers = useSwipeable({
    onSwipedRight: () => handleSubtaskToggle(subtask.id, !subtask.completed),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  return (
    <motion.div
      key={subtask.id}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      {...handlers}
      className={cn(
        "group/row flex items-start justify-between space-x-3 rounded-md py-2 pl-2 lg:pl-0 pr-2 hover:bg-muted/50 overflow-hidden"
      )}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button === 0 && e.target instanceof HTMLElement && 
            !e.target.closest('input, button, label, a, [role="button"], [data-state="open"]')) {
          handlePressStart(e);
        }
      }}
      onMouseUp={(e: React.MouseEvent<HTMLDivElement>) => { if (e.button === 0) handlePressEnd(); }}
      onMouseLeave={handlePressEnd} 
    >
      <div 
        className="flex items-start space-x-2 flex-grow min-w-0"
      >
        <div className="relative h-7 w-7 lg:h-5 lg:w-5 flex-shrink-0 ml-[9px] mt-[2px]">
          <Checkbox
            id={`subtask-${subtask.id}`}
            checked={subtask.completed}
            onCheckedChange={(checked: boolean | string | undefined) => handleSubtaskToggle(subtask.id, !!checked)}
            className={cn(
              "absolute inset-0 h-full w-full border-primary data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600",
            )}
            disabled={editingSubtaskId === subtask.id}
          />
          <span className={cn(
            "absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none",
            subtask.completed ? "hidden" : "text-muted-foreground/70",
            "lg:text-[10px]"
          )}>
            {index + 1}
          </span>
        </div>
        <div className="flex-grow">
          {editingSubtaskId === subtask.id ? (
            <Input
              type="text"
              id={`subtask-edit-${subtask.id}`}
              aria-label={t('taskDetail.subtask.editTitleAriaLabel')}
              value={editingSubtaskTitle}
              onChange={(e) => setEditingSubtaskTitle(e.target.value)}
              onBlur={handleSaveSubtaskEdit}
              onKeyDown={handleSubtaskEditKeyDown}
              className="h-7 text-sm flex-grow mr-2"
              autoFocus
            />
          ) : (
            <>
              <label
                className={cn(
                  "flex-grow text-sm font-normal leading-snug cursor-pointer hover:text-primary transition-colors relative top-[2px] lg:-top-px",
                  subtask.completed && "text-gray-700 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-400"
                )}
                onClick={() => {
                  if (!editingSubtaskId) {
                    handleSubtaskLabelClick(subtask.title);
                    setIsDescriptionVisible(!isDescriptionVisible);
                  }
                }}
              >
                <span className={cn("relative", subtask.completed && "line-through")}>
                  {subtask.title}
                </span>
              </label>
              <AnimatePresence>
                {isDescriptionVisible && subtask.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '0.25rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="text-xs text-muted-foreground pl-1 pr-2 whitespace-pre-wrap pb-2"
                  >
                    {subtask.description}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      <div className="hidden lg:flex items-center opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity space-x-1"> 
        {editingSubtaskId !== subtask.id && !subtask.completed && ( 
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
                e.stopPropagation();
                startEditingSubtask(subtask);
            }}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">{t('taskDetail.subtask.editSubtaskSR')}</span>
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">{t('taskDetail.subtask.deleteSubtaskSR')}</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90]">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('taskDetail.subtask.deleteConfirmation.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('taskDetail.subtask.deleteConfirmation.description', { subtaskTitle: subtask.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handlePressEnd} className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSubtask(task.id, subtask.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
// --- End SubtaskRow Component ---

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
    isAiGenerationLimitReached
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
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState<string>("");
  const [longPressedSubtaskId, setLongPressedSubtaskId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // State for the resizable columns
  const [columnSizes, setColumnSizes] = useState<{ left: number; right: number }>({ left: 50, right: 50 });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialX = useRef<number>(0);
  const initialLeftWidth = useRef<number>(0);

  const task: Task | undefined = getTaskById(id || "");
  const currentAiGenerationCount = task?.aiSubtaskGenerationCount || 0;
  
  // Use the context function to determine the limit
  const maxGenerations = getMaxAiGenerationsForUser();
  
  // Safe function that accounts for a potentially undefined task
  const isLimitReached = task ? isAiGenerationLimitReached(task) : false;
  
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

  const startEditingSubtask = (subtask: SubTask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  const cancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle("");
  };

  const handleSaveSubtaskEdit = async () => {
    if (!editingSubtaskId || !task) return;
    const originalSubtask = task.subtasks.find(st => st.id === editingSubtaskId);
    if (originalSubtask && editingSubtaskTitle.trim() && originalSubtask.title !== editingSubtaskTitle.trim()) {
      try {
        await updateSubtask(task.id, editingSubtaskId, { title: editingSubtaskTitle.trim() });
        toast({ title: t('taskDetail.toast.subtaskUpdated') });
      } catch (error) {
        toast({ variant: "destructive", title: t('taskDetail.toast.updateFailed'), description: t('taskDetail.toast.subtaskUpdateFailedDescription') });
        setEditingSubtaskTitle(originalSubtask.title);
      }
    }
    cancelSubtaskEdit();
  };

  const handleSubtaskEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveSubtaskEdit();
    } else if (event.key === 'Escape') {
      cancelSubtaskEdit();
    }
  };
  
  const handleSubtaskLongPress = (subtaskId: string, event: React.TouchEvent | React.MouseEvent) => {
    const targetElement = (event.currentTarget as HTMLElement);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      let top, left;
      if ('touches' in event && event.touches.length > 0) {
        top = event.touches[0].clientY;
        left = event.touches[0].clientX;
      } else if ('clientX' in event) {
        top = event.clientY;
        left = event.clientX;
      } else {
        top = rect.bottom;
        left = rect.left + rect.width / 2;
      }
      
      const menuWidth = 192;
      const menuHeight = 150;
      if (left + menuWidth > globalThis.innerWidth) {
        left = globalThis.innerWidth - menuWidth - 10;
      }
      if (top + menuHeight > globalThis.innerHeight) {
        top = globalThis.innerHeight - menuHeight - 10;
      }
      if (left < 10) left = 10;
      if (top < 10) top = 10;

      setContextMenuPosition({ top, left });
    }
    setLongPressedSubtaskId(subtaskId);
    event.stopPropagation();
    event.preventDefault();
  };

  const closeSubtaskContextMenu = () => {
    setLongPressedSubtaskId(null);
    setContextMenuPosition(null);
  };

  // Function to start dragging
  const startResize = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      setIsResizing(true);
      initialX.current = e.clientX;
      initialLeftWidth.current = containerRef.current.offsetWidth * (columnSizes.left / 100);
      
      // Add cursor styling during drag
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }
  };

  // Function for dragging, use useCallback
  const doResize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - initialX.current;
      const newLeftWidth = Math.min(Math.max(200, initialLeftWidth.current + deltaX), containerWidth - 200);
      
      const leftPercentage = (newLeftWidth / containerWidth) * 100;
      const rightPercentage = 100 - leftPercentage;
      
      setColumnSizes({
        left: leftPercentage,
        right: rightPercentage
      });
    }
  }, [isResizing]); // Dependencies of doResize

  // Function to stop dragging, use useCallback
  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []); // stopResize has no external dependencies within the component scope

  // Event listeners for dragging
  useEffect(() => {
    if (isResizing) {
      globalThis.addEventListener('mousemove', doResize);
      globalThis.addEventListener('mouseup', stopResize);
    }
    
    return () => {
      globalThis.removeEventListener('mousemove', doResize);
      globalThis.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing, doResize, stopResize]);

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
    console.log('handleGenerateSubtasks aangeroepen');
    console.log('Task:', task);
    if (task) {
      console.log('Roep expandTask aan met task.id:', task.id);
      try {
        await expandTask(task.id);
        console.log('expandTask succesvol uitgevoerd');
      } catch (error) {
        console.error('Error in expandTask:', error);
      }
      setIsGenerateSubtasksDialogOpen(false);
      setIsMobileGenerateDialogOpen(false);
    } else {
      console.error('Task is undefined in handleGenerateSubtasks');
    }
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
              "lg:flex-[0_0_auto]",
              activeMobileView === 'chat' ? 'hidden lg:flex' : 'flex w-full'
            )}
            style={globalThis.innerWidth >= 1024 ? { width: `${columnSizes.left}%` } : {}}
          >
            <CardHeader className={cn("pb-3 px-4 lg:p-6 lg:pb-3", isHeaderCollapsed && "md:hidden")} data-collapsed={isHeaderCollapsed}>
              <div className="flex items-center">
                <CardTitle className="text-xl font-semibold">{task?.title}</CardTitle>
              </div>
            </CardHeader>
            <div className="absolute top-3 right-[14px] z-20">
              <div className="hidden lg:flex gap-1">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t('taskDetail.editTaskSR')}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogPortal>
                    <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{t('taskDetail.editTaskDialog.title')}</DialogTitle>
                        <DialogDescription>
                          {t('taskDetail.editTaskDialog.description')}
                        </DialogDescription>
                      </DialogHeader>
                      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">{t('common.closeSR')}</span>
                      </DialogClose>
                      <EditTaskDialog task={task} setOpen={setIsEditDialogOpen} />
                    </DialogContent>
                  </DialogPortal>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('taskDetail.deleteTaskSR')}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogPortal>
                    <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm" />
                    <AlertDialogContent className="bg-card/90 border border-white/5 z-[90]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('taskDetail.deleteTaskConfirmation.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('taskDetail.deleteTaskConfirmation.description')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <GradientLoader size="sm" className="mr-2" />
                          ) : null}
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogPortal>
                </AlertDialog>
              </div>
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 mt-[14px]">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">{t('taskDetail.taskOptionsSR')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-lg border border-white/10">
                    <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>{t('taskDetail.editTask')}</span>
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-sm focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t('taskDetail.deleteTask')}</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogPortal>
                        <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                        <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90]">
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('taskDetail.deleteTaskConfirmation.title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('taskDetail.deleteTaskConfirmation.description')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive hover:bg-destructive/90"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <GradientLoader size="sm" className="mr-2" />
                              ) : null}
                              {t('common.delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialogPortal>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {task && (
              <CardContent className="flex flex-col flex-grow min-h-0 px-0 lg:p-6 lg:pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                  className="md:hidden flex items-center justify-center h-6 mb-1 mx-auto text-muted-foreground hover:text-foreground"
                >
                  {isHeaderCollapsed ? <ChevronsDown className="h-4 w-4" /> : <ChevronsUp className="h-4 w-4" />}
                  <span className="ml-1 text-xs">
                    {isHeaderCollapsed ? t('common.expand') || 'Uitklappen' : t('common.collapse') || 'Inklappen'}
                  </span>
                </Button>
                
                <div className={cn("px-4 lg:px-0", isHeaderCollapsed && "md:hidden")} data-collapsed={isHeaderCollapsed}>
                  <div className="flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost"
                            className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/40", statusColor[task.status])}
                          >
                            <Info className="h-4 w-4 mr-1 sm:hidden" />
                            <span className="hidden sm:inline">{t('common.status')}:&nbsp;</span>
                            {t(`common.${task.status.toLowerCase().replace(' ', '_')}`)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg border border-white/10">
                          <DropdownMenuItem onSelect={() => handleStatusChange('todo')}>
                            {t('common.todo')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('in_progress')}>
                            {t('common.in_progress')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('done')}>
                            {t('common.done')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {task.priority !== 'none' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost"
                              className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/40", priorityBadgeColor[task.priority])}
                            >
                              <Flag className="h-4 w-4 mr-1 sm:hidden" />
                              <span className="hidden sm:inline">{t('common.priority')}:&nbsp;</span>
                              {t(`common.${task.priority.toLowerCase()}`)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg border border-white/10">
                            <DropdownMenuItem onSelect={() => handlePriorityChange('high')}>
                              {t('common.high')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handlePriorityChange('medium')}>
                              {t('common.medium')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handlePriorityChange('low')}>
                              {t('common.low')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      {task.deadline && (
                        <Badge 
                          variant="secondary"
                          className={cn("h-6 px-2 text-xs font-normal border-none bg-muted/40", deadlineColor)}
                        >
                          <CalendarClock className="h-4 w-4 mr-1 sm:hidden" />
                          <span className="hidden sm:inline">{t('common.deadline')}:&nbsp;</span>
                          {deadlineText}
                          {isOverdue && <span className="hidden sm:inline">&nbsp;{t('taskDetail.overdueSR')}</span>}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-4">
                      <div className="text-sm">
                        {task.description ? (
                          <p className="whitespace-pre-wrap text-muted-foreground">{task.description}</p>
                        ) : (
                          <p className="italic text-muted-foreground text-sm">{t('taskDetail.noDescription')}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {completedSubtasks}/{totalSubtasks} {t('taskDetail.subtasksCompleted')}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {progressValue.toFixed(0)}%
                          </span>
                        </div>
                        <GradientProgress value={progressValue} />
                      </div>
                    </div>
                  </div>
                  <Separator className="my-3 bg-border/70" />
                </div>
                
                <div className="flex-grow overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded pb-2 space-y-1 lg:space-y-1.5 divide-y divide-border/60 lg:divide-y-0">
                  <AnimatePresence mode='wait'>
                    {task.subtasks.length > 0 ? (
                      <motion.div key="subtask-list" layout>
                        {task.subtasks.map((subtaskItem: SubTask, index: number) => (
                          <div key={`subtask-wrapper-${subtaskItem.id}`} className="relative">
                            <SubtaskRow 
                              task={task}
                              subtask={subtaskItem}
                              index={index}
                              editingSubtaskId={editingSubtaskId}
                              editingSubtaskTitle={editingSubtaskTitle}
                              handleSubtaskToggle={handleSubtaskToggle}
                              handleSubtaskLabelClick={handleSubtaskLabelClick}
                              startEditingSubtask={startEditingSubtask}
                              handleSaveSubtaskEdit={handleSaveSubtaskEdit}
                              handleSubtaskEditKeyDown={handleSubtaskEditKeyDown}
                              setEditingSubtaskTitle={setEditingSubtaskTitle}
                              deleteSubtask={deleteSubtaskFromContext}
                              onSubtaskLongPress={handleSubtaskLongPress}
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
                                        startEditingSubtask(subtaskItem);
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
                            variant="outline"
                            onClick={() => setShowAddSubtaskForm(true)} 
                            className="h-10 px-4 text-muted-foreground hover:text-foreground"
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
                                <Button variant="outline" className="w-full h-12">{t('common.cancel')}</Button>
                              </DialogClose>
                            </div>
                          </DialogContent>
                        </DialogPortal>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Draggable divider - only visible on desktop */}
          <div
            className="hidden lg:flex items-center justify-center w-px cursor-ew-resize bg-border hover:bg-primary/40 transition-all duration-300 relative z-30 mx-1 shrink-0 hover:shadow-[0_0_8px_rgba(var(--primary),.4)]"
            onMouseDown={startResize}
          >
            {/* Stylish arrow handle */}
            <div 
              className={cn(
                "absolute w-4 h-8 rounded-full bg-primary/25 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300",
                isResizing ? "opacity-100 bg-primary/40 scale-110" : "",
                "lg:group-hover:opacity-100"
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

      {/* Mobile FABs for Add Subtask and Generate Subtasks */}
      <AnimatePresence>
        {showMobileActions && globalThis.innerWidth < 1024 && activeMobileView === 'details' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "fixed bottom-24 left-0 right-0 z-40 flex justify-between items-center p-3",
              'transition-opacity duration-300 ease-in-out'
            )}
          >
            {/* EERST de Genereer Subtaken (Sparkles) knop */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default"
                    size="icon" 
                    className="aspect-square rounded-full h-14 w-14 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white shadow-lg"
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
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isLimitReached ? (
                    <p>{t('taskDetail.generateSubtasks.limitReachedTooltip', { count: currentAiGenerationCount, limit: maxGenerations })}</p>
                  ) : (
                    <p>{t('taskDetail.generateSubtasks.tooltip')}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* DAARNA de Nieuwe Subtaak (PlusCircle) knop */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="icon" 
                    className="aspect-square rounded-full h-14 w-14 bg-secondary/80 backdrop-blur-sm border-white/10 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-lg"
                    onClick={() => setShowAddSubtaskForm(true)}
                    disabled={isAddingSubtask || isGeneratingSubtasksForTask(task.id) || isLimitReached}
                    aria-label={t('taskDetail.addSubtask.buttonAriaLabel')}
                  >
                    <PlusCircle className="h-7 w-7" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{t('taskDetail.addSubtask.tooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              <AlertDialogCancel className="w-full h-12">{t('common.cancel')}</AlertDialogCancel>
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>
    </AppLayout>
  );
}