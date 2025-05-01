
import { useState } from "react";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NotesPanelProps {
  task: Task;
}

export default function NotesPanel({ task }: NotesPanelProps) {
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const handleSaveNote = () => {
    if (note.trim()) {
      toast({
        title: "Notitie opgeslagen",
        description: "De notitie is succesvol opgeslagen bij deze taak",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Lege notitie",
        description: "Voeg eerst tekst toe aan je notitie",
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Notities voor "{task.title}"</h3>
      <p className="text-sm text-muted-foreground">
        Voeg notities toe aan deze taak om belangrijke informatie bij te houden.
      </p>
      
      <Textarea
        className="min-h-[200px] border-white/10 bg-secondary/30 focus:ring-primary/40"
        placeholder="Schrijf hier je notities..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setNote("")}>
          Wissen
        </Button>
        <Button 
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          onClick={handleSaveNote}
        >
          Opslaan
        </Button>
      </div>
    </div>
  );
}
