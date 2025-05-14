import { useState, useEffect, useRef } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
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
import { Task, SubTask } from "@/types/task.ts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/hooks/useAuth.ts";
import SubtaskRow from "@/components/task/SubtaskRow.tsx";
import { useResizableLayout } from "@/hooks/useResizableLayout.ts";
import TaskInfoDisplay from "@/components/task/TaskInfoDisplay.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { 
  Icon, 
  BriefcaseBusiness,
  Home, 
  Users,
  GlassWater, 
  Heart, 
  Wallet
} from "lucide-react";
import { frogFace } from "@lucide/lab";
import { format, parseISO } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import EditTaskDialog from "@/components/tasks/EditTaskDialog.tsx";

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
    markTaskAsViewed
  } = useTask();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeMobileView, setActiveMobileView] = useState(location.hash === '#chat' ? 'chat' : 'details');
  const [selectedSubtaskTitle, setSelectedSubtaskTitle] = useState<string | null>(null);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isGenerateSubtasksDialogOpen, setIsGenerateSubtasksDialogOpen] = useState(false);
  const [isMobileGenerateDialogOpen, setIsMobileGenerateDialogOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPressedSubtaskId, setLongPressedSubtaskId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number, left: number } | null>(null);
  const [isInfoCollapsed] = useState(false);
  const [isDescriptionMinimized, setIsDescriptionMinimized] = useState(false);
  const subtaskCardRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

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
      console.error("Invalid date format for deadline in TaskDetail:", task.deadline);
      deadlineText = t('taskCard.invalidDate');
    }
  }

  // Functie om de prioriteitskleur te bepalen voor de achtergrond zonder de lijn
  const getPriorityClass = (priority: string = 'none'): { backgroundClass: string; shadowClass: string } => {
    let backgroundClass = '';
    let shadowClass = '';

    switch(priority) {
      case 'high':
        backgroundClass = 'bg-gradient-to-br from-[#b12429]/30 via-[#8112a9]/30 to-[#690365]/30 dark:bg-gradient-to-br dark:from-[rgba(220,38,38,0.8)] dark:via-[rgba(150,25,80,0.75)] dark:to-[rgba(70,20,90,0.7)]';
        shadowClass = 'neumorphic-shadow-high'; // Verwijst naar de aangepaste CSS klasse
        break;
      case 'medium':
        backgroundClass = 'bg-gradient-to-br from-[#db7b0b]/30 via-[#9e4829]/30 to-[#651945]/30 dark:bg-gradient-to-br dark:from-[rgba(255,145,0,0.9)] dark:to-[rgba(101,12,78,0.85)]';
        shadowClass = 'neumorphic-shadow-medium'; // Verwijst naar de aangepaste CSS klasse
        break;
      case 'low':
        backgroundClass = 'bg-gradient-to-br from-blue-500/30 via-cyan-400/30 to-teal-400/30 dark:bg-gradient-to-br dark:from-[rgb(36,74,212)] dark:via-[rgba(15,168,182,0.75)] dark:to-[rgba(16,185,129,0.7)]';
        shadowClass = 'neumorphic-shadow-low'; // Verwijst naar de aangepaste CSS klasse
        break;
      default:
        backgroundClass = 'bg-gradient-to-br from-blue-600/30 to-purple-700/30 dark:bg-gradient-to-br dark:from-[rgba(100,116,139,0.8)] dark:via-[rgba(71,85,105,0.75)] dark:to-[rgba(51,65,85,0.7)]';
        shadowClass = 'neumorphic-shadow-none'; // Verwijst naar de aangepaste CSS klasse
        break;
    }
    return { backgroundClass, shadowClass };
  };

  const priorityStyles = task ? getPriorityClass(task.priority) : getPriorityClass();

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

  const handleSubtaskLabelClick = (title: string) => {
    setSelectedSubtaskTitle(title);
  };

  const totalSubtasks = task?.subtasks.length ?? 0;
  const completedSubtasks = task?.subtasks.filter(st => st.completed).length ?? 0;
  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

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

  // Functie voor het achtergrondicoon met aanpassing voor elke prioriteitskleur
  const getCategoryBackgroundIcon = (category?: string) => {
    // Vaste opaciteit voor alle iconen (natuurlijke opacity via CSS styling)
    const getIconClass = (priority?: string) => {
      if (priority === 'high') {
        return "text-[rgb(175,36,42)] opacity-20"; // Kleur voor hoge prioriteit
      } else if (priority === 'medium') {
        return "text-[rgb(227,131,6)] opacity-20"; // Kleur voor medium prioriteit
      } else if (priority === 'low') {
        return "text-[#c1ccf5] opacity-20"; // Kleur voor lage prioriteit
      } else {
        return "text-gray-300 opacity-20"; // Standaard kleur
      }
    };

    const iconProps = { 
      className: `category-background-icon ${getIconClass(task?.priority)}`,
      size: 62, 
      strokeWidth: 0.6 
    };
    
    // Gebruik Sparkles component uit bestaande import
    const SparklesIcon = Sparkles;
    
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
        return <SparklesIcon {...iconProps} />;
      default:
        return null;
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
          <p className="text-xl text-muted-foreground">{t('taskContext.taskNotFound', { taskId: id })}</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('taskDetail.backButton')}
          </Button>
        </div>
      </AppLayout>
    );
  }

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
            <Card 
              className={cn(
                "firebase-card flex-col relative overflow-hidden z-10",
                "rounded-none border-none lg:rounded-lg lg:border lg:border-solid lg:border-white/10",
                "flex-shrink-0 mb-4 bg-card/80 backdrop-blur-md",
                isDescriptionMinimized ? "max-h-[68px]" : "",
                priorityStyles.backgroundClass,
                priorityStyles.shadowClass
              )}
            >
              {task?.category && (
                <div className={cn(
                  `absolute right-4 z-0 pointer-events-none`,
                  isDescriptionMinimized ? "opacity-0 transform scale-90" : "opacity-100 transform scale-100",
                  "transition-all duration-800 ease-in-out",
                  task.subtasks && task.subtasks.length > 0 ? 'bottom-10' : 'bottom-4'
                )}>
                  {getCategoryBackgroundIcon(task.category)}
                </div>
              )}
              <CardHeader className={cn(
                "px-4",
                "!pt-3", isDescriptionMinimized ? "pb-2" : "pb-3",
                "lg:px-6",
                "lg:!pt-3", isDescriptionMinimized ? "lg:pb-2" : "lg:pb-3"
              )}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn(
                    "font-semibold",
                    isDescriptionMinimized ? "text-sm" : "text-xl",
                    "lg:text-xl"
                  )}>
                    {task?.emoji && <span className="mr-1.5 text-2xl task-emoji">{task.emoji}</span>}
                    {task?.title}
                  </CardTitle>
                  
                  {/* Deadline calendar badge */}
                  {deadlineDay && deadlineMonth && (
                    <div className="transition-all duration-500 ease-in-out">
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              <div className={`w-8 h-8 flex flex-col items-center justify-center gap-[6px] rounded-full border border-white/10 overflow-hidden shadow-md calendar-badge ${
                                task?.priority === 'high' ? 'bg-gradient-to-br from-red-600/90 to-rose-700/90' :
                                task?.priority === 'medium' ? 'bg-gradient-to-br from-amber-500/90 to-orange-600/90' :
                                task?.priority === 'low' ? 'bg-gradient-to-br from-blue-500/90 to-cyan-600/90' :
                                'bg-gradient-to-br from-slate-500/90 to-slate-600/90'
                              }`}>
                                <div className="text-[0.875rem] font-bold text-white leading-none">
                                  {deadlineDay}
                                </div>
                                <div className="!text-[0.7rem] font-medium uppercase tracking-tight text-white/80 mt-[-8px] leading-none">
                                  {deadlineMonth.substring(0, 3)}
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="bottom" 
                            align="end" 
                            sideOffset={5} 
                            alignOffset={5}
                            avoidCollisions
                            className="bg-popover/90 backdrop-blur-lg px-3 py-2 max-w-[200px] z-50 whitespace-normal break-words"
                          >
                            <p>{deadlineText}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </CardHeader>
              {task && (
                <CardContent className={cn(
                  "p-0 flex flex-col flex-grow min-h-0",
                  "transition-all duration-800 ease-in-out",
                  isDescriptionMinimized 
                    ? "opacity-0 max-h-0 transform translate-y-[-10px] overflow-hidden" 
                    : "opacity-100 transform translate-y-0"
                )}>
                  <div className="p-6 pt-0 flex flex-col flex-grow min-h-0 px-0 pb-0 lg:p-6 lg:pt-0">
                    <TaskInfoDisplay
                      task={task}
                      isInfoCollapsed={isInfoCollapsed}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-2 relative z-10">
                      {task.category && (
                        <Badge variant="outline" className="text-xs h-6 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white border-white/10 shadow-md">
                          {task.category}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-6 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white border-white/10 shadow-md flex items-center gap-1"
                        onClick={() => setIsEditDialogOpen(true)}
                      >
                        <Edit className="h-3 w-3" />
                        {t('common.edit')}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2.5 py-0.5 rounded-full bg-red-500/10 backdrop-blur-sm text-red-300 border-red-500/20 shadow-md flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('common.delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogPortal>
                          <AlertDialogOverlay className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                          <AlertDialogContent className="bg-card/90 backdrop-blur-md border-white/10 z-[90]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('taskDetail.deleteConfirmation.title')}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('taskDetail.deleteConfirmation.description')}
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
                    {totalSubtasks > 0 && (
                      <div className="flex items-center gap-2 mt-4 w-full">
                        <div className="flex items-center gap-1.5">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" 
                            className={`
                              ${task?.priority === 'high' ? 'text-red-400' : ''}
                              ${task?.priority === 'medium' ? 'text-amber-400' : ''}
                              ${task?.priority === 'low' ? 'text-cyan-400' : ''}
                              ${task?.priority !== 'high' && task?.priority !== 'medium' && task?.priority !== 'low' ? 'text-slate-400' : ''}
                            `}>
                              <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className={`text-xs flex-shrink-0 mr-2
                                ${task?.priority === 'high' ? 'text-red-400' : ''}
                                ${task?.priority === 'medium' ? 'text-amber-400' : ''}
                                ${task?.priority === 'low' ? 'text-cyan-400' : ''}
                                ${task?.priority !== 'high' && task?.priority !== 'medium' && task?.priority !== 'low' ? 'text-slate-400' : ''}
                              `}>
                              {completedSubtasks}/{totalSubtasks}
                            </span>
                          </div>
                          <div className="relative w-full h-3.5 bg-white/20 backdrop-blur-md rounded-full overflow-hidden flex-grow shadow-md">
                            <div
                              className={`h-full rounded-full transition-all duration-300
                                ${task?.priority === 'high' ? 'bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 shadow-[0_0_8px_2px_rgba(244,63,94,0.4)]' : ''}
                                ${task?.priority === 'medium' ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.4)]' : ''}
                                ${task?.priority === 'low' ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 shadow-[0_0_8px_2px_rgba(34,211,238,0.4)]' : ''}
                                ${task?.priority !== 'high' && task?.priority !== 'medium' && task?.priority !== 'low' ? 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-[0_0_8px_2px_rgba(100,116,139,0.3)]' : ''}
                              `}
                              style={{ width: `${progressValue}%` }}
                            />
                            {progressValue > 10 && (
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-white font-bold select-none">
                                {Math.round(progressValue)}%
                              </span>
                            )}
                          </div>
                          <span className="sr-only">
                            ({Math.round(progressValue)}%)
                          </span>
                        </div>
                      )}
                  </div>
                </CardContent>
              )}
            </Card>

            {task && (
              <Card 
                ref={subtaskCardRef}
                className={cn(
                  "firebase-card subtask-card-glow-target flex-col relative overflow-hidden z-10",
                  "rounded-none border-none lg:rounded-lg lg:border lg:border-solid lg:border-white/5 flex-grow min-h-0 h-full", 
                  "backdrop-blur-md bg-card/80",
                  "transition-all duration-800 ease-in-out",
                  priorityStyles.shadowClass
                )}
              >
                <CardHeader className="px-4 py-2 lg:px-4 lg:py-2 relative">
                  <h3 className="text-xs font-medium text-white/60 uppercase tracking-wider text-center">{t('common.subtasks')}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 absolute right-3 top-[-2px] rounded-full text-white/70 hover:text-white hover:bg-white/10 z-30 flex items-center justify-center"
                    onClick={() => setIsDescriptionMinimized(!isDescriptionMinimized)}
                    aria-label={isDescriptionMinimized ? t('taskDetail.expandDescription') : t('taskDetail.minimizeDescription')}
                  >
                    {isDescriptionMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-grow h-full overflow-hidden relative max-h-[calc(100%-25px)]">
                  {/* Scrollbare container met flex-grow voor de subtaken */}
                  <div className={cn(
                    // Base padding
                    "pl-4 pr-2 lg:pl-4 lg:pr-2 pt-1 pb-2",
                    // Scrollbare container die automatisch groeit maar krimpt bij overflow
                    "flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-neutral-200 dark:scrollbar-track-neutral-800 scrollbar-thumb-rounded max-h-[calc(100%-80px)]",
                    // Conditonele styling
                    task.subtasks.length === 0 && "flex items-center justify-center"
                  )}>
                    <AnimatePresence mode='wait'>
                      {task.subtasks.length > 0 ? (
                        <motion.div key="subtask-list" layout className="w-full">
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
                          className="text-muted-foreground text-sm text-center"
                        >
                          {t('taskDetail.noSubtasks')}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Knoppenbalk als aparte flex-item zodat deze onderaan blijft en niet scroll */}
                  <div className="flex-shrink-0 px-4 pt-2 pb-3 lg:px-6 lg:pt-3 lg:pb-3 border-t border-border bg-card/80 backdrop-blur-md">
                    <div className="flex items-center flex-wrap gap-3 justify-center mb-1">
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
                                    className="h-10 p-[1px] rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 relative transition-colors duration-200 mb-1"
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Draggable divider - only visible on desktop */}
          <div
            className={cn(
              "hidden lg:flex items-center justify-center w-px cursor-ew-resize bg-border hover:bg-primary/40 transition-all duration-300 relative z-30 mx-1 shrink-0 hover:shadow-[0_0_8px_rgba(var(--primary),.4)]",
              "group"
            )}
            onMouseDown={startResize}
          >
            <div 
              className={cn(
                "absolute w-4 h-8 rounded-full bg-primary/25 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300",
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
              "firebase-card chat-card-glow-target overflow-hidden flex flex-col flex-grow min-h-0",
              "lg:flex-[1_1_auto]",
              activeMobileView === 'details' ? 'hidden lg:flex' : 'flex w-full lg:w-auto',
              activeMobileView === 'chat' && 'h-full p-0',
              "lg:border lg:border-solid lg:border-white/10",
              priorityStyles.backgroundClass,
              priorityStyles.shadowClass
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

      {isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
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
    </AppLayout>
  );
}