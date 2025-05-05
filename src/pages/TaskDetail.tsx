import React, { useState, useEffect, useRef } from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Trash2, Edit, PlusCircle, Sparkles, X, Save } from "lucide-react";
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
} from "@/components/ui/alert-dialog.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Progress } from "@/components/ui/progress.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, deleteTask, isLoading: tasksLoading, updateSubtask, addSubtask, expandTask, deleteSubtask, toggleTaskCompletion, updateTask } = useTask();
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

  const task: Task | undefined = getTaskById(id || "");

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

  // Bereken subtaak voortgang
  const totalSubtasks = task?.subtasks.length ?? 0;
  const completedSubtasks = task?.subtasks.filter(st => st.completed).length ?? 0;
  const progressValue = totalSubtasks > 0
    ? (completedSubtasks / totalSubtasks) * 100
    : 0;

  if (tasksLoading) {
    return null;
  }

  if (!task) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold mb-2">Taak niet gevonden</h1>
          <Button onClick={() => navigate(-1)} className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
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
        title: "Taak verwijderd",
        description: `"${task.title}" is verwijderd.`,
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Verwijderen mislukt",
        description: "Kon de taak niet verwijderen.",
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
      toast({ variant: "destructive", title: "Fout", description: "Kon subtaak status niet bijwerken." });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;

    setIsAddingSubtask(true);
    try {
      const titleToAdd = newSubtaskTitle.trim();
      await addSubtask(task.id, titleToAdd);
      toast({ title: "Subtaak toegevoegd", description: `"${titleToAdd}" is toegevoegd.` });
      setNewSubtaskTitle("");
      setShowAddSubtaskForm(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Toevoegen mislukt", description: "Kon de subtaak niet toevoegen." });
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

  // Handler voor prioriteit wijziging
  const handlePriorityChange = (newPriority: string) => {
    if (!newPriority || !task || newPriority === task.priority) return;
    // Roep updateTask aan om alleen prioriteit te wijzigen
    updateTask(task.id, { priority: newPriority as TaskPriority });
  };

  const priorityLabel: Record<TaskPriority, string> = {
    high: "Hoog",
    medium: "Middel",
    low: "Laag",
    none: "Geen",
  };

  const priorityBadgeColor: Record<TaskPriority, string> = {
    high: "border-red-400 text-red-400",
    medium: "border-orange-400 text-orange-400",
    low: "border-blue-400 text-blue-400",
    none: "border-green-400 text-green-400",
  };

  let deadlineText = "Geen deadline";
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
      deadlineText = "Ongeldige datum";
      deadlineColor = "border-red-400 text-red-400";
    }
  }

  // Herstel statusLabel en statusColor
  const statusLabel: Record<string, string> = {
    todo: "Te doen",
    in_progress: "In behandeling",
    done: "Voltooid",
  };

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
          <span className="sr-only">Terug</span>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:h-[calc(100vh-12rem)] relative z-0">
          <Card className={cn(
            "firebase-card flex-col relative overflow-hidden z-10",
            activeMobileView === 'chat' ? 'hidden lg:flex' : 'flex' 
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-semibold">{task?.title}</CardTitle>
              </div>
            </CardHeader>

            <div className="absolute top-3 right-3 flex gap-1">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Bewerk taak</span>
                  </Button>
                </DialogTrigger>
                <DialogPortal>
                  {isEditDialogOpen && (
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" aria-hidden="true" />
                  )}
                  <DialogContent className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border bg-card p-6 shadow-lg duration-200 sm:max-w-[600px] sm:rounded-lg z-50">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Taak Bewerken</DialogTitle>
                      <DialogDescription>
                        Pas de details van je taak aan.
                      </DialogDescription>
                    </DialogHeader>
                    <EditTaskDialog task={task} setOpen={setIsEditDialogOpen} />
                  </DialogContent>
                </DialogPortal>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Verwijder taak</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card/90 backdrop-blur-lg border border-white/5">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Taak verwijderen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Weet je zeker dat je deze taak wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-secondary/80 border-white/10">Annuleren</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <GradientLoader size="sm" className="mr-2" />
                      ) : null}
                      Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {task && (
              <CardContent className="flex flex-col flex-grow min-h-0">
                <div className="flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost"
                          className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/30", statusColor[task.status])}
                        >
                          {statusLabel[task.status]}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg">
                        <DropdownMenuItem onSelect={() => handleStatusChange('todo')}>
                          Te doen
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusChange('in_progress')}>
                          In behandeling
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleStatusChange('done')}>
                          Voltooid
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Dropdown voor Prioriteit (alleen tonen als niet 'none') */}
                    {task.priority !== 'none' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost"
                            className={cn("h-6 px-2 text-xs font-normal rounded-md bg-muted/30", priorityBadgeColor[task.priority])}
                          >
                            <span className="hidden sm:inline">Prioriteit:&nbsp;</span> 
                            {priorityLabel[task.priority]}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-popover/90 backdrop-blur-lg">
                          <DropdownMenuItem onSelect={() => handlePriorityChange('high')}>
                            Hoog
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePriorityChange('medium')}>
                            Middel
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handlePriorityChange('low')}>
                            Laag
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {task.deadline && (
                      <Badge 
                        variant="secondary"
                        className={cn("h-6 px-2 text-xs font-normal border-none bg-muted/30", deadlineColor)}
                      >
                        <span className="hidden sm:inline">Deadline:&nbsp;</span> 
                        {deadlineText}
                        {isOverdue && <span className="hidden sm:inline">&nbsp;(Verlopen)</span>}
                      </Badge>
                    )}
                  </div>
                  <div className="mb-4"></div>
                  <div>
                    <h3 className="font-medium mb-2">Beschrijving</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {task.description || "Geen beschrijving"}
                    </p>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">Subtaken</h3>
                      {totalSubtasks > 0 && (
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-muted-foreground">
                               {completedSubtasks}/{totalSubtasks}
                           </span>
                           <Progress value={progressValue} className="h-1.5 w-20 lg:w-40" />
                           <span className="text-xs font-medium text-muted-foreground/90">
                             ({Math.round(progressValue)}%)
                           </span>
                        </div>
                       )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Subtasks List (NO desktop buttons/form here anymore) */}
                <div className="flex-grow overflow-y-auto min-h-0 space-y-1.5 
                               scrollbar-thin scrollbar-thumb-muted-foreground 
                               scrollbar-track-transparent scrollbar-thumb-rounded pb-2">
                  {task.subtasks.length > 0 ? (
                    <div className="space-y-1.5">
                      {task.subtasks.map((subtask: SubTask, index: number) => (
                        <div key={subtask.id} className={cn(
                          "group flex items-start justify-between space-x-3 rounded-md py-1.5 hover:bg-muted/50", 
                          subtask.completed && "opacity-50"
                        )}>
                          <div className="flex items-start space-x-2 flex-grow">
                            <span className="font-normal text-muted-foreground/70 w-5 text-right flex-shrink-0 text-xs pt-[3px]">{`${index + 1}.`}</span>
                            <Checkbox
                              id={`subtask-${subtask.id}`}
                              checked={subtask.completed}
                              onCheckedChange={(checked: boolean | string | undefined) => handleSubtaskToggle(subtask.id, !!checked)}
                              className={cn(subtask.completed ? "border-primary" : "", "mt-[3px]")}
                            />
                            <label
                              onClick={() => setSelectedSubtaskTitle(subtask.title)}
                              className={cn(
                                "text-sm font-normal leading-normal cursor-pointer hover:text-primary transition-colors", 
                                subtask.completed && "line-through text-muted-foreground hover:text-muted-foreground/80"
                              )}
                            >
                              {subtask.title}
                            </label>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                                aria-label={`Verwijder subtaak ${subtask.title}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card/90 backdrop-blur-lg border border-white/5">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Subtaak verwijderen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Weet je zeker dat je de subtaak "{subtask.title}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-secondary/80 border-white/10">Annuleren</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSubtask(task.id, subtask.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Verwijderen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Geen subtaken</p>
                  )}
                </div>

                {/* Desktop Buttons & Add Form - MOVED OUTSIDE SCROLL & PINNED BOTTOM */}
                <div className="hidden lg:flex lg:items-center lg:gap-2 lg:px-1 border-t border-border pt-3 mt-auto">
                  {showAddSubtaskForm ? (
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-3 flex-grow">
                      <Input
                        type="text"
                        placeholder="Nieuwe subtaak titel"
                        value={newSubtaskTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtaskTitle(e.target.value)}
                        className="h-10 flex-grow"
                        disabled={isAddingSubtask}
                      />
                      {/* Desktop Save Button - Icon */}
                      <Button 
                        type="submit" 
                        size="icon"
                        className="h-10 w-10 p-2.5 rounded-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
                        disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                        aria-label="Subtaak opslaan"
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
                        aria-label="Annuleren"
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
                         Subtaak toevoegen
                      </Button>
                      {/* Desktop Generate Subtasks Button with Confirmation */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            disabled={isGeneratingSubtasks || isAddingSubtask}
                            className="h-10 p-[1px] rounded-md bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 relative transition-colors duration-200"
                          >
                            <div className="bg-card h-full w-full rounded-[5px] flex items-center justify-center px-4">
                              <span className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                <Sparkles className={cn("mr-1 h-4 w-4 text-blue-500", isGeneratingSubtasks && "animate-spin")} />
                                Genereer Subtaken
                              </span>
                            </div>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card/90 backdrop-blur-lg border border-white/5">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Subtaken Genereren (AI)?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Wilt u de AI assistent vragen om relevante subtaken voor "{task.title}" voor te stellen op basis van de beschrijving?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary/80 border-white/10">Annuleren</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleGenerateSubtasks}
                              className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
                              disabled={isGeneratingSubtasks}
                            >
                              {isGeneratingSubtasks ? <GradientLoader size="sm" className="mr-2" /> : null}
                              Ja, genereer subtaken
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
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

      {isEditDialogOpen && (
        <EditTaskDialog task={task} setOpen={setIsEditDialogOpen} />
      )}

      {/* Mobile Add Subtask Form Panel */}
      {showAddSubtaskForm && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[60] p-4 bg-card border-t border-border shadow-lg">
          <form onSubmit={handleAddSubtask} className="flex items-center gap-3">
            {/* Container for Input and Close Button */}
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Nieuwe subtaak titel..."
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
                aria-label="Annuleren"
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
              aria-label="Subtaak opslaan"
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
        <AlertDialog>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default"
                  size="icon" 
                  className="rounded-full h-12 w-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white shadow-lg"
                  disabled={isGeneratingSubtasks || isAddingSubtask}
                  aria-label="Genereer subtaken"
                >
                  <Sparkles className={cn("h-6 w-6", isGeneratingSubtasks && "animate-spin")} />
                </Button>
              </AlertDialogTrigger>
              <TooltipContent side="top" className="bg-popover/90 backdrop-blur-lg">
                <p>Genereer subtaken (AI)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialogContent className="bg-card/90 backdrop-blur-lg border border-white/5">
            <AlertDialogHeader>
              <AlertDialogTitle>Subtaken Genereren (AI)?</AlertDialogTitle>
              <AlertDialogDescription>
                Wilt u de AI assistent vragen om relevante subtaken voor "{task.title}" voor te stellen op basis van de beschrijving?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-secondary/80 border-white/10">Annuleren</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleGenerateSubtasks}
                className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
                disabled={isGeneratingSubtasks}
              >
                {isGeneratingSubtasks ? <GradientLoader size="sm" className="mr-2" /> : null}
                Ja, genereer subtaken
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add button (PlusCircle) with Tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline"
                size="icon" 
                className="rounded-full h-12 w-12 bg-secondary/80 backdrop-blur-sm border-white/10 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-lg"
                onClick={() => setShowAddSubtaskForm(true)}
                disabled={isAddingSubtask || isGeneratingSubtasks}
                aria-label="Subtaak toevoegen"
              >
                <PlusCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-popover/90 backdrop-blur-lg">
              <p>Subtaak toevoegen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </AppLayout>
  );
}