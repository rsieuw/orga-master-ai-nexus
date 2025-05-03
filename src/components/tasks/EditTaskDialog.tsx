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
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast.ts";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Task, TaskPriority, TaskStatus } from "@/types/task.ts";
import { cn } from "@/lib/utils.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { GradientLoader } from "@/components/ui/loader.tsx";

interface EditTaskDialogProps {
  task: Task;
  setOpen: (open: boolean) => void;
}

export default function EditTaskDialog({ task, setOpen }: EditTaskDialogProps) {
  const { updateTask } = useTask(); 
  const { toast } = useToast();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
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
        deadline: deadlineISO,
      };

      await updateTask(task.id, taskData);
      toast({
        title: "Taak bijgewerkt",
        description: "De wijzigingen zijn opgeslagen.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout bij bijwerken",
        description: "De taak kon niet worden bijgewerkt.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
       <div className="space-y-2">
         <Label htmlFor="edit-title">Titel</Label>
         <Input
           id="edit-title"
           value={title}
           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
           placeholder="Taak titel"
           required
         />
       </div>

       <div className="space-y-2">
         <Label htmlFor="edit-description">Beschrijving</Label>
         <Textarea
           id="edit-description"
           value={description ?? ""}
           onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
           placeholder="Beschrijf de taak..."
           rows={4}
         />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label htmlFor="edit-priority">Prioriteit</Label>
           <Select
             value={priority}
             onValueChange={(value: string) => setPriority(value as TaskPriority)}
           >
             <SelectTrigger id="edit-priority">
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
           <Label htmlFor="edit-status">Status</Label>
           <Select
             value={status}
             onValueChange={(value: string) => setStatus(value as TaskStatus)}
           >
             <SelectTrigger id="edit-status">
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
            <Label htmlFor="edit-deadline">Deadline</Label>
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
                        {deadline ? format(deadline, "PPP", { locale: nl }) : <span>Kies een datum</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card/70 backdrop-blur-md border border-white/10">
                    <Calendar
                        mode="single"
                        selected={deadline}
                        onSelect={setDeadline}
                        initialFocus
                        locale={nl}
                    />
                </PopoverContent>
            </Popover>
        </div>

      <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuleren
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900">
            {isLoading ? <GradientLoader size="sm" className="mr-2"/> : null}
            Opslaan
          </Button>
      </div>
    </form>
  );
} 