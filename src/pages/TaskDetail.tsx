import { useState, useEffect, useRef, useMemo } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { ArrowLeft, Trash2, Edit, PlusCircle, Sparkles, X, Save, Loader2, ChevronUp, ChevronDown, ArrowUpDown, CornerUpRight, MessageSquareText } from "lucide-react";
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
} from "@/components/ui/dialog.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import TaskAIChat from "@/components/ai/TaskAIChat.tsx";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Task, SubTask } from "@/types/task.ts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth.ts";
import SubtaskRow from "@/components/task/SubtaskRow.tsx";
import { useResizableLayout } from "@/hooks/useResizableLayout.ts";
import TaskDisplayCard from "@/components/task/TaskDisplayCard.tsx";
import { 
  BriefcaseBusiness,
  Home, 
  Users,
  GlassWater, 
  Heart, 
  Wallet,
  User,
  BookOpen,
  Hammer
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import EditTaskDialog from "@/components/tasks/EditTaskDialog.tsx";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS } from "@/constants/categories.ts";
import { createPortal } from 'react-dom';

/**
 * Task detail page component that displays comprehensive information about a task.
 * 
 * This page shows all details of a specific task, including:
 * - Title, description, priority, due date, and category
 * - Subtasks with completion status
 * - Task actions (edit, delete, AI generation)
 * - AI chat interface for task assistance
 * - Resizable layout for details and chat panels
 * 
 * The component provides functionality for:
 * - Managing subtasks (add, toggle, delete)
 * - Generating subtasks using AI
 * - Editing and deleting the task
 * - Communicating with AI assistant about the task
 * 
 * @returns {JSX.Element} The TaskDetail page component
 */
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
    isGeneratingSubtasksForTask,
    getMaxAiGenerationsForUser,
    isAiGenerationLimitReached,
    markTaskAsViewed,
    toggleTaskCompletion,
    toggleFavorite,
    deleteAllSubtasks,
    promoteSubtaskToTask,
  } = useTask();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState(location.hash === '#chat' ? 'chat' : 'details');
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isGenerateSubtasksDialogOpen, setIsGenerateSubtasksDialogOpen] = useState(false);
  const [isMobileGenerateDialogOpen, setIsMobileGenerateDialogOpen] = useState(false);
  const [contextMenuSubtaskId, setContextMenuSubtaskId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [isDescriptionMinimized, setIsDescriptionMinimized] = useState(false);
  const [selectedSubtaskTitle, setSelectedSubtaskTitle] = useState<string | null>(null);
  const subtaskCardRef = useRef<HTMLDivElement>(null);
  const [subtaskSortOrder, setSubtaskSortOrder] = useState<'default' | 'completedFirst' | 'incompleteFirst'>('default');
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  
  // State for showing progress instead of deadline
  const [showProgressInsteadOfDeadline, setShowProgressInsteadOfDeadline] = useState(false);

  // New state for centralized subtask deletion dialog
  const [subtaskToDelete, setSubtaskToDelete] = useState<SubTask | null>(null);
  const [isDeleteSubtaskDialogOpen, setIsDeleteSubtaskDialogOpen] = useState(false);

  // New state for triggering subtask edit from context menu
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);

  // New state for "Delete All Subtasks" dialog
  const [isDeleteAllSubtasksDialogOpen, setIsDeleteAllSubtasksDialogOpen] = useState(false);

  // State for mobile FAB visibility
  const [isFabVisibleForMobile, setIsFabVisibleForMobile] = useState(true);
  const fabScrollTimeout = useRef<number | null>(null);
  const SCROLL_THRESHOLD = 5; // Only change visibility if scrolled more than 5px

  const { user } = useAuth();

  /**
   * Hook for managing resizable layout columns (details and chat panels).
   * @property {object} columnSizes - Current sizes of the left and right columns.
   * @property {React.RefObject<HTMLDivElement>} containerRef - Ref for the container HTMLScDivElement of the resizable layout.
   * @property {(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void} startResize - Function to initiate resizing.
   * @property {boolean} isResizing - Boolean indicating if resizing is currently active.
   */
  const { 
    columnSizes, 
    containerRef, 
    startResize, 
    isResizing
  } = useResizableLayout({ initialLayoutPreference: (user?.layout_preference as '50-50' | '33-67') || '50-50' });

  const task: Task | undefined = getTaskById(id || "");
  
  const currentAiGenerationCount = task?.aiSubtaskGenerationCount || 0;
  
  // Deadline formatting
  let deadlineText: string | null = null;
  let deadlineDay: string | null = null;
  let deadlineMonth: string | null = null;
  
  if (task && task.deadline) {
    try {
      const locale = i18n.language === 'nl' ? nl : enUS;
      deadlineText = format(parseISO(task.deadline), "PPP", { locale });
      deadlineDay = format(parseISO(task.deadline), "d", { locale });
      deadlineMonth = format(parseISO(task.deadline), "MMM", { locale });
    } catch (e) {
      deadlineText = t('taskCard.invalidDate');
    }
  }

  // Estimated height of the context menu in pixels
  const ESTIMATED_CONTEXT_MENU_HEIGHT = 160; 
  const MENU_OFFSET = 5; 

  /**
   * Determines the CSS classes for styling based on task priority.
   * 
   * @param {string} [priority='none'] - The priority level of the task ('high', 'medium', 'low', or 'none').
   * @returns {{ backgroundClass: string; shadowClass: string; directPriorityClass: string }} An object containing the CSS classes for background and shadow effects.
   */
  const getPriorityClass = (priority: string = 'none'): { backgroundClass: string; shadowClass: string; directPriorityClass: string } => {
    let backgroundClass = '';
    let shadowClass = '';
    let directPriorityClass = '';

    switch(priority) {
      case 'high':
        backgroundClass = 'bg-gradient-to-br from-[#b12429]/30 via-[#8112a9]/30 to-[#690365]/30 dark:bg-gradient-to-br dark:from-[rgba(220,38,38,0.8)] dark:via-[rgba(150,25,80,0.75)] dark:to-[rgba(70,20,90,0.7)]';
        shadowClass = 'neumorphic-shadow-high';
        directPriorityClass = 'priority-high';
        break;
      case 'medium':
        backgroundClass = 'bg-gradient-to-br from-[#db7b0b]/30 via-[#9e4829]/30 to-[#651945]/30 dark:bg-gradient-to-br dark:from-[rgba(255,145,0,0.9)] dark:to-[rgba(101,12,78,0.85)]';
        shadowClass = 'neumorphic-shadow-medium';
        directPriorityClass = 'priority-medium';
        break;
      case 'low':
        backgroundClass = 'bg-gradient-to-br from-blue-500/30 via-cyan-400/30 to-teal-400/30 dark:bg-gradient-to-br dark:from-[rgb(36,74,212)] dark:via-[rgba(15,168,182,0.75)] dark:to-[rgba(16,185,129,0.7)]';
        shadowClass = 'neumorphic-shadow-low';
        directPriorityClass = 'priority-low';
        break;
      default:
        backgroundClass = 'bg-gradient-to-br from-blue-600/30 to-purple-700/30 dark:bg-gradient-to-br dark:from-[rgba(100,116,139,0.8)] dark:via-[rgba(71,85,105,0.75)] dark:to-[rgba(51,65,85,0.7)]';
        shadowClass = 'neumorphic-shadow-none';
        directPriorityClass = 'priority-none';
        break;
    }
    return { backgroundClass, shadowClass, directPriorityClass };
  };

  const priorityStyles = task ? getPriorityClass(task.priority) : getPriorityClass();

  const maxGenerations = getMaxAiGenerationsForUser();
  const isLimitReached = task ? isAiGenerationLimitReached(task) : false;
  
  /**
   * Memoized array of subtasks, sorted based on the `subtaskSortOrder` state.
   * @type {SubTask[]}
   */
  const sortedSubtasks = useMemo(() => {
    if (!task?.subtasks) return [];
    const subtasksCopy = [...task.subtasks]; 

    if (subtaskSortOrder === 'completedFirst') {
      return subtasksCopy.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? -1 : 1;
      });
    } else if (subtaskSortOrder === 'incompleteFirst') {
      return subtasksCopy.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }
    return subtasksCopy; // Default order (as fetched or previously sorted)
  }, [task?.subtasks, subtaskSortOrder]);

  /**
   * Toggles the completion status of a subtask.
   * 
   * @param {string} subtaskId - The ID of the subtask to toggle.
   * @param {boolean} completed - The new completion status of the subtask.
   */
  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    if (!task) return;
    try {
      await updateSubtask(task.id, subtaskId, { completed });
    } catch (error) {
      toast({ variant: "destructive", title: t('common.error'), description: t('taskDetail.toast.subtaskStatusUpdateFailedDescription') });
    }
  };

  /**
   * Adds a new subtask to the current task.
   * 
   * @param {React.FormEvent} e - The form event triggering the addition.
   */
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

  /**
   * Initiates AI-based subtask generation for the current task.
   * It calls the `expandTask` function from context and handles dialog states.
   * Logs an error if the task is undefined.
   * @async
   */
  const handleGenerateSubtasks = async () => {
    if (task) {
      try {
        await expandTask(task.id, task, user?.language_preference || 'en');
      } catch (error) {
        // Error handling managed by expandTask
      }
      setIsGenerateSubtasksDialogOpen(false);
      setIsMobileGenerateDialogOpen(false);
    }
  };

  /**
   * Scrolls to the top of the page if no hash is present in the URL.
   * This ensures that the user sees the top of the task details
   * when navigating directly to the page without a specific section hash.
   */
  useEffect(() => {
    if (!location.hash) {
      globalThis.scrollTo(0, 0);
    }
  }, [location.hash]);

  /**
   * Locks or unlocks body scroll based on the state of various dialogs.
   * This prevents background scrolling when a dialog (edit, generate subtasks, etc.) is open.
   */
  useEffect(() => {
    const shouldLock = isEditDialogOpen || isGenerateSubtasksDialogOpen || isMobileGenerateDialogOpen || isDeleteSubtaskDialogOpen || isDeleteAllSubtasksDialogOpen;
    document.body.style.overflow = shouldLock ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isEditDialogOpen, isGenerateSubtasksDialogOpen, isMobileGenerateDialogOpen, isDeleteSubtaskDialogOpen, isDeleteAllSubtasksDialogOpen]);

  /**
   * Sets the active mobile view (details or chat) based on the URL hash.
   * Allows linking directly to the chat view on mobile by checking `location.hash`.
   */
  useEffect(() => {
    setActiveMobileView(location.hash === '#chat' ? 'chat' : 'details');
  }, [location.hash]);

  const totalSubtasks = task?.subtasks.length ?? 0;
  const completedSubtasks = task?.subtasks.filter(st => st.completed).length ?? 0;
  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  /**
   * Marks the task as viewed when the component mounts or the task/ID changes,
   * but only if the task is marked as `isNew` (not previously viewed).
   * Relies on `markTaskAsViewed` from `useTask` context.
   */
  useEffect(() => {
    if (id && task && !task.isNew) {
      return;
    }
    
    if (id && task) {
      markTaskAsViewed(id);
    }
  }, [id, task, markTaskAsViewed]);

  // Effect to handle clicks outside the subtask context menu
  /**
   * Effect to set up and tear down event listeners for clicks outside the subtask context menu.
   * Closes the context menu if a click occurs outside of it.
   */
  useEffect(() => {
    /**
     * Closes the subtask context menu if a click occurs outside of it.
     * @param {MouseEvent | TouchEvent} event - The click or touch event.
     */
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeSubtaskContextMenu();
      }
    }

    if (contextMenuSubtaskId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [contextMenuSubtaskId]);

  /**
   * Finds the translation key for a given category string.
   * @param {string} category - The category string (e.g., "Work/Study").
   * @returns {string} The translation key (e.g., "categories.workStudy") or the original category string if not found.
   */
  const getCategoryTranslationKey = (category: string) => {
    const index = TASK_CATEGORIES.findIndex(cat => cat === category);
    return index !== -1 ? TASK_CATEGORY_KEYS[index] : category;
  };

  // Get translated category name
  /**
   * Gets the translated name for a given category string using its translation key.
   * @param {string} [category] - The category string.
   * @returns {string} The translated category name, or an empty string if category is undefined.
   */
  const getTranslatedCategory = (category?: string) => {
    if (!category) return "";
    const translationKey = getCategoryTranslationKey(category);
    return t(translationKey);
  };

  /**
   * Gets the appropriate background icon component for a given task category.
   * The icon's color is adjusted based on the task's priority and status.
   * @param {string} [category] - The category string.
   * @param {string} [taskStatus] - The task status ('done' or other).
   * @returns {JSX.Element | null} The icon component or null if the category is not recognized.
   */
  const getCategoryBackgroundIcon = (category?: string, taskStatus?: string) => {
    let iconColorClass = "text-muted-foreground"; // Default color
    let opacityClass = "opacity-40"; // Default opacity

    if (taskStatus === 'done') {
      iconColorClass = "text-[#51976a]"; // Custom green color for done tasks
      opacityClass = "opacity-60"; // Consistent with TaskCard
    } else {
      // No specific colors for priorities here, only default color
      // Hover colors are handled via CSS
      opacityClass = "opacity-40"; // Default opacity for non-completed tasks
    }
    
    const iconProps = { 
      className: `category-background-icon ${iconColorClass} ${opacityClass}`,
      size: 52, 
      strokeWidth: 0.6
    };
    
    const normalizedCategory = category?.toLowerCase();

    switch(normalizedCategory) {
      case "werk/studie": // Dutch
      case "work": // English
        return <BriefcaseBusiness {...iconProps} />;
      case "persoonlijk": // Dutch
      case "personal": // English
        return <User {...iconProps} />;
      case "thuis": // Dutch
      case "home": // English 
        return <Home {...iconProps} />;
      case "familie": // Dutch
      case "family": // English
        return <Users {...iconProps} />;
      case "sociaal": // Dutch
      case "social": // English
        return <GlassWater {...iconProps} />;
      case "gezondheid": // Dutch
      case "health": // English
        return <Heart {...iconProps} />;
      case "financiën": // Dutch
      case "finances": // English
        return <Wallet {...iconProps} />;
      case "projecten": // Dutch
      case "projects": // English
      case "project": // English (singular)
        return <Hammer {...iconProps} />;
      case "leren": // Dutch
      case "learning": // English
        return <BookOpen {...iconProps} />;
      default:
        return null;
    }
  };

  /**
   * Closes the context menu for subtasks.
   * Resets the context menu subtask ID and position.
   */
  const closeSubtaskContextMenu = () => {
    setContextMenuSubtaskId(null);
    setContextMenuPosition(null);
  };

  /**
   * Opens the action menu for a subtask, calculating its position relative to the subtask row and viewport.
   * @param {string} subtaskId - The ID of the subtask for which to open the menu.
   * @param {React.MouseEvent} event - The mouse event that triggered the menu opening.
   */
  const handleOpenSubtaskActionMenu = (subtaskId: string, event: React.MouseEvent) => {
    const subtaskRowElement = event.currentTarget as HTMLElement;

    if (contextMenuSubtaskId === subtaskId && contextMenuPosition !== null) {
      closeSubtaskContextMenu();
      return;
    }

    const subtaskRowRect = subtaskRowElement.getBoundingClientRect();
    const viewportHeight = globalThis.innerHeight;
    const viewportWidth = globalThis.innerWidth;
    const menuHeight = ESTIMATED_CONTEXT_MENU_HEIGHT; // 160
    const menuWidth = 224; // w-56

    let top: number;
    // Try to position below the element
    if (subtaskRowRect.bottom + menuHeight + MENU_OFFSET <= viewportHeight) {
      top = subtaskRowRect.bottom + MENU_OFFSET;
    // Try to position above the element
    } else if (subtaskRowRect.top - menuHeight - MENU_OFFSET >= 0) {
      top = subtaskRowRect.top - menuHeight - MENU_OFFSET;
    } else {
      // Fallback: if neither fits, try at the top of the viewport (or as close as possible)
      top = MENU_OFFSET;
    }

    let left: number;
    // If the item is more than halfway across the screen to the right, try to open to the left if possible
    if (subtaskRowRect.left > viewportWidth / 2 && subtaskRowRect.left - menuWidth - MENU_OFFSET > 0) {
      left = subtaskRowRect.right - menuWidth - MENU_OFFSET; // Align with right edge of item
    // Default: try to the right of the element
    } else if (subtaskRowRect.left + menuWidth + MENU_OFFSET <= viewportWidth) {
      left = subtaskRowRect.left + MENU_OFFSET;
    // Try to the left of the element if right does not fit (and the previous check did not apply)
    } else if (subtaskRowRect.right - menuWidth - MENU_OFFSET >= 0) {
      left = subtaskRowRect.right - menuWidth - MENU_OFFSET;
    } else {
      // Fallback: if neither fits horizontally, try to the left in the viewport
      left = MENU_OFFSET;
    }
    
    setContextMenuSubtaskId(subtaskId);
    setContextMenuPosition({ top, left });
  };

  // Effect for mobile FAB visibility on scroll
  useEffect(() => {
    const mainContentElement = document.querySelector('.firebase-card.subtask-card-glow-target .overflow-y-auto.scrollbar-thin');
    let localLastScrollY = 0;

    if (mainContentElement) {
      localLastScrollY = mainContentElement.scrollTop;
    } else if (typeof globalThis !== 'undefined' && typeof globalThis.scrollY === 'number') {
      localLastScrollY = globalThis.scrollY;
    }

    const handleScroll = () => {
      let currentScrollY = localLastScrollY;
      if (mainContentElement) {
        currentScrollY = mainContentElement.scrollTop;
      } else if (typeof globalThis !== 'undefined' && typeof globalThis.scrollY === 'number') {
        currentScrollY = globalThis.scrollY;
      }
      const scrollDifference = currentScrollY - localLastScrollY;

      if (Math.abs(scrollDifference) > SCROLL_THRESHOLD) {
        if (currentScrollY > localLastScrollY && currentScrollY > 50) { // Scrolled down
          setIsFabVisibleForMobile(false);
        } else { // Scrolled up or at the top
          setIsFabVisibleForMobile(true);
        }
      }
      localLastScrollY = currentScrollY;
    };
    
    const throttledHandleScroll = () => {
      if (typeof globalThis === 'undefined' || typeof globalThis.setTimeout !== 'function') return;
      if (fabScrollTimeout.current) {
        clearTimeout(fabScrollTimeout.current);
      }
      fabScrollTimeout.current = globalThis.setTimeout(handleScroll, 100);
    };

    if (typeof globalThis !== 'undefined' && typeof globalThis.innerWidth === 'number' && globalThis.innerWidth < 1024) { // Only apply for mobile
      if (mainContentElement && typeof mainContentElement.addEventListener === 'function') {
        mainContentElement.addEventListener('scroll', throttledHandleScroll);
      } else if (typeof globalThis.addEventListener === 'function'){
        globalThis.addEventListener('scroll', throttledHandleScroll);
      }
    }

    return () => {
      if (fabScrollTimeout.current && typeof globalThis.clearTimeout === 'function') {
        clearTimeout(fabScrollTimeout.current);
      }
      if (typeof globalThis !== 'undefined' && typeof globalThis.innerWidth === 'number' && globalThis.innerWidth < 1024) {
        if (mainContentElement && typeof mainContentElement.removeEventListener === 'function') {
          mainContentElement.removeEventListener('scroll', throttledHandleScroll);
        } else if (typeof globalThis.removeEventListener === 'function') {
          globalThis.removeEventListener('scroll', throttledHandleScroll);
        }
      }
    };
  }, []); // Re-run if the scrollable element might change, or on mount/unmount

  const handlePromoteSubtaskToTask = async (subtaskId: string | null) => {
    if (!task || !subtaskId) return;
    closeSubtaskContextMenu();
    try {
      const promotedTask = await promoteSubtaskToTask(task.id, subtaskId);
      if (promotedTask) {
        toast({
          title: t('taskDetail.toast.subtaskPromotedSuccessTitle'),
          description: t('taskDetail.toast.subtaskPromotedSuccessDescription'),
        });
        // Optional: navigate to the new main task
        // navigate(`/task/${promotedTask.id}`);
      } else {
        throw new Error("Promotion returned undefined task");
      }
    } catch (error) {
      console.error("Failed to promote subtask:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('taskDetail.toast.subtaskPromotionFailedDescription'),
      });
    }
  };

  if (tasksLoading && !task) {
    return (
      <AppLayout noPadding>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <GradientLoader />
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <p className="text-xl text-muted-foreground">{t('taskContext.taskNotFoundWithNoQuotes', { taskId: id })}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('taskDetail.backButton')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  /**
   * Handles the deletion of the current task.
   * Navigates to the home page on successful deletion.
   * Displays toast notifications for success or failure.
   * @async
   * @returns {Promise<void>}
   */
  const handleDelete = async () => {
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
    }
  };

  /**
   * Handles the deletion of all subtasks for the current task.
   * Displays toast notifications for success or failure and closes the confirmation dialog.
   * @async
   */
  const handleDeleteAllSubtasks = async () => {
    if (task) {
      const subtaskCount = task.subtasks.length; // Store count before deletion
      try {
        await deleteAllSubtasks(task.id);
        toast({ 
          title: t('taskDetail.toast.allSubtasksDeleted.title'), 
          description: t('taskDetail.toast.allSubtasksDeleted.description', { count: subtaskCount }) 
        });
      } catch (error) {
        toast({ 
          variant: "destructive", 
          title: t('common.error'), 
          description: t('taskDetail.toast.allSubtasksDeleteFailed.description') 
        });
      } finally {
        setIsDeleteAllSubtasksDialogOpen(false);
      }
    }
  };

  return (
    <AppLayout noPadding>
      <div className="relative pb-20 mb-4 md:container md:mx-auto md:px-4 md:pt-8 md:pb-4 max-sm:pb-0 max-sm:mb-0">
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
          <div 
            className={cn(
              "flex flex-col h-full",
              "lg:flex-[0_0_auto]",
              activeMobileView === 'chat' ? 'hidden lg:flex' : 'flex w-full'
            )}
            style={globalThis.innerWidth >= 1024 ? { width: `${columnSizes.left}%` } : {}}
          >
            {task && (
              <TaskDisplayCard
                task={task}
                isDescriptionMinimized={isDescriptionMinimized}
                priorityStyles={priorityStyles}
                deadlineDay={deadlineDay}
                deadlineMonth={deadlineMonth}
                deadlineText={deadlineText}
                getTranslatedCategory={getTranslatedCategory}
                getCategoryBackgroundIcon={getCategoryBackgroundIcon}
                onToggleStatus={() => toggleTaskCompletion(task.id, task?.status !== 'done')}
                onEdit={() => setIsEditDialogOpen(true)}
                onConfirmDelete={handleDelete}
                totalSubtasks={totalSubtasks}
                completedSubtasks={completedSubtasks}
                progressValue={progressValue}
                isGeneratingSubtasks={isGeneratingSubtasksForTask(task.id)}
                t={t}
                toggleFavorite={toggleFavorite}
                showProgressInsteadOfDeadline={showProgressInsteadOfDeadline}
                toggleProgressDisplay={() => setShowProgressInsteadOfDeadline(prev => !prev)}
              />
            )}

            {task && (
              <Card 
                ref={subtaskCardRef}
                className={cn(
                  "firebase-card subtask-card-glow-target flex-col relative overflow-hidden z-10",
                  "rounded-xl lg:rounded-lg flex-grow min-h-0 h-full p-0",
                  "border-l border-border",
                  priorityStyles.shadowClass,
                  "transition-all duration-800 ease-in-out"
                )}
              >
                <CardHeader className="px-4 pt-2 pb-0.5 lg:px-4 lg:pt-2 lg:pb-0.5 relative">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 mr-2">
                        {t('taskDetail.subtasksTitle')} ({completedSubtasks}/{totalSubtasks})
                      </h3>
                      <div className="flex items-center space-x-1">
                        {task.subtasks && task.subtasks.length > 0 && (
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setIsDeleteAllSubtasksDialogOpen(true)}
                                  className="h-6 w-6 text-muted-foreground/60 hover:text-red-500 dark:text-muted-foreground/60 dark:hover:text-red-400"
                                  aria-label={t('taskDetail.deleteAllSubtasks.ariaLabel')}
                                  disabled={task.subtasks.length === 0}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="center">
                                <p>{t('taskDetail.deleteAllSubtasks.tooltip')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (subtaskSortOrder === 'default') {
                                    setSubtaskSortOrder('incompleteFirst');
                                  } else if (subtaskSortOrder === 'incompleteFirst') {
                                    setSubtaskSortOrder('completedFirst');
                                  } else {
                                    setSubtaskSortOrder('default');
                                  }
                                }}
                                className="h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground"
                                aria-label={t('taskDetail.sortSubtasksAriaLabel')}
                              >
                                <ArrowUpDown size={14} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="center">
                              <p>
                                {subtaskSortOrder === 'default' ? t('taskDetail.sort.currentSortDefault') :
                                subtaskSortOrder === 'incompleteFirst' ? t('taskDetail.sort.currentSortIncompleteFirst') :
                                t('taskDetail.sort.currentSortCompletedFirst')}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                      <div className="flex items-center">
                        <span className="hidden sm:inline-block mr-2 text-xs text-muted-foreground px-1 py-0.5 rounded bg-background/50 border border-border/30">
                          {isDescriptionMinimized ? t('taskDetail.buttons.showDescription') : t('taskDetail.buttons.hideDescription')}
                        </span>
                          <Button
                            variant="ghost"
                          onClick={() => {
                            setIsDescriptionMinimized(!isDescriptionMinimized);
                            setShowProgressInsteadOfDeadline(!isDescriptionMinimized);
                          }}
                            className={cn(
                              "transition-all duration-300 ease-in-out",
                              "p-0",
                            "h-10 w-10 text-muted-foreground hover:text-foreground",
                              "sm:h-8 sm:w-8"
                            )}
                            aria-label={isDescriptionMinimized ? t('taskDetail.buttons.showDescription') : t('taskDetail.buttons.hideDescription')}
                          >
                            {isDescriptionMinimized ? (
                              <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5" />
                            ) : (
                              <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5" />
                            )}
                          </Button>
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-grow h-full overflow-hidden relative max-h-[calc(100%-25px)]">
                  <div className={cn(
                    "pl-4 pt-1 pb-2",
                    "pr-4",
                    task.subtasks.length > 9 ? "lg:pr-2" : "lg:pr-4",
                    "flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-neutral-200 dark:scrollbar-track-neutral-800 scrollbar-thumb-rounded max-h-full lg:max-h-[calc(100%-80px)]",
                    task.subtasks.length === 0 && "flex items-center justify-center"
                  )}>
                    <AnimatePresence mode='wait'>
                      {task.subtasks.length > 0 ? (
                        <motion.div key="subtask-list" layout className="w-full">
                          {sortedSubtasks.map((subtaskItem: SubTask, index: number) => (
                            <div key={`subtask-wrapper-${subtaskItem.id}`} className="relative">
                              <SubtaskRow 
                                task={task}
                                subtask={subtaskItem}
                                index={index}
                                handleSubtaskToggle={handleSubtaskToggle}
                                onOpenActionMenu={(subId, ev) => handleOpenSubtaskActionMenu(subId, ev)}
                                onInitiateDelete={(subtaskToDel) => {
                                  setSubtaskToDelete(subtaskToDel);
                                  setIsDeleteSubtaskDialogOpen(true);
                                }}
                                editingSubtaskIdFromDetail={editingSubtaskId}
                                onEditStarted={() => setEditingSubtaskId(null)}
                              />
                              {contextMenuSubtaskId === subtaskItem.id && contextMenuPosition && 
                                createPortal(
                                  <motion.div
                                    ref={contextMenuRef}
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="fixed z-50 w-56 rounded-md bg-popover/95 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1.5 border border-border/70 subtask-context-menu"
                                    style={{ top: `${contextMenuPosition.top}px`, left: `${contextMenuPosition.left}px` }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="px-0 py-0 divide-y divide-border/50" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center w-full text-left justify-start px-4 py-2.5 text-sm text-popover-foreground hover:bg-primary/10 rounded-t-md rounded-b-none"
                                        onClick={() => {
                                          setActiveMobileView('chat');
                                          navigate('#chat', { replace: true });
                                          setSelectedSubtaskTitle(subtaskItem.title);
                                          closeSubtaskContextMenu();
                                        }}
                                      >
                                        <MessageSquareText className="mr-2 h-4 w-4" />
                                        {t('taskDetail.subtaskActions.discussInChat')}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center w-full text-left justify-start px-4 py-2.5 text-sm text-popover-foreground hover:bg-primary/10 disabled:opacity-50 rounded-none"
                                        onClick={() => {
                                          setEditingSubtaskId(subtaskItem.id);
                                          closeSubtaskContextMenu();
                                        }}
                                        disabled={subtaskItem.completed}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        {t('taskDetail.subtaskActions.edit')}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center w-full text-left justify-start px-4 py-2.5 text-sm text-popover-foreground hover:bg-primary/10 disabled:opacity-50 rounded-none"
                                        onClick={() => {
                                          handlePromoteSubtaskToTask(subtaskItem.id);
                                          closeSubtaskContextMenu();
                                        }}
                                      >
                                        <CornerUpRight className="mr-2 h-4 w-4" />
                                        {t('taskDetail.subtaskActions.promoteToTask')}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="flex items-center w-full text-left justify-start px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-destructive/10 dark:hover:text-red-300 rounded-b-md rounded-t-none focus-visible:ring-destructive"
                                        onClick={() => {
                                          setSubtaskToDelete(subtaskItem);
                                          setIsDeleteSubtaskDialogOpen(true);
                                          closeSubtaskContextMenu();
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {t('taskDetail.subtaskActions.delete')}
                                      </Button>
                                    </div>
                                  </motion.div>,
                                  document.body
                                )
                              }
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.p 
                          key="no-subtasks" 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          className="text-muted-foreground text-sm text-center"
                        >
                          {t('taskDetail.noSubtasks')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="hidden lg:flex lg:flex-col flex-shrink-0 px-4 pt-2 pb-3 lg:px-6 lg:pt-3 lg:pb-3 border-t border-border bg-card/80 backdrop-blur-md">
                    <div className="flex items-center flex-wrap gap-3 justify-center mb-1">
                      {showAddSubtaskForm ? (
                        <form onSubmit={handleAddSubtask} className="flex items-center gap-3 flex-grow">
                          <label htmlFor="new-subtask-title-desktop" className="sr-only">{t('taskDetail.newSubtaskTitleLabel', 'Title for new subtask')}</label>
                          <Input
                            id="new-subtask-title-desktop"
                            name="new-subtask-title-desktop"
                            type="text"
                            placeholder={t('taskDetail.addSubtaskPlaceholder')}
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
                          <div className="flex flex-wrap items-center gap-3 justify-center w-full">
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
                            <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-card/90 backdrop-blur-md p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>{t('common.generateSubtasksDialogTitle')}</DialogTitle>
                                <DialogDescription>
                                  {t('common.generateSubtasksDialogDescription', { taskTitle: task?.title })}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4 flex flex-row gap-3">
                                <DialogClose asChild>
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="order-first sm:order-none flex-1 h-12 py-2 bg-secondary/80 border-white/10"
                                  >
                                    {t('common.cancel')}
                                  </Button>
                                </DialogClose>
                                <Button
                                  disabled={isGeneratingSubtasksForTask(task.id) || isLimitReached}
                                  variant="default"
                                  className="flex-1 h-12 py-2 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
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
                              </div>
                            </DialogContent>
                          </DialogPortal>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div
            className={cn(
              "hidden lg:flex items-center justify-center cursor-ew-resize bg-transparent transition-all duration-300 relative z-30 mx-1 shrink-0",
              "group w-2"
            )}
            onMouseDown={startResize}
          >
            <div 
              className={cn(
                "absolute h-8 w-1 rounded-full bg-transparent flex items-center justify-center transition-all duration-300",
                isResizing ? "scale-y-125" : "hover:bg-primary/5",
                "border-0"
              )}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary/20 transition-all duration-300 group-hover:bg-primary/30"></div>
                <div className="w-1 h-1 rounded-full bg-primary/20 transition-all duration-300 group-hover:bg-primary/30"></div>
                <div className="w-1 h-1 rounded-full bg-primary/20 transition-all duration-300 group-hover:bg-primary/30"></div>
              </div>
            </div>
          </div>

          <Card 
            className={cn(
              "firebase-card chat-card-glow-target overflow-hidden flex flex-col flex-grow min-h-0",
              "lg:flex-[1_1_auto]",
              activeMobileView === 'details' ? 'hidden lg:flex' : 'flex w-full lg:w-auto',
              activeMobileView === 'chat' && 'h-full p-0',
              priorityStyles.shadowClass
            )}
            style={globalThis.innerWidth >= 1024 ? { width: `${columnSizes.right}%` } : { /* Do not explicitly set height here, let flexbox do the work */ }}
          >
            <div className="relative w-full h-full flex flex-col">
              {tasksLoading && <GradientLoader />}
              {!tasksLoading && task && (
                <TaskAIChat
                  task={task}
                  selectedSubtaskTitle={selectedSubtaskTitle}
                />
            )}
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile FAB for adding subtask: Form */}
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

      {/* Mobile FABs for triggering add/generate */}
      {!showAddSubtaskForm && activeMobileView === 'details' && (
        <div 
          className={cn(
            "lg:hidden fixed bottom-20 right-6 z-[60] flex flex-col items-center space-y-3 transition-all duration-300 ease-in-out",
            isFabVisibleForMobile ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
          )}
        >
          <div className="flex flex-col items-center">
            <Button
              variant="default"
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
              onClick={() => setShowAddSubtaskForm(true)}
              aria-label={t('taskDetail.addSubtask.buttonText')}
            >
              <PlusCircle className="h-7 w-7" />
            </Button>
            <p className="text-xs text-center mt-1 text-muted-foreground bg-background/70 backdrop-blur-sm rounded-md px-2 py-0.5">{t('taskDetail.addSubtask.fabText')}</p>
          </div>
          <div className="flex flex-col items-center">
            <Button
              size="icon"
              disabled={isGeneratingSubtasksForTask(task.id) || isLimitReached}
              className="h-14 w-14 rounded-full shadow-lg p-[2px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500"
              onClick={() => setIsMobileGenerateDialogOpen(true)}
              aria-label={t('taskDetail.generateSubtasks.buttonText')}
            >
              <div className="bg-card h-full w-full rounded-full flex items-center justify-center">
                {isGeneratingSubtasksForTask(task.id) ? (
                  <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
                ) : (
                  <Sparkles className="h-6 w-6 text-blue-500" />
                )}
              </div>
            </Button>
            {isLimitReached ? (
              <p className="text-xs text-center mt-1 text-muted-foreground bg-background/70 backdrop-blur-sm rounded-md px-2 py-0.5">{t('taskDetail.generateSubtasks.limitReachedFabText')}</p>
            ) : (
              <p className="text-xs text-center mt-1 text-muted-foreground bg-background/70 backdrop-blur-sm rounded-md px-2 py-0.5">{t('taskDetail.generateSubtasks.fabText')}</p>
            )}
          </div>
        </div>
      )}

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
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <AlertDialogCancel className="order-first sm:order-none flex-1 h-12 py-3 sm:py-2 bg-secondary/80 border-white/10">
                {t('common.cancel')}
              </AlertDialogCancel>
              <Button
                disabled={isGeneratingSubtasksForTask(task.id) || isLimitReached}
                variant="default"
                className="flex-1 h-12 py-3 sm:py-2 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
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
            </div>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogPortal>
            <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card/90 backdrop-blur-md border-white/10 p-6 shadow-lg sm:rounded-lg z-50 sm:max-w-[600px]">
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
              {task && <EditTaskDialog task={task} setOpen={setIsEditDialogOpen} />}
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}

      <AlertDialog open={isDeleteAllSubtasksDialogOpen} onOpenChange={setIsDeleteAllSubtasksDialogOpen}>
        <AlertDialogPortal>
          <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90] sm:max-w-xl p-6 shadow-lg sm:rounded-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('taskDetail.deleteAllSubtasksDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('taskDetail.deleteAllSubtasksDialog.description', { taskTitle: task?.title, count: task?.subtasks?.length })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex flex-col sm:flex-row gap-3">
              <AlertDialogCancel 
                className="order-first sm:order-none flex-1 h-12 py-3 sm:py-2 bg-secondary/80 border-white/10"
              >
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                className="flex-1 h-12 py-3 sm:py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleDeleteAllSubtasks}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      {subtaskToDelete && (
        <AlertDialog open={isDeleteSubtaskDialogOpen} onOpenChange={(open) => {
          setIsDeleteSubtaskDialogOpen(open);
          if (!open) {
            setSubtaskToDelete(null);
          }
        }}>
          <AlertDialogPortal>
            <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90] sm:max-w-xl p-6 shadow-lg sm:rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>{t('taskDetail.subtask.deleteConfirmation.title')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('taskDetail.subtask.deleteConfirmation.description', { subtaskTitle: subtaskToDelete.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 flex flex-col sm:flex-row gap-3">
                <AlertDialogCancel 
                  onClick={() => {
                    setIsDeleteSubtaskDialogOpen(false);
                    setSubtaskToDelete(null);
                  }} 
                  className="order-first sm:order-none flex-1 h-12 py-3 sm:py-2 bg-secondary/80 border-white/10"
                >
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="flex-1 h-12 py-3 sm:py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => {
                    if (task && subtaskToDelete) {
                       deleteSubtaskFromContext(task.id, subtaskToDelete.id);
                    }
                    setIsDeleteSubtaskDialogOpen(false);
                    setSubtaskToDelete(null);
                  }}
                >
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      )}
    </AppLayout>
  );
}