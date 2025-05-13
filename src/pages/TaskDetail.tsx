import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { Trash2, Edit, PlusCircle, Sparkles, Info, MessageSquareText, Loader2, ChevronUp, ChevronDown, Flag, CalendarClock, BriefcaseBusiness, Home, Users, GlassWater, Heart, Wallet, Icon } from "lucide-react";
import { frogFace } from "@lucide/lab";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useSwipeable } from 'react-swipeable';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth.ts";

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
            <AlertDialogContent className="bg-card/90 backdrop-blur-md border border-white/10 z-[90]">
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
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState<string>("");
  const [longPressedSubtaskId, setLongPressedSubtaskId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);

  const { user, updateUser } = useAuth();

  // Function to get column sizes based on preference
  // Accepts user as argument because `user` from context might not be ready during initial call
  const calculateColumnSizesFromPreference = useCallback((currentUser: typeof user | null) => {
    const preference = currentUser?.layout_preference || '50-50';
    if (preference === '33-67') {
      return { left: 33.33, right: 66.67 };
    }
    return { left: 50, right: 50 }; // Default to 50-50
  }, []);

  // Initialize state. `user` might be null initially.
  // Defaults will be overridden when user data becomes available
  const [columnSizes, setColumnSizes] = useState<{ left: number; right: number }>(() => {
    // Als gebruiker al beschikbaar is bij eerste render, gebruik de voorkeur meteen
    if (user && user.layout_preference) {
      const sizes = user.layout_preference === '33-67' 
        ? { left: 33.33, right: 66.67 }
        : { left: 50, right: 50 };
      return sizes;
    }
    // Anders standaard 50-50
    return { left: 50, right: 50 };
  });
  const [isResizing, setIsResizing] = useState(false);
  const prevIsResizingRef = useRef<boolean>(); // To store the previous value of isResizing
  const containerRef = useRef<HTMLDivElement>(null);
  const initialX = useRef<number>(0);
  const initialLeftWidth = useRef<number>(0);
  const hasAppliedInitialLayoutRef = useRef(false); // Bijhouden of de gebruikersvoorkeur al is toegepast
  const saveLayoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPreferenceRef = useRef<string | null>(null); // Bijhouden welke voorkeur als laatste is opgeslagen

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

  // Explicitly initialize layout when user becomes available
  useEffect(() => {
    if (user && !hasAppliedInitialLayoutRef.current) {
      const newSizes = calculateColumnSizesFromPreference(user);
      setColumnSizes(newSizes);
      hasAppliedInitialLayoutRef.current = true;
    }
  }, [user, calculateColumnSizesFromPreference]);

  // Function to save layout preference with debounce
  const debounceSaveLayoutPreference = useCallback((sizes: { left: number; right: number }) => {
    // Clear any existing timeout
    if (saveLayoutTimeoutRef.current) {
      clearTimeout(saveLayoutTimeoutRef.current);
    }

    // Set a new timeout
    saveLayoutTimeoutRef.current = setTimeout(() => {
      if (user) {
        const newPreference = sizes.left <= (33.33 + 50) / 2 ? '33-67' : '50-50';
        const currentUserPreference = user.layout_preference;
        
        // Voorkom onnodige updates als de voorkeur niet is gewijzigd
        if (newPreference !== currentUserPreference && newPreference !== lastSavedPreferenceRef.current) {
          (async () => {
            try {
              await updateUser({ layout_preference: newPreference });
              lastSavedPreferenceRef.current = newPreference as string;
            } catch (error) {
              console.error("Error saving layout preference:", error);
            }
          })();
        }
      }
    }, 1000); // 1 seconde wachten na laatste aanpassing
  }, [user, updateUser]);

  // Effect to set initial column sizes and update if user.layout_preference changes
  useEffect(() => {
    const wasResizingInPreviousRender = prevIsResizingRef.current;

    if (isResizing) {
      // Currently resizing - doResize handles updates, don't override
      return;
    } 
    
    if (wasResizingInPreviousRender === true) {
      debounceSaveLayoutPreference(columnSizes);
      return;
    } 
    
    if (user) {
      if (!hasAppliedInitialLayoutRef.current || user.layout_preference !== (hasAppliedInitialLayoutRef.current ? 
          (Math.abs(columnSizes.left - 33.33) < 1 ? '33-67' : '50-50') : null)) {
        const newSizes = calculateColumnSizesFromPreference(user);
        setColumnSizes(newSizes);
        hasAppliedInitialLayoutRef.current = true;
        lastSavedPreferenceRef.current = user.layout_preference as string;
      }
    }
  }, [user, isResizing, calculateColumnSizesFromPreference, debounceSaveLayoutPreference, columnSizes]);

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

    // Snap to the nearest preferred layout
    // Calculate the midpoint between 33.33% and 50%
    const snapThreshold = (33.33 + 50) / 2; // Approximately 41.665

    // Use a functional update for setColumnSizes if it depends on the current state
    // or ensure columnSizes is stable if read directly.
    // For this case, columnSizes.left would be the most recent one set by doResize.
    setColumnSizes(currentSizes => {
      // Bepaal nieuwe layout - dit zorgt voor de visuele "snap"
      const newSizes = currentSizes.left <= snapThreshold 
        ? { left: 33.33, right: 66.67 } 
        : { left: 50, right: 50 };
      
      // De opslag van voorkeuren wordt afgehandeld door de useEffect hierboven
      // als we klaar zijn met resizen (prevIsResizingRef.current === true && isResizing === false)
      return newSizes;
    });
  }, []);

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

  useEffect(() => {
    // This effect runs after every render. So, when the main effect (below) runs,
    // prevIsResizingRef.current will hold the value of isResizing from the *previous* render cycle.
    prevIsResizingRef.current = isResizing;
  }); // No dependency array, so it runs after each render.

  // Mark the task as viewed when it is loaded
  useEffect(() => {
    if (id && task && !task.isNew) {
      // Alleen markeren als de taak als nieuw is gemarkeerd
      return;
    }
    
    if (id && task) {
      markTaskAsViewed(id);
    }
  }, [id, task, markTaskAsViewed]);

  const getCategoryBackgroundIcon = (category?: string) => {
    const iconProps = { 
      className: "category-background-icon opacity-40",
      size: 110, 
      strokeWidth: 0.6 
    };
    
    switch(category) {
      case "Werk/Studie":
        return <BriefcaseBusiness {...iconProps} />;
      case "Persoonlijk":
        return <Icon iconNode={frogFace} {...iconProps} />;
      case "Huishouden":
        return <Home {...iconProps} />;
      case "Familie":
        return <Users {...iconProps} />;
      case "Sociaal":
        return <GlassWater {...iconProps} />;
      case "Gezondheid":
        return <Heart {...iconProps} />;
      case "Financiën":
        return <Wallet {...iconProps} />;
      case "Projecten":
        return <Sparkles {...iconProps} />;
      default:
        return null;
    }
  };

  if (tasksLoading) {
    return null;
  }

  if (!task) {
    return (
      <AppLayout backButtonPath="/">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <h2 className="text-xl font-semibold mb-2">{t('taskDetail.notFound.title')}</h2>
          <p className="text-muted-foreground mb-6">{t('taskDetail.notFound.message')}</p>
          <Button onClick={() => navigate('/')}>{t('taskDetail.notFound.returnButton')}</Button>
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

  const priorityClass = `priority-${task.priority}`;

  if (tasksLoading) {
    return (
      <AppLayout backButtonPath="/">
        <div className="flex items-center justify-center min-h-[80vh]">
          <GradientLoader />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout backButtonPath="/">
      <div className="container max-w-3xl px-4 sm:pt-2 pb-24 md:pb-20">
        <Card className={`relative ${priorityClass} overflow-hidden border border-white/10`}>
          <div className="absolute bottom-2 right-4 z-0 pointer-events-none opacity-40">
            {task.category && getCategoryBackgroundIcon(task.category)}
          </div>
          
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl md:text-2xl mb-1 break-words">
                  {task.emoji && <span className="mr-1.5 text-2xl task-emoji">{task.emoji}</span>}
                  {task.title}
                </CardTitle>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {task.category && (
                    <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 category-badge">
                      {task.category}
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={`
                      px-2 py-0 h-5 flex items-center gap-1
                      ${task.priority === 'high' ? 'text-red-400 border-red-400/30' : ''}
                      ${task.priority === 'medium' ? 'text-amber-400 border-amber-400/30' : ''}
                      ${task.priority === 'low' ? 'text-blue-400 border-blue-400/30' : ''}
                      ${task.priority !== 'high' && task.priority !== 'medium' && task.priority !== 'low' ? 'text-slate-400 border-slate-400/30' : ''}
                    `}
                  >
                    <Flag className="w-3 h-3" />
                    {t(`taskDetail.priority.${task.priority}`)}
                  </Badge>
                  {task.deadline && (
                    <Badge 
                      variant="outline" 
                      className="px-2 py-0 h-5 flex items-center gap-1 text-[10px]"
                    >
                      <CalendarClock className="w-3 h-3" />
                      {(() => {
                        try {
                          const locale = i18n.language === 'nl' ? nl : enUS;
                          return format(parseISO(task.deadline), "PPP", { locale });
                        } catch (e) {
                          return t('taskCard.invalidDate');
                        }
                      })()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t('taskDetail.actions.edit')}</span>
                    </Button>
                  </DialogTrigger>
                  <EditTaskDialog task={task} />
                </Dialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('taskDetail.actions.delete')}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogPortal>
                    <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                    <AlertDialogContent className="bg-card/90 backdrop-blur-md border border-white/10 z-[90]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('taskDetail.deleteConfirmation.title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('taskDetail.deleteConfirmation.description', { taskTitle: task.title })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-secondary/80 border-white/10">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {t('common.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogPortal>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            {task.description && (
              <div className="mb-6">
                <p className="text-muted-foreground whitespace-pre-line">{task.description}</p>
              </div>
            )}
            
            {/* Voeg hier de progressiebalk toe zoals in TaskCard */}
            {totalSubtasks > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {t('taskDetail.progress.label')}
                  </span>
                  <span className="font-medium">
                    {completedSubtasks}/{totalSubtasks} ({Math.round(progressValue)}%)
                  </span>
                </div>
                <div className="relative h-3.5 bg-white/20 backdrop-blur-md rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300
                      ${task.priority === 'high' ? 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 shadow-[0_0_8px_2px_rgba(244,63,94,0.4)]' : ''}
                      ${task.priority === 'medium' ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.4)]' : ''}
                      ${task.priority === 'low' ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]' : ''}
                      ${task.priority !== 'high' && task.priority !== 'medium' && task.priority !== 'low' ? 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-[0_0_8px_2px_rgba(100,116,139,0.3)]' : ''}
                    `}
                    style={{ width: `${progressValue}%` }}
                  />
                  {progressValue > 10 && (
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white font-bold select-none">
                      {Math.round(progressValue)}%
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Subtasks section - behoud de bestaande code maar verbeter styling */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-lg">
                  {t('taskDetail.subtasks.title')}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSubtasks}
                    disabled={generatingSubtasks || task.subtasks.length > 0}
                    className="h-8 px-2 font-normal"
                  >
                    {generatingSubtasks ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        {t('taskDetail.subtasks.generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        {t('taskDetail.subtasks.generate')}
                      </>
                    )}
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                        {t('taskDetail.subtasks.add')}
                      </Button>
                    </DialogTrigger>
                    <DialogPortal>
                      <DialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                      <DialogContent className="bg-card/90 backdrop-blur-md border border-white/10 z-[90]">
                        <DialogHeader>
                          <DialogTitle>{t('taskDetail.subtasks.addDialogTitle')}</DialogTitle>
                          <DialogDescription>
                            {t('taskDetail.subtasks.addDialogDescription')}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSubtask} className="space-y-4">
                          <Input
                            placeholder={t('taskDetail.subtasks.titlePlaceholder')}
                            value={newSubtaskTitle}
                            onChange={e => setNewSubtaskTitle(e.target.value)}
                            className="bg-background/50"
                          />
                          <Input
                            placeholder={t('taskDetail.subtasks.descriptionPlaceholder')}
                            value={newSubtaskDescription}
                            onChange={e => setNewSubtaskDescription(e.target.value)}
                            className="bg-background/50"
                          />
                          <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                {t('common.cancel')}
                              </Button>
                            </DialogClose>
                            <Button type="submit" disabled={!newSubtaskTitle.trim()}>
                              {t('common.save')}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </DialogPortal>
                  </Dialog>
                </div>
              </div>

              {/* Houd de bestaande subtakenlijst intact */}
              <div className="mt-2">
                {task.subtasks.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    {t('taskDetail.subtasks.empty')}
                  </div>
                ) : (
                  <div 
                    ref={subtasksContainerRef}
                    className={`space-y-1 max-h-[${subtasksExpanded ? '100vh' : '320px'}] overflow-y-auto transition-all duration-300 pr-2 subtasks-container scrollbar-thin`}
                  >
                    <AnimatePresence initial={false}>
                      {sortedSubtasks.map((subtask, index) => (
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
                          deleteSubtask={deleteSubtask}
                          onSubtaskLongPress={(subtaskId, event) => handleSubtaskLongPress(subtaskId, event)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              
              {task.subtasks.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                  className="w-full mt-2 h-7 text-xs font-normal"
                >
                  {subtasksExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                      {t('taskDetail.subtasks.collapse')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                      {t('taskDetail.subtasks.expand')}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Houd de bestaande TaskAIChat component */}
            <div className="mt-6">
              <Separator className="my-6" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-lg flex items-center">
                  <MessageSquareText className="h-5 w-5 mr-2" />
                  {t('taskDetail.aiChat.title')}
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4" />
                        <span className="sr-only">{t('taskDetail.aiChat.info')}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-80 p-4">
                      <p>{t('taskDetail.aiChat.tooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <TaskAIChat task={task} />
            </div>
          </CardContent>
        </Card>
        
        {/* Subtask Context Menu popup (bestaande code) */}
        {contextMenu.visible && (
          <div 
            ref={contextMenuRef}
            className="fixed z-50 w-48 bg-popover/95 backdrop-blur-md border border-white/10 rounded-md shadow-lg py-1 text-popover-foreground"
            style={{
              top: `${contextMenu.y}px`, 
              left: `${contextMenu.x}px` 
            }}
          >
            <button
              className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent/50"
              onClick={() => {
                if (contextMenu.subtaskId) {
                  const subtask = task.subtasks.find(st => st.id === contextMenu.subtaskId);
                  if (subtask) {
                    startEditingSubtask(subtask);
                    closeSubtaskContextMenu();
                  }
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('taskDetail.subtask.contextMenu.edit')}
            </button>
            <button
              className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent/50"
              onClick={() => {
                if (contextMenu.subtaskId) {
                  const subtask = task.subtasks.find(st => st.id === contextMenu.subtaskId);
                  if (subtask) {
                    handleSubtaskToggle(subtask.id, !subtask.completed);
                    closeSubtaskContextMenu();
                  }
                }
              }}
            >
              <input 
                type="checkbox" 
                checked={contextMenu.subtaskId ? task.subtasks.find(st => st.id === contextMenu.subtaskId)?.completed : false}
                readOnly
                className="h-4 w-4 mr-2"
              />
              {contextMenu.subtaskId && task.subtasks.find(st => st.id === contextMenu.subtaskId)?.completed 
                ? t('taskDetail.subtask.contextMenu.markIncomplete')
                : t('taskDetail.subtask.contextMenu.markComplete')}
            </button>
            <Separator className="my-1" />
            <button
              className="flex w-full items-center px-4 py-2 text-sm hover:bg-destructive/50 text-destructive hover:text-destructive-foreground"
              onClick={() => {
                if (contextMenu.subtaskId) {
                  deleteSubtask(task.id, contextMenu.subtaskId);
                  closeSubtaskContextMenu();
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('taskDetail.subtask.contextMenu.delete')}
            </button>
          </div>
        )}

        {/* Resizer handle en splitter (bestaande code) */}
        <div 
          ref={resizerRef}
          className={`fixed bottom-0 left-0 right-0 z-40 h-12 flex justify-center items-center cursor-ns-resize opacity-0 bg-gradient-to-t from-background/80 to-transparent hover:opacity-100 transition-opacity ${isResizing ? 'opacity-100' : ''}`}
          onMouseDown={startResize}
          onTouchStart={startResize}
        >
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full"></div>
        </div>
      </div>
    </AppLayout>
  );
}