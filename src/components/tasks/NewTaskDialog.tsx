import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { nl, enUS } from "date-fns/locale";
import { TaskPriority, TaskStatus, Task } from "@/types/task.ts";
import { TASK_CATEGORIES, TASK_CATEGORY_KEYS, TaskCategory } from "@/constants/categories.ts";
import { supabase } from "@/integrations/supabase/client.ts";
import { cn } from "@/lib/utils.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/useAuth.ts";

/**
 * Props for the NewTaskDialog component.
 *
 * @interface NewTaskDialogProps
 */
interface NewTaskDialogProps {
  /** Function to control the open/closed state of the dialog. */
  setOpen: (open: boolean) => void;
}

/**
 * NewTaskDialog component for creating new tasks.
 *
 * This component provides a form for users to input task details.
 * It includes functionality for:
 * - AI-powered generation of task title and description from an initial input.
 * - Manual input of title, description, priority, status, category, and deadline.
 * - Optional automatic generation of subtasks for the new task.
 * - Saving the new task to the database.
 * - User interface feedback via toasts.
 *
 * @param {NewTaskDialogProps} props - The props for the component.
 * @returns {JSX.Element} The rendered NewTaskDialog component.
 */
export default function NewTaskDialog({ setOpen }: NewTaskDialogProps) {
  const { addTask, expandTask } = useTask();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Date-fns locales mapping
  const dateLocale = i18n.language === 'nl' ? nl : enUS;

  // State specific to the new task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("low");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [category, setCategory] = useState<TaskCategory | undefined>(undefined);
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [initialInput, setInitialInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [generateSubtasks, setGenerateSubtasks] = useState(false);

  // New state for emoji and auto-categorization
  const [taskEmoji, setTaskEmoji] = useState<string>("");

  /**
   * Handles the AI generation of task details (title, description, category, emoji)
   * based on the initial user input.
   * It calls a Supabase Edge Function to perform the generation.
   * Updates the form fields with the generated details.
   * @async
   */
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
          body: { 
            input: initialInput,
            languagePreference: user?.language_preference || 'en' // Pass user language preference
          },
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
        
        // Set category if auto-categorization is enabled and category is available
        if (data.category) {
          setCategory(data.category as TaskCategory);
        }
        
        // Set emoji if available
        if (data.emoji) {
          setTaskEmoji(data.emoji);
        }
        
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

  /**
   * Handles the submission of the new task form.
   * Creates a new task with the provided details and optionally generates subtasks.
   * Navigates to the new task's page upon successful creation.
   * Displays toasts for feedback.
   * @async
   * @param {React.FormEvent} [e] - The form event, if submitted via a form element.
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    let newTaskForNavigation: Task | undefined = undefined;

    try {
      const deadlineISO = deadline ? deadline.toISOString() : undefined;
      const taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'subtasks' | 'aiSubtaskGenerationCount' | 'isNew'> & { category?: TaskCategory, emoji?: string } = {
        title,
        description,
        priority,
        status,
        category,
        deadline: deadlineISO as string,
        emoji: taskEmoji, // Include emoji in task data
      };

      const newTask = await addTask(taskData);
      newTaskForNavigation = newTask; // Store for navigation outside the specific if/else

      if (newTask && newTask.id && generateSubtasks) {
        try {
          await expandTask(newTask.id, newTask);
          toast({
            title: t('newTaskDialog.toast.subtasksGeneratedTitle'),
            description: t('newTaskDialog.toast.subtasksGeneratedDescription'),
          });
        } catch (expandError) {
          console.error("Error generating subtasks:", expandError);
          toast({
            variant: "destructive",
            title: t('common.error'),
            description: t('newTaskDialog.toast.subtaskGenerationFailedDescription'),
          });
          // Reset newTaskForNavigation if subtask generation fails and we don't want to navigate
          // Or, decide if navigation should still occur.
          // For now, we'll assume navigation should still happen if the main task was created.
        }
      } else if (newTask) {
         toast({
           title: t('newTaskDialog.toast.taskCreatedTitle'),
           description: t('newTaskDialog.toast.taskCreatedDescription'),
         });
      }

      setOpen(false); // Close the dialog first

      // Navigate if a new task was successfully created
      if (newTaskForNavigation && newTaskForNavigation.id) {
        navigate(`/task/${newTaskForNavigation.id}`);
      }

    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: t('newTaskDialog.toast.createTaskFailedDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the Ctrl+Enter keydown event in input fields to submit the form
   * for creating a task and generating subtasks.
   * If the title is empty, a toast notification is shown.
   * @async
   * @param {React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>} event - The keyboard event.
   */
  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (!title.trim()) {
        toast({
          variant: "destructive",
          title: t('newTaskDialog.toast.missingTitleTitle'),
          description: t('newTaskDialog.toast.missingTitleDescription'),
        });
        return;
      }
      setGenerateSubtasks(true);
      await handleSubmit();
    }
  };

  /**
   * Finds the appropriate translation key for a given category.
   * @param {string} category - The category string.
   * @returns {string} The translation key or the original category if not found.
   */
  const getCategoryTranslationKey = (category: string) => {
    const index = TASK_CATEGORIES.findIndex(cat => cat === category);
    return index !== -1 ? TASK_CATEGORY_KEYS[index] : category;
  };

  /**
   * Retrieves the translated category name.
   * @param {string} category - The category string.
   * @returns {string} The translated category name.
   */
  const getTranslatedCategory = (category: string) => {
    const translationKey = getCategoryTranslationKey(category);
    return t(translationKey);
  };

  // Form JSX (without Card, CardHeader etc.)
  return (
    <form onSubmit={handleSubmit} id="new-task-form">
      {/* Show initial input only if details are not visible */}
      {!detailsVisible && (
        <>
          <Textarea
            id="initial-input"
            value={initialInput}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialInput(e.target.value)}
            placeholder={t('newTaskDialog.initialInputPlaceholderNew')}
            rows={6}
            className="animated-border-textarea mb-6"
            onKeyDown={handleKeyDown}
          />
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="w-full h-12 order-first sm:order-none"
            >
              {t('common.cancel')}
            </Button>
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
        <div className="mt-2 space-y-4 max-h-[60vh] overflow-y-auto lg:max-h-none lg:overflow-y-visible px-2 md:px-0 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded">
          <div className="space-y-2">
            <Label htmlFor="title">{t('common.title')}</Label>
            <div className="relative">
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder={t('editTaskDialog.titlePlaceholder')}
              required
              onKeyDown={handleKeyDown}
                className={taskEmoji ? "pl-10" : ""}
              />
              {taskEmoji && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                  <span className="text-xl" style={{ marginTop: "-7px" }}>{taskEmoji}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('common.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder={t('editTaskDialog.descriptionPlaceholder')}
              rows={4}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">{t('common.priority')}</Label>
              <Select
                value={priority}
                onValueChange={(value: string) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="priority" className="h-10">
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
                <SelectTrigger id="status" className="h-10">
                  <SelectValue placeholder={t('editTaskDialog.selectStatusPlaceholder')} />
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
            <div className="flex items-center justify-between">
              <Label htmlFor="category">{t('common.category')}</Label>
              {category && (
                <span className="text-xs text-muted-foreground flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('newTaskDialog.aiSuggested')}
                </span>
              )}
            </div>
            <Select
              value={category}
              onValueChange={(value: string) => setCategory(value as TaskCategory)}
            >
              <SelectTrigger id="category" className="h-10">
                <SelectValue placeholder={t('newTaskDialog.selectCategoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getTranslatedCategory(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">{t('common.deadline')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-10",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP", { locale: dateLocale }) : <span>{t('editTaskDialog.chooseDate')}</span>}
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
                  locale={dateLocale}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Checkboxes moved to the bottom */}
          {/* Generate subtasks checkbox */}
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
          
          {/* Footer buttons side by side */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
             <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                className="w-full h-16 sm:h-12 order-first sm:order-none"
             >
               {t('common.cancel')}
             </Button>
             <Button 
               type="submit" 
               disabled={isLoading || isGeneratingTask || (detailsVisible && !title.trim())}
               className="w-full h-16 sm:h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
             >
               {isLoading ? <span className="animate-pulse">{t('newTaskDialog.creatingButton')}</span> : t('newTaskDialog.createTaskButton')}
             </Button>
          </div>
        </div>
      )}
    </form>
  );
} 