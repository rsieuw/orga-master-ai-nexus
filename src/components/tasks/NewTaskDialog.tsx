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

interface NewTaskDialogProps {
  setOpen: (open: boolean) => void;
}

export default function NewTaskDialog({ setOpen }: NewTaskDialogProps) {
  const { createTask } = useTask();
  // const navigate = useNavigate(); // Removed unused variable
  const { toast } = useToast();

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
        title: "Invoer ontbreekt",
        description: "Vul eerst het 'Beschrijf je taak of idee' veld in.",
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
          title: "Genereren mislukt",
          description: error instanceof Error ? error.message : "Er is een fout opgetreden.",
        });
      }

      if (data && data.title && data.description) {
        setTitle(data.title);
        setDescription(data.description);
        toast({
          title: "Taakdetails gegenereerd",
          description: "De titel en beschrijving zijn ingevuld. Je kunt ze nu aanpassen.",
        });
        setDetailsVisible(true);
      } else {
        throw new Error("Onverwachte response van AI service.");
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Er is een fout opgetreden.";
      toast({
        variant: "destructive",
        title: "Genereren mislukt",
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
        title: "Taak aangemaakt",
        description: "De nieuwe taak is succesvol aangemaakt",
      });
      setOpen(false); // Sluit de dialog na succes
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fout",
        description: "De taak kon niet worden aangemaakt",
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
        placeholder="Beschrijf je taak of idee, bijv: Organiseer een teamlunch voor volgende week vrijdag..."
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
          {isGeneratingTask ? "Genereren..." : "Genereer Taakdetails"}
        </Button>
      </div>
        </>
      )}

      {/* Show task details form only if details are visible */}
      {detailsVisible && (
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Taak titel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              placeholder="Beschrijf de taak..."
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
              Genereer ook subtaken (optioneel)
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioriteit</Label>
              <Select
                value={priority}
                onValueChange={(value: string) => setPriority(value as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Selecteer prioriteit" />
                </SelectTrigger>
                <SelectContent onPointerDownOutside={(event: Event) => event.preventDefault()}>
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
                onValueChange={(value: string) => setStatus(value as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecteer status" />
                </SelectTrigger>
                <SelectContent onPointerDownOutside={(event: Event) => event.preventDefault()}>
                  <SelectItem value="todo">Te doen</SelectItem>
                  <SelectItem value="in_progress">In behandeling</SelectItem>
                  <SelectItem value="done">Voltooid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline-button">Deadline (optioneel)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="deadline-button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, 'PPP', { locale: nl }) : <span>Kies een datum</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card/70 backdrop-blur-md border border-white/10 z-[100]" align="start" onPointerDownOutside={(event: Event) => event.preventDefault()}>
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
               disabled={isLoading} 
               className="w-full h-12 bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
             >
               {isLoading ? "Aanmaken..." : "Taak aanmaken"}
             </Button>
          </div>
        </div>
      )}
    </form>
  );
} 