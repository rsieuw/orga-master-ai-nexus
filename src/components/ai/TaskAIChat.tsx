
import { useState } from "react";
import { Task } from "@/types/task";
import { Bot, BrainCircuit, PenSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the newly created components
import ChatPanel from "./ChatPanel";
import ResearchPanel from "./ResearchPanel";
import NotesPanel from "./NotesPanel";

interface TaskAIChatProps {
  task: Task;
}

export default function TaskAIChat({ task }: TaskAIChatProps) {
  const [activeTab, setActiveTab] = useState("chat");
  const [deepResearch, setDeepResearch] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h2 className="font-semibold">AI Assistent</h2>
        <Tabs defaultValue="chat" className="w-[400px]" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 bg-secondary/50 backdrop-blur-sm">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-1">
              <BrainCircuit className="w-4 h-4" />
              <span className="hidden sm:inline">Onderzoek</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1">
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Notities</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="chat" className="flex-grow flex flex-col p-0 m-0">
        <ChatPanel task={task} deepResearch={deepResearch} />
      </TabsContent>
      
      <TabsContent value="research" className="flex-grow flex flex-col p-4 m-0 gap-4">
        <ResearchPanel 
          deepResearch={deepResearch} 
          setDeepResearch={setDeepResearch} 
          setActiveTab={setActiveTab} 
        />
      </TabsContent>
      
      <TabsContent value="notes" className="flex-grow flex flex-col p-4 m-0 gap-4">
        <NotesPanel task={task} />
      </TabsContent>
    </div>
  );
}
