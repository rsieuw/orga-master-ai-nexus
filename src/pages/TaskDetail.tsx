import React from 'react';
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Trash2, Edit, PlusCircle, Sparkles } from "lucide-react";
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
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import TaskAIChat from "@/components/ai/TaskAIChat.tsx";
import { GradientLoader } from "@/components/ui/loader.tsx";
import EditTaskDialog from "@/components/tasks/EditTaskDialog.tsx";
import { cn } from "@/lib/utils.ts";
import { Input } from "@/components/ui/input.tsx";
import { Task, SubTask, TaskPriority } from "@/types/task.ts";
import { Progress } from "@/components/ui/progress.tsx";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, deleteTask, isLoading: tasksLoading, updateSubtask, addSubtask, expandTask, deleteSubtask } = useTask();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubtaskTitle, setSelectedSubtaskTitle] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddSubtaskForm, setShowAddSubtaskForm] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  const task: Task | undefined = getTaskById(id || "");

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

  const priorityColor: Record<TaskPriority, string> = {
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
    none: "bg-green-500",
  };

  const statusLabel: Record<string, string> = {
    todo: "Te doen",
    in_progress: "In behandeling",
    done: "Voltooid",
  };

  const statusColor: Record<string, string> = {
    todo: "border-gray-500 text-gray-500 dark:text-gray-400",
    in_progress: "border-blue-500 text-blue-500 dark:text-blue-400",
    done: "border-green-500 text-green-500 dark:text-green-400",
  };

  const priorityLabel: Record<TaskPriority, string> = {
    high: "Hoog",
    medium: "Middel",
    low: "Laag",
    none: "Geen",
  };

  const priorityBadgeColor: Record<TaskPriority, string> = {
    high: "border-red-500 text-red-500 dark:text-red-400",
    medium: "border-orange-500 text-orange-500 dark:text-orange-400",
    low: "border-blue-500 text-blue-500 dark:text-blue-400",
    none: "border-green-500 text-green-500 dark:text-green-400",
  };

  let deadlineText = "Geen deadline";
  let deadlineColor = "border-gray-500 text-gray-500 dark:text-gray-400";
  let isOverdue = false;

  if (task.deadline) {
    try {
      const parsedDeadline = parseISO(task.deadline);
      const now = new Date();
      isOverdue = parsedDeadline < now && task.status !== 'done';
      deadlineText = format(parsedDeadline, "PPP", { locale: nl });
      if (isOverdue) {
        deadlineText += " (Verlopen)";
        deadlineColor = "border-red-500 text-red-500 dark:text-red-400";
      } else if (task.status === 'done') {
        deadlineColor = "border-green-500 text-green-500 dark:text-green-400";
      } else {
        deadlineColor = "border-blue-500 text-blue-500 dark:text-blue-400";
      }
    } catch (e) {
      console.error("Invalid date format for deadline:", task.deadline);
      deadlineText = "Ongeldige datum";
      deadlineColor = "border-red-500 text-red-500 dark:text-red-400";
    }
  }

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
          <Card className="firebase-card flex flex-col relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${task && priorityColor[task.priority]}`}></div>
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
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={cn("border", statusColor[task.status])}>{statusLabel[task.status]}</Badge>
                    {task.priority !== 'none' && (
                      <Badge variant="outline" className={cn("border", priorityBadgeColor[task.priority])}>Prioriteit: {priorityLabel[task.priority]}</Badge>
                    )}
                    {task.deadline && (
                      <Badge variant="outline" className={cn("border", deadlineColor)}>
                        Deadline: {deadlineText}
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
                  <div className="flex justify-between items-center mb-2">
                    {/* Container voor heading en voortgang */}
                    <div className="flex items-center gap-3"> 
                      <h3 className="font-medium">Subtaken</h3>
                      {totalSubtasks > 0 && (
                        <div className="flex items-center gap-2">
                           <span className="text-xs text-muted-foreground">
                               {completedSubtasks}/{totalSubtasks}
                           </span>
                           <Progress value={progressValue} className="h-1.5 w-20" />
                           <span className="text-xs font-medium text-muted-foreground/90">
                             ({Math.round(progressValue)}%)
                           </span>
                        </div>
                       )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateSubtasks}
                      disabled={isGeneratingSubtasks || isAddingSubtask}
                      className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <Sparkles className={cn("mr-1 h-3 w-3", isGeneratingSubtasks && "animate-spin")} />
                      {isGeneratingSubtasks ? "Genereren..." : "Genereer AI Subtaken"}
                    </Button>
                  </div>
                </div>

                <div className="flex-grow overflow-y-auto min-h-0 space-y-1.5 
                               scrollbar-thin scrollbar-thumb-muted-foreground 
                               scrollbar-track-transparent scrollbar-thumb-rounded">
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
                  <div className="mt-2 px-1">
                    {showAddSubtaskForm ? (
                      <form onSubmit={handleAddSubtask} className="flex items-center gap-3">
                        <Input
                          type="text"
                          placeholder="Nieuwe subtaak titel"
                          value={newSubtaskTitle}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtaskTitle(e.target.value)}
                          className="h-8 flex-grow"
                          disabled={isAddingSubtask}
                        />
                        <Button type="submit" size="sm" className="h-8 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900" disabled={isAddingSubtask || !newSubtaskTitle.trim()}>
                          {isAddingSubtask ? <GradientLoader size="sm" /> : "Opslaan"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setShowAddSubtaskForm(false)} disabled={isAddingSubtask}>
                          Annuleren
                        </Button>
                      </form>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setShowAddSubtaskForm(true)} className="h-8">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Subtaak toevoegen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="firebase-card overflow-hidden flex flex-col">
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
    </AppLayout>
  );
}