import { useState } from "react";
import { useTask } from "@/contexts/TaskContext.hooks.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { CalendarIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Task, TaskPriority, TaskStatus } from "@/types/task.ts";
import { TASK_CATEGORIES, TaskCategory } from "@/constants/categories.ts";
import { cn } from "@/lib/utils.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { GradientLoader } from "@/components/ui/loader.tsx";
import { useTranslation } from 'react-i18next';

interface EditTaskDialogProps {
  task: Task;
  setOpen: (open: boolean) => void;
}

export default function EditTaskDialog({ task, setOpen }: EditTaskDialogProps) {
  const { updateTask } = useTask(); 
  const { toast } = useToast();
  const { t } = useTranslation();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [category, setCategory] = useState<TaskCategory | undefined>(task.category as TaskCategory | undefined);
  const [deadline, setDeadline] = useState<Date | undefined>(() => {
      try {
          return task.deadline ? parseISO(task.deadline) : undefined;
      } catch (e) {
          console.error("Invalid date format for deadline:", task.deadline);
          return undefined;
      }
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const deadlineISO = deadline ? deadline.toISOString() : undefined;
      
      const taskData: Partial<Task> = {
        title,
        description,
        priority,
        status,
        category,
        deadline: deadlineISO,
      };

      await updateTask(task.id, taskData);
      toast({
        title: t('editTaskDialog.toast.taskUpdatedTitle'),
        description: t('editTaskDialog.toast.taskUpdatedDescription'),
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('editTaskDialog.toast.updateErrorTitle'),
        description: t('editTaskDialog.toast.updateErrorDescription'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="space-y-6 px-2 max-h-[80vh] overflow-y-auto lg:max-h-none lg:overflow-y-visible scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent scrollbar-thumb-rounded">
       <div className="space-y-2">
         <Label htmlFor="edit-title">{t('common.title')}</Label>
         <Input
           id="edit-title"
           value={title}
           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
           placeholder={t('editTaskDialog.titlePlaceholder')}
           required
         />
       </div>

        <div className="space-y-2">
          <Label htmlFor="edit-category">Categorie</Label>
          <Select
            value={category}
            onValueChange={(value: string) => setCategory(value as TaskCategory)}
          >
            <SelectTrigger id="edit-category">
              <SelectValue placeholder={t('editTaskDialog.selectCategoryPlaceholder', 'Selecteer een categorie')} />
            </SelectTrigger>
            <SelectContent>
              {TASK_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

       <div className="space-y-2">
         <Label htmlFor="edit-description">{t('common.description')}</Label>
         <Textarea
           id="edit-description"
           value={description ?? ""}
           onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
           placeholder={t('editTaskDialog.descriptionPlaceholder')}
           rows={4}
         />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="edit-priority">{t('common.priority')}</Label>
           <Select
             value={priority}
             onValueChange={(value: string) => setPriority(value as TaskPriority)}
           >
             <SelectTrigger id="edit-priority">
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
           <Label htmlFor="edit-status">{t('common.status')}</Label>
           <Select
             value={status}
             onValueChange={(value: string) => setStatus(value as TaskStatus)}
           >
             <SelectTrigger id="edit-status">
               <SelectValue>
                 {t(`common.${status.toLowerCase().replace(' ', '_')}`)}
               </SelectValue>
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
            <Label htmlFor="edit-deadline">{t('common.deadline')}</Label>
            <div className="flex items-center space-x-2">
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
                            onSelect={(date) => setDeadline(date)}
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
                {deadline && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeadline(undefined)}
                        className="h-9 w-9"
                    >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        <span className="sr-only">{t('editTaskDialog.clearDeadlineSR')}</span>
                    </Button>
                )}
            </div>
        </div>

      <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setOpen(false)} 
            className="flex-1 h-12"
          >
              {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="flex-1 h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
          >
            {isLoading ? <GradientLoader size="sm" className="mr-2"/> : null}
            {t('common.save')}
          </Button>
      </div>
      </div>
    </form>
  );
} 