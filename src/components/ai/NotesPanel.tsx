import { useState } from "react";
import { Task } from "@/types/task.ts";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Loader } from "@/components/ui/loader.tsx";
import { Save } from "lucide-react";

interface NotesPanelProps {
  task: Task;
}

export default function NotesPanel({ task }: NotesPanelProps) {
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState("current");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveNotes = () => {
    setIsSaving(true);
    handleSaveNote();
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Notities voor "{task.title}"</h3>
      <p className="text-sm text-muted-foreground">
        Voeg notities toe aan deze taak om belangrijke informatie bij te houden.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="current">Huidige notitie</TabsTrigger>
          <TabsTrigger value="history">Geschiedenis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4">
          <Textarea
            className="min-h-[200px] border-white/10 bg-secondary/30 focus:ring-primary/40"
            placeholder="Schrijf hier je notities..."
            value={note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
          />
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNote("")}>
              Wissen
            </Button>
            <Button 
              onClick={handleSaveNotes} 
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900"
            >
              {isSaving ? (
                  <Loader size="sm" className="mr-2" />
              ) : (
                  <Save className="mr-2 h-4 w-4" />
              )}
              Save Notes
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="text-sm text-muted-foreground italic p-4 text-center bg-secondary/20 rounded-md">
            Geen eerdere notities gevonden voor deze taak.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
