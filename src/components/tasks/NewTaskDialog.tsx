import React, { useState } from "react";
// import { useNavigate } from "react-router-dom"; // Removed unused import
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Sparkles, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { TaskPriority, TaskStatus, Task } from "@/types/task.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { cn } from "@/lib/utils.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { useTranslation } from 'react-i18next';

interface NewTaskDialogProps {
  setOpen: (open: boolean) => void;
}

export default function NewTaskDialog({ setOpen }: NewTaskDialogProps) {
  const { createTask } = useTask();
  // const navigate = useNavigate(); // Removed unused variable
  const { toast } = useToast();
  const { t } = useTranslation();

  // State specifiek voor het *nieuwe* taak formulier
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [initialInput, setInitialInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [generateSubtasks, setGenerateSubtasks] = useState(false);

  // Functie voor AI generatie - roept nu de Edge Function aan
  const handleGenerateTaskDetails = async () => {
    if (!initialInput) {
      toast({
        variant: "destructive",
        title: t('newTaskDialog.toast.missingInputTitle'),
        description: t('newTaskDialog.toast.missingInputDescription'),
      });
      return;
    }
    setIsGeneratingTask(true);
    setDetailsVisible(false);

    try {
      const { data, error } = await supabase.functions.invoke(
        'generate-task-details',
        {
          body: { input: initialInput },
        }
      );

      if (error) {
        toast({
          variant: "destructive",
          title: t('newTaskDialog.toast.generationFailedTitle'),
          description: error instanceof Error ? error.message : t('newTaskDialog.toast.generationFailedDescriptionDefault'),
        });
      }

      if (data && data.title && data.description) {
        setTitle(data.title);
        setDescription(data.description);
        toast({
          title: t('newTaskDialog.toast.detailsGeneratedTitle'),
          description: t('newTaskDialog.toast.detailsGeneratedDescription'),
        });
        setDetailsVisible(true);
      } else {
        throw new Error(t('newTaskDialog.errors.unexpectedAIResponse'));
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('newTaskDialog.toast.generationFailedDescriptionDefault');
      toast({
        variant: "destructive",
        title: t('newTaskDialog.toast.generationFailedTitle'),
        description: message,
      });
    } finally {
      setIsGeneratingTask(false);
    }
  };

  // Aangepaste submit handler voor *alleen* aanmaken
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare the data specifically for the createTask function
      // It expects Omit<Task, 'id' | 'userId' | 'createdAt' | 'subtasks'>
      // where deadline should be string | null (or match the DB type after generation)
      const deadlineISO = deadline ? deadline.toISOString() : null;
      
      // Type assertion to ensure compatibility with createTask expectation
      const taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'subtasks'> = {
        title,
        description,
        priority,
        status,
        deadline: deadlineISO as string, // Assert as string, Supabase handles null ok
      };

      await createTask(taskData);
      toast({
        title: t('newTaskDialog.toast.taskCreatedTitle'),
        description: t('newTaskDialog.toast.taskCreatedDescription'),
      });
      setOpen(false); // Sluit de dialog na succes
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('newTaskDialog.toast.createTaskFailedDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // JSX van het formulier (zonder Card, CardHeader etc.)
  return (
    <form onSubmit={handleSubmit} id="new-task-form">
      {/* Show initial input only if details are not visible */}
      {!detailsVisible && (
        <>
      <Textarea
        id="initial-input"
        value={initialInput}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialInput(e.target.value)}
        placeholder={t('newTaskDialog.initialInputPlaceholder')}
        rows={4}
        className="animated-border-textarea"
      />
      <div className="mt-4">
        <Button 
          type="button"
          onClick={handleGenerateTaskDetails}
          disabled={isGeneratingTask || !initialInput}
          className="w-full h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGeneratingTask ? t('newTaskDialog.generatingButton') : t('newTaskDialog.generateDetailsButton')}
        </Button>
      </div>
        </>
      )}

      {/* Show task details form only if details are visible */}
      {detailsVisible && (
        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto lg:max-h-none lg:overflow-y-visible px-2 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded">
          <div className="space-y-2">
            <Label htmlFor="title">{t('common.title')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder={t('editTaskDialog.titlePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder={t('editTaskDialog.descriptionPlaceholder')}
              rows={4}
            />
          </div>
          
          {/* Add subtask generation checkbox here */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="generate-subtasks" 
              checked={generateSubtasks} 
              onCheckedChange={(checked: boolean | 'indeterminate') => setGenerateSubtasks(Boolean(checked))}
            />
            <Label
              htmlFor="generate-subtasks"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('newTaskDialog.generateSubtasksLabel')}
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">{t('common.priority')}</Label>
              <Select
                value={priority}
                onValueChange={(value: string) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder={t('editTaskDialog.selectPriorityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">{t('common.high')}</SelectItem>
                  <SelectItem value="medium">{t('common.medium')}</SelectItem>
                  <SelectItem value="low">{t('common.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t('common.status')}</Label>
              <Select
                value={status}
                onValueChange={(value: string) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('editTaskDialog.selectStatusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">{t('common.todo')}</SelectItem>
                  <SelectItem value="in_progress">{t('common.inProgress')}</SelectItem>
                  <SelectItem value="done">{t('common.done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">{t('common.deadline')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP", { locale: nl }) : <span>{t('editTaskDialog.chooseDate')}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card/70 backdrop-blur-md border border-white/10">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  modifiersClassNames={{
                    today: 'bg-primary text-primary-foreground rounded-md font-bold',
                    outside: 'text-muted-foreground opacity-50',
                  }}
                  locale={nl}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Footer knop hier binnen het formulier */}
          <div className="flex justify-end pt-4">
             <Button 
               type="submit" 
               disabled={isLoading || isGeneratingTask || (detailsVisible && !title.trim())}
               className="w-full h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
             >
               {isLoading ? <span className="animate-pulse">{t('newTaskDialog.creatingButton')}</span> : t('newTaskDialog.createTaskButton')}
             </Button>
          </div>
        </div>
      )}
      
      <div className="mt-6 space-y-3">
        <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)} 
            className="w-full h-10"
        >
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
} 