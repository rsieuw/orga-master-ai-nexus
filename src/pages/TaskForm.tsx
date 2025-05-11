import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import AppLayout from "@/components/layout/AppLayout.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { format } from "date-fns";
import { TaskPriority, TaskStatus } from "@/types/task.ts";
import { useTranslation } from 'react-i18next';

export default function TaskForm() {
  const { id } = useParams<{ id: string }>();
  const { getTaskById, updateTask } = useTask();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [deadline, setDeadline] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [isLoading, setIsLoading] = useState(false);

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
      if (task.deadline) {
        setDeadline(format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm"));
      } else {
        setDeadline(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      }
    } else {
      toast({ 
        variant: "destructive", 
        title: t('taskForm.toast.taskNotFound.title'), 
        description: t('taskForm.toast.taskNotFound.description') 
      });
      navigate("/");
    }
  }, [id, getTaskById, navigate, toast, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      toast({ 
        variant: "destructive", 
        title: t('taskForm.toast.invalidTaskId.title'), 
        description: t('taskForm.toast.invalidTaskId.description') 
      });
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
        title: t('taskForm.toast.taskUpdated.title'),
        description: t('taskForm.toast.taskUpdated.description'),
      });
      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('taskForm.toast.updateFailed.title'),
        description: t('taskForm.toast.updateFailed.description'),
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
          {t('taskForm.backButton')}
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">{t('taskForm.title')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t('taskForm.labels.title')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('taskForm.placeholders.title')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('taskForm.labels.description')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('taskForm.placeholders.description')}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="priority">{t('taskForm.labels.priority')}</Label>
                </div>
                <Select
                  value={priority}
                  onValueChange={(value) => setPriority(value as TaskPriority)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder={t('taskForm.placeholders.selectPriority')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{t('common.high')}</SelectItem>
                    <SelectItem value="medium">{t('common.medium')}</SelectItem>
                    <SelectItem value="low">{t('common.low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('taskForm.labels.status')}</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as TaskStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('taskForm.placeholders.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{t('common.todo')}</SelectItem>
                    <SelectItem value="in_progress">{t('common.in_progress')}</SelectItem>
                    <SelectItem value="done">{t('common.done')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">{t('taskForm.labels.deadline')}</Label>
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
              {isLoading ? t('taskForm.buttons.updating') : t('taskForm.buttons.updateTask')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AppLayout>
  );
}
