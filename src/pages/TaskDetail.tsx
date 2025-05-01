
import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Trash, Edit } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import TaskAIChat from "@/components/ai/TaskAIChat";
import { GradientLoader } from "@/components/ui/loader";
import { useState } from "react";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, updateTask, deleteTask } = useTask();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const task = getTaskById(id || "");

  if (!task) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <h1 className="text-2xl font-bold mb-2">Taak niet gevonden</h1>
          <Button onClick={() => navigate(-1)} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubtaskCompletion = async (subtaskId: string, completed: boolean) => {
    try {
      const updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed } : st
      );
      
      await updateTask(task.id, { subtasks: updatedSubtasks });
      
      toast({
        title: completed ? "Subtaak voltooid" : "Subtaak heropend",
        description: `De subtaak is gemarkeerd als ${completed ? 'voltooid' : 'te doen'}`,
      });
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
      <div className="mb-4 flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)} className="firebase-btn firebase-btn-secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(`/task/edit/${task.id}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash className="h-4 w-4" />
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-12rem)]">
        {/* Left side - Task details */}
        <Card className="firebase-card overflow-auto">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${priorityColor[task.priority]}`}></div>
              <CardTitle>{task.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{statusLabel[task.status]}</Badge>
              <Badge variant="outline">Prioriteit: {priorityLabel[task.priority]}</Badge>
              <Badge variant="outline">
                Deadline: {format(new Date(task.deadline), "d MMMM yyyy", { locale: nl })}
              </Badge>
            </div>

            <div>
              <h3 className="font-medium mb-2">Beschrijving</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {task.description || "Geen beschrijving"}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Subtaken</h3>
              {task.subtasks.length > 0 ? (
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox 
                        id={subtask.id}
                        checked={subtask.completed}
                        onCheckedChange={(checked) => 
                          toggleSubtaskCompletion(subtask.id, checked === true)
                        }
                      />
                      <label 
                        htmlFor={subtask.id}
                        className={`${
                          subtask.completed ? "line-through text-muted-foreground" : ""
                        }`}
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

        {/* Right side - AI Chat */}
        <Card className="firebase-card overflow-hidden">
          <TaskAIChat task={task} />
        </Card>
      </div>
    </AppLayout>
  );
}
