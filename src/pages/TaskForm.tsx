import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Task, TaskPriority, TaskStatus } from "@/types/task";

export default function TaskForm() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, updateTask, suggestPriority } = useTask();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [deadline, setDeadline] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    const task = getTaskById(id);
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setPriority(task.priority);
      setStatus(task.status);
      setDeadline(format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm"));
    } else {
      toast({ variant: "destructive", title: "Fout", description: "Taak niet gevonden" });
      navigate("/");
    }
  }, [id, getTaskById, navigate, toast]);

  const handleGetAIPrioritySuggestion = async () => {
    if (!title) {
      toast({
        variant: "destructive",
        title: "Titel ontbreekt",
        description: "Vul eerst een titel in voor een AI suggestie",
      });
      return;
    }

    setIsAiSuggesting(true);
    try {
      const suggestedPriority = await suggestPriority(title, description);
      setPriority(suggestedPriority);
      toast({
        title: "AI Suggestie",
        description: `De AI stelt voor om prioriteit "${
          suggestedPriority === "high" ? "Hoog" : 
          suggestedPriority === "medium" ? "Middel" : "Laag"
        }" toe te kennen.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Suggestie mislukt",
        description: "Kon geen prioriteit suggestie genereren",
      });
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast({ variant: "destructive", title: "Fout", description: "Ongeldig taak ID" });
      return;
    }
    setIsLoading(true);

    try {
      const taskData = {
        title,
        description,
        priority,
        status,
        deadline: new Date(deadline).toISOString(),
      };

      await updateTask(id, taskData);
      toast({
        title: "Taak bijgewerkt",
        description: "De taak is succesvol bijgewerkt",
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "De taak kon niet worden bijgewerkt",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Taak bewerken</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Taak titel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf de taak..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">Prioriteit</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGetAIPrioritySuggestion}
                    disabled={isAiSuggesting}
                    className="h-8"
                  >
                    <Sparkles className="mr-2 h-3 w-3" />
                    AI Suggestie
                  </Button>
                </div>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as TaskPriority)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Selecteer prioriteit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Hoog</SelectItem>
                    <SelectItem value="medium">Middel</SelectItem>
                    <SelectItem value="low">Laag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as TaskStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Te doen</SelectItem>
                    <SelectItem value="in_progress">In behandeling</SelectItem>
                    <SelectItem value="done">Voltooid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Bijwerken..." : "Taak bijwerken"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AppLayout>
  );
}
