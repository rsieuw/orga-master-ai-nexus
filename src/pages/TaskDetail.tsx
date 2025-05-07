import React, { useState, useEffect, useRef } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Trash2, Edit, PlusCircle, Sparkles, X, Save, MoreVertical, Flag, CalendarClock, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogOverlay,
} from "@/components/ui/alert-dialog.tsx";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogClose,
  DialogPortal,
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
}: SubtaskRowProps) {
  const { t } = useTranslation();

  // Define swipe handlers for each subtask
  const handlers = useSwipeable({
    onSwipedRight: () => handleSubtaskToggle(subtask.id, !subtask.completed),
    trackMouse: false, // Disable mouse swiping, only for touch
    preventScrollOnSwipe: true,
  });

  return (
    <div 
      key={subtask.id} 
      {...handlers} // Spread the handlers onto the main div
      className={cn(
        "group flex items-start justify-between space-x-3 rounded-md pt-2 pb-1.5 pl-2 lg:pl-0 pr-2 hover:bg-muted/50",
        subtask.completed && "opacity-50"
      )}>
        {/* Container for index, checkbox, and title/input */}
        <div 
          className="flex items-center space-x-2 flex-grow min-w-0"
          onDoubleClick={() => handleSubtaskLabelClick(subtask.title)}
        >
          {/* Wrapper for custom checkbox appearance */}
          <div className="relative h-7 w-7 lg:h-5 lg:w-5 flex-shrink-0 ml-[9px]">
            <Checkbox
              id={`subtask-${subtask.id}`}
              checked={subtask.completed}
              onCheckedChange={(checked: boolean | string | undefined) => handleSubtaskToggle(subtask.id, !!checked)}
              className={cn(
                "absolute inset-0 h-full w-full border-primary data-[state=checked]:border-green-600 data-[state=checked]:bg-green-600",
              )}
              // Disable checkbox while editing the title to prevent conflicts
              disabled={editingSubtaskId === subtask.id}
            />
            {/* Absolutely positioned number inside the wrapper */}
            <span className={cn(
              "absolute inset-0 flex items-center justify-center text-xs font-medium pointer-events-none",
              subtask.completed ? "hidden" : "text-muted-foreground/70",
              "lg:text-[10px]" // Even smaller on desktop
            )}>
              {index + 1}
            </span>
          </div>

          {/* Conditionally render Input or Label */}
          {editingSubtaskId === subtask.id ? (
            <Input
              type="text"
              id={`subtask-edit-${subtask.id}`}
              aria-label={t('taskDetail.subtask.editTitleAriaLabel')}
              value={editingSubtaskTitle}
              onChange={(e) => setEditingSubtaskTitle(e.target.value)}
              onBlur={handleSaveSubtaskEdit} // Save when focus leaves the input
              onKeyDown={handleSubtaskEditKeyDown} // Use the prop directly again
              className="h-7 text-sm flex-grow mr-2" // Use flex-grow for input
              autoFocus // Automatically focus the input when it appears
            />
          ) : (
            <label
              htmlFor={`subtask-${subtask.id}`}
              className={cn(
                "flex-grow text-sm font-normal leading-snug cursor-pointer hover:text-primary transition-colors",
                subtask.completed && "line-through text-muted-foreground hover:text-muted-foreground/80"
              )}
            >
              {subtask.title}
            </label>
          )}
        </div>

        {/* Action buttons container - appears on hover/focus */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {/* Mobile: Dropdown Menu (Three dots) */}
          <div className="lg:hidden"> 
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 px-0 mr-1"
                  onClick={(e) => e.stopPropagation()} // Prevent other clicks
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">{t('taskDetail.subtask.options')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover/90 backdrop-blur-lg border border-white/10" onClick={(e) => e.stopPropagation()}> 
                <DropdownMenuItem 
                  onSelect={(e) => { 
                    e.preventDefault();
                    startEditingSubtask(subtask);
                  }}
                  disabled={subtask.completed || editingSubtaskId === subtask.id}
                  className="text-sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{t('taskDetail.subtask.edit')}</span>
                </DropdownMenuItem>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-sm focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4 text-destructive" /> 
                      <span>{t('taskDetail.subtask.delete')}</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" />
                  <AlertDialogContent className="bg-card p-4 shadow-md sm:rounded-lg z-[90]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('taskDetail.subtask.deleteConfirmation.title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('taskDetail.subtask.deleteConfirmation.description', { subtaskTitle: subtask.title })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteSubtask(task.id, subtask.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {t('common.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: Individual Icons */}
          <div className="hidden lg:flex items-center space-x-1"> 
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
              <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" />
              <AlertDialogContent className="border bg-card p-4 shadow-md sm:rounded-lg z-[90]">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('taskDetail.subtask.deleteConfirmation.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('taskDetail.subtask.deleteConfirmation.description', { subtaskTitle: subtask.title })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteSubtask(task.id, subtask.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t('common.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
    </div>
  );
}
// --- End SubtaskRow Component ---

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, deleteTask, isLoading: tasksLoading, updateSubtask, addSubtask, expandTask, deleteSubtask: deleteSubtaskFromContext, toggleTaskCompletion, updateTask } = useTask();
  const { t } = useTranslation();
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
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(true);
  const hideTimerRef = useRef<number | null>(null);
  // State for inline editing subtasks
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState<string>("");

  const task: Task | undefined = getTaskById(id || "");

  useEffect(() => {
    const appRootWrapper = document.getElementById('app-root-wrapper');
    if (isEditDialogOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (appRootWrapper) {
        appRootWrapper.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (appRootWrapper) {
        appRootWrapper.style.overflow = ''; // Or 'auto' or its original value if known
      }
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (appRootWrapper) {
        appRootWrapper.style.overflow = '';
      }
    };
  }, [isEditDialogOpen]);

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
      }, INACTIVITY_TIMEOUT) as number;
    };

    handleActivity();

    // Add scroll listener
    globalThis.addEventListener('scroll', handleActivity, { passive: true });
    // Add click listener
    globalThis.addEventListener('click', handleActivity, { capture: true }); // Use capture to catch clicks early

    // Cleanup on unmount
    return () => {
      globalThis.removeEventListener('scroll', handleActivity);
      globalThis.removeEventListener('click', handleActivity, { capture: true }); // Remove click listener
      if (hideTimerRef.current !== null) { 
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // Calculate subtask progress
  const totalSubtasks = task?.subtasks.length ?? 0;
  const completedSubtasks = task?.subtasks.filter(st => st.completed).length ?? 0;
  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  const handleSubtaskLabelClick = (title: string) => {
    setSelectedSubtaskTitle(title);
    // Check if we are likely on a mobile view (screen width < lg breakpoint)
    if (globalThis.innerWidth < 1024) { // Assuming lg breakpoint is 1024px
      setActiveMobileView('chat'); // Update state immediately for responsiveness
      navigate(`#chat`, { replace: true }); // Update URL hash
    }
  };

  // --- Subtask Edit Functions ---
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

    // Only update if the title actually changed and is not empty
    if (originalSubtask && editingSubtaskTitle.trim() && originalSubtask.title !== editingSubtaskTitle.trim()) {
      try {
        // Use the updateSubtask function from the useTask hook
        await updateSubtask(task.id, editingSubtaskId, { title: editingSubtaskTitle.trim() });
        toast({ title: t('taskDetail.toast.subtaskUpdated') });
      } catch (error) {
        console.error("Failed to update subtask:", error);
        toast({ variant: "destructive", title: t('taskDetail.toast.updateFailed'), description: t('taskDetail.toast.subtaskUpdateFailedDescription') });
        // Optionally revert the title in the input
        setEditingSubtaskTitle(originalSubtask.title); // Revert to original on error
      }
    }
    // Always exit editing mode
    cancelSubtaskEdit();
  };

  const handleSubtaskEditKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveSubtaskEdit();
    } else if (event.key === 'Escape') {
      cancelSubtaskEdit();
    }
  };
  // --- End Subtask Edit Functions ---

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
    if (!task) return;
    setIsGeneratingSubtasks(true);
    try {
      await expandTask(task.id);
    } catch (error) {
      console.error("Failed to expand task from component:", error);
    } finally {
      setIsGeneratingSubtasks(false);
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

  // Handler for priority change
  const handlePriorityChange = (newPriority: string) => {
    if (!newPriority || !task || newPriority === task.priority) return;
    // Call updateTask to only change priority
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

  if (task.deadline) {
    try {
      const parsedDeadline = parseISO(task.deadline);
      const now = new Date();
      isOverdue = parsedDeadline < now && task.status !== 'done';
      deadlineText = format(parsedDeadline, "PPP", { locale: nl });
      if (isOverdue) {
        deadlineColor = "border-red-400 text-red-400";
      } else if (task.status === 'done') {
        deadlineColor = "border-green-400 text-green-400";
      } else {
        deadlineColor = "border-blue-400 text-blue-400";
      }
    } catch (e) {
      console.error("Invalid date format for deadline:", task.deadline);
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
    <AppLayout>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-12rem)] relative z-0">
          <Card className={cn(
            "firebase-card flex-col relative overflow-hidden z-10",
            activeMobileView === 'chat' ? 'hidden lg:flex' : 'flex' 
          )}>
            <CardHeader className="pb-3 px-4 lg:p-6 lg:pb-3">
              <div className="flex items-center">
                <CardTitle className="text-xl font-semibold">{task?.title}</CardTitle>
              </div>
            </CardHeader>

            {/* Action Buttons Container */}
            <div className="absolute top-3 right-[14px] z-20"> {/* Changed right-[7px] to right-[14px] */}
              {/* Desktop Buttons */}
              <div className="hidden lg:flex gap-1">
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t('taskDetail.editTaskSR')}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogPortal>
                    <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                    <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
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
                </AlertDialog>
              </div>

              {/* Mobile Dropdown Button */}
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
                          onSelect={(e) => e.preventDefault()} // Prevent closing dropdown
                          className="text-sm focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                          <span>{t('taskDetail.deleteTask')}</span>
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm" />
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
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {task && (
              <CardContent className="flex flex-col flex-grow min-h-0 px-0 lg:p-6 lg:pt-0">
                {/* New wrapper div for padded content */}
                <div className="px-4 lg:px-0"> 
                  <div className="flex-shrink-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost"
                            className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/40", statusColor[task.status])}
                          >
                            <Info className="h-4 w-4 mr-1 sm:hidden" /> {/* Mobile icon changed to Info */}
                            <span className="hidden sm:inline">{t('common.status')}:&nbsp;</span> {/* Desktop label */}
                            {t(`common.${task.status}`)} {/* Value using direct translation, assuming task.status matches keys like 'todo', 'in_progress', 'done' */}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg border border-white/10">
                          <DropdownMenuItem onSelect={() => handleStatusChange('todo')}>
                            {t('common.todo')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('in_progress')}>
                            {t('common.inProgress')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleStatusChange('done')}>
                            {t('common.done')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Dropdown for Priority (only show if not 'none') */}
                      {task.priority !== 'none' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost"
                              className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/40", priorityBadgeColor[task.priority])}
                            >
                              <Flag className="h-4 w-4 mr-1 sm:hidden" /> {/* Mobile icon */}
                              <span className="hidden sm:inline">{t('common.priority')}:&nbsp;</span> {/* Desktop label */}
                              {t(`common.${task.priority.toLowerCase()}`)} {/* Value using direct translation */}
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
                          <CalendarClock className="h-4 w-4 mr-1 sm:hidden" /> {/* Mobile icon */}
                          <span className="hidden sm:inline">{t('common.deadline')}:&nbsp;</span> {/* Desktop label */}
                          {deadlineText} {/* Value */}
                          {isOverdue && <span className="hidden sm:inline">&nbsp;{t('taskDetail.overdueSR')}</span>} {/* Desktop overdue text */}
                        </Badge>
                      )}
                    </div>
                    <div className="mb-4"></div>
                    <div>
                      <h3 className="font-medium mb-2">{t('common.description')}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {task.description || t('taskDetail.noDescription')}
                      </p>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                      <div className="flex items-center gap-3 w-full"> {/* Added w-full here */}
                        <h3 className="font-medium flex-shrink-0">{t('common.subtasks')}</h3> {/* Added flex-shrink-0 */} 
                        {totalSubtasks > 0 && (
                          <div className="flex items-center gap-2 flex-grow"> {/* Added flex-grow here */}
                             <span className="text-xs text-muted-foreground flex-shrink-0">
                                 {completedSubtasks}/{totalSubtasks}
                             </span>
                             {/* On mobile, flex-grow allows it to take space. On lg, w-40 takes precedence. */}
                             <GradientProgress value={progressValue} className="h-1.5 flex-grow lg:w-40 lg:flex-grow-0" /> 
                             <span className="text-xs font-medium text-muted-foreground/90 flex-shrink-0">
                               ({Math.round(progressValue)}%)
                             </span>
                          </div>
                         )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Subtasks List - now outside the padded wrapper */}
                <div className="flex-grow overflow-y-auto min-h-0 
                               scrollbar-thin scrollbar-thumb-muted-foreground 
                               scrollbar-track-transparent scrollbar-thumb-rounded pb-2 
                               space-y-1 lg:space-y-1.5 divide-y divide-border/60 lg:divide-y-0">
                  {task.subtasks.length > 0 ? (
                    <>
                      {task.subtasks.map((subtask: SubTask, index: number) => (
                        <SubtaskRow 
                          key={subtask.id}
                          task={task}
                          subtask={subtask}
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
                        />
                      ))}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm px-4 lg:px-0">{t('taskDetail.noSubtasks')}</p>
                  )}
                </div>

                {/* Desktop Buttons & Add Form - Moved INSIDE padded wrapper */}
                <div className="px-4 lg:px-0"> {/* Ensure this wrapper gets padding too */} 
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
                        {/* Desktop Save Button - Icon */}
                        <Button 
                          type="submit" 
                          size="icon"
                          className="h-10 w-10 p-2.5 rounded-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
                          disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                          aria-label={t('taskDetail.addSubtask.saveAriaLabel')}
                        >
                          {isAddingSubtask ? <GradientLoader size="sm" /> : <Save className="h-5 w-5" />}
                        </Button>
                        {/* Desktop Cancel Button - Icon */}
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
                      <div className="flex flex-wrap items-center gap-2 h-10">
                        <Button 
                          variant="outline"
                          onClick={() => setShowAddSubtaskForm(true)} 
                          className="h-10 px-4 text-muted-foreground hover:text-foreground"
                        >
                           <PlusCircle className="mr-2 h-4 w-4" />
                           {t('taskDetail.addSubtask.buttonText')}
                        </Button>
                        {/* Desktop Generate Subtasks Button with Confirmation */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              disabled={isGeneratingSubtasks || isAddingSubtask}
                              className="h-10 p-[1px] rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 relative transition-colors duration-200"
                            >
                              <div className="bg-card h-full w-full rounded-[5px] flex items-center justify-center px-4">
                                <span className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                  <Sparkles className={cn("mr-1 h-4 w-4 text-blue-500", isGeneratingSubtasks && "animate-spin")} />
                                  {t('taskDetail.generateSubtasks.buttonText')}
                                </span>
                              </div>
                            </Button>
                          </DialogTrigger>
                          <DialogOverlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
                          <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-2xl">{t('taskDetail.generateSubtasks.dialogTitle')}</DialogTitle>
                              <DialogDescription>
                                {t('taskDetail.generateSubtasks.dialogDescription', { taskTitle: task.title })}
                              </DialogDescription>
                            </DialogHeader>
                            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                              <X className="h-4 w-4" />
                              <span className="sr-only">{t('common.closeSR')}</span>
                            </DialogClose>
                            <div className="pt-4 flex justify-end space-x-2">
                              <DialogClose asChild>
                                <Button variant="outline" className="bg-secondary/80 border-white/10">{t('common.cancel')}</Button>
                              </DialogClose>
                              <Button
                                onClick={handleGenerateSubtasks}
                                className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                                disabled={isGeneratingSubtasks}
                              >
                                {isGeneratingSubtasks ? <GradientLoader size="sm" className="mr-2" /> : null}
                                {t('taskDetail.generateSubtasks.confirmButton')}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div> {/* Close the new padded content wrapper */} 
              </CardContent>
            )}
          </Card>

          <Card className={cn(
            "firebase-card overflow-hidden flex-col flex-grow min-h-0", 
            activeMobileView === 'details' ? 'hidden lg:flex' : 'flex' 
          )}>
            {task && (
              <TaskAIChat
                task={task}
                selectedSubtaskTitle={selectedSubtaskTitle}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Mobile Add Subtask Form Panel */}
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

            {/* Submit Button */}
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

      {/* Mobile Fixed Action Footer - Add conditional styling */}
      <div className={cn(
          "lg:hidden fixed bottom-16 left-0 right-0 z-40 flex justify-between items-center p-3",
          showMobileActions ? 'opacity-100' : 'opacity-0 pointer-events-none',
          'transition-opacity duration-300 ease-in-out'
      )}>
        {/* Mobile Generate button (Sparkles) with Confirmation & Tooltip */}
        <Dialog>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <DialogTrigger asChild>
                <Button 
                  variant="default"
                  size="icon" 
                  className="rounded-full h-14 w-14 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white shadow-lg"
                  disabled={isGeneratingSubtasks || isAddingSubtask}
                  aria-label={t('taskDetail.generateSubtasks.buttonAriaLabel')}
                >
                  <Sparkles className={cn("h-7 w-7", isGeneratingSubtasks && "animate-spin")} />
                </Button>
              </DialogTrigger>
              <TooltipContent side="top" className="bg-popover/50 backdrop-blur-lg">
                <p>{t('taskDetail.generateSubtasks.tooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogOverlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />
          <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{t('taskDetail.generateSubtasks.dialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('taskDetail.generateSubtasks.dialogDescription', { taskTitle: task.title })}
              </DialogDescription>
            </DialogHeader>
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">{t('common.closeSR')}</span>
            </DialogClose>
            <div className="pt-4 flex justify-end space-x-2">
              <DialogClose asChild>
                <Button variant="outline" className="bg-secondary/80 border-white/10">{t('common.cancel')}</Button>
              </DialogClose>
              <Button
                onClick={handleGenerateSubtasks}
                className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                disabled={isGeneratingSubtasks}
              >
                {isGeneratingSubtasks ? <GradientLoader size="sm" className="mr-2" /> : null}
                {t('taskDetail.generateSubtasks.confirmButton')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add button (PlusCircle) with Tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                size="icon" 
                className="rounded-full h-14 w-14 bg-secondary/80 backdrop-blur-sm border-white/10 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-lg"
                onClick={() => setShowAddSubtaskForm(true)}
                disabled={isAddingSubtask || isGeneratingSubtasks}
                aria-label={t('taskDetail.addSubtask.buttonAriaLabel')}
              >
                <PlusCircle className="h-7 w-7" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover/50 backdrop-blur-lg">
              <p>{t('taskDetail.addSubtask.tooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </AppLayout>
  );
}