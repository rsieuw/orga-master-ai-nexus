import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Trash2, Edit } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import TaskAIChat from "@/components/ai/TaskAIChat";
import { GradientLoader } from "@/components/ui/loader";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, updateTask, deleteTask } = useTask();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubtaskTitle, setSelectedSubtaskTitle] = useState<string | null>(null);

  const task = getTaskById(id || "");

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
    setIsLoading(true);
    try {
      await deleteTask(task.id);
      toast({
        title: "Taak verwijderd",
        description: "De taak is succesvol verwijderd",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout bij verwijderen",
        description: "De taak kon niet worden verwijderd",
      });
    }
  };

  const toggleSubtaskCompletion = async (subtaskId: string, completed: boolean) => {
    try {
      const updatedSubtasks = task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed } : st
      );

      await updateTask(task.id, { subtasks: updatedSubtasks });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout bij bijwerken",
        description: "De subtaak kon niet worden bijgewerkt",
      });
    }
  };

  const priorityColor = {
    high: "bg-priority-high",
    medium: "bg-priority-medium",
    low: "bg-priority-low",
  };

  const statusLabel: Record<string, string> = {
    todo: "Te doen",
    in_progress: "In behandeling",
    done: "Voltooid",
  };

  const priorityLabel: Record<string, string> = {
    high: "Hoog",
    medium: "Middel",
    low: "Laag",
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
          <Card className="firebase-card overflow-auto relative">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${priorityColor[task.priority]}`}></div>
                <CardTitle>{task.title}</CardTitle>
              </div>
            </CardHeader>

            <div className="absolute top-3 right-3 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigate(`/task/edit/${task.id}`)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Bewerk taak</span>
              </Button>
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
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <GradientLoader size="sm" className="mr-2" />
                      ) : null}
                      Verwijderen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{statusLabel[task.status]}</Badge>
                <Badge variant="outline">Prioriteit: {priorityLabel[task.priority]}</Badge>
                {task.deadline && (
                  <Badge variant="outline">
                    Deadline: {format(new Date(task.deadline), "d MMMM yyyy", { locale: nl })}
                  </Badge>
                )}
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-medium mb-2">Beschrijving</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.description || "Geen beschrijving"}
                </p>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="font-medium mb-2">Subtaken</h3>
                {task.subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {task.subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="flex items-center gap-2">
                        <span className="text-xs w-5 text-center text-muted-foreground">{index + 1}.</span>
                        <Checkbox
                          id={subtask.id}
                          checked={subtask.completed}
                          onCheckedChange={(checked) =>
                            toggleSubtaskCompletion(subtask.id, checked === true)
                          }
                        />
                        <label
                          onClick={() => setSelectedSubtaskTitle(subtask.title)}
                          className={`${
                            subtask.completed ? "line-through text-muted-foreground" : ""
                          } flex-1 cursor-pointer`}
                        >
                          {subtask.title}
                        </label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Geen subtaken</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="firebase-card overflow-hidden">
            <TaskAIChat
              task={task}
              selectedSubtaskTitle={selectedSubtaskTitle}
              onSubtaskHandled={() => setSelectedSubtaskTitle(null)}
            />
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}