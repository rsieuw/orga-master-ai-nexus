
import { useState } from "react";
import { Task } from "@/types/task";
import { Bot, BrainCircuit, PenSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import the components
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
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

      {/* Move these TabsContent components inside the Tabs component above */}
      <div className="flex-grow">
        {activeTab === "chat" && (
          <ChatPanel task={task} deepResearch={deepResearch} />
        )}
        
        {activeTab === "research" && (
          <div className="flex-grow flex flex-col p-4 m-0 gap-4">
            <ResearchPanel 
              deepResearch={deepResearch} 
              setDeepResearch={setDeepResearch} 
              setActiveTab={setActiveTab} 
            />
          </div>
        )}
        
        {activeTab === "notes" && (
          <div className="flex-grow flex flex-col p-4 m-0 gap-4">
            <NotesPanel task={task} />
          </div>
        )}
      </div>
    </div>
  );
}
