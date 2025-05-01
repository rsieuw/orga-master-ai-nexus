import { useState } from "react";
import { Task } from "@/types/task";
// Removed Bot, BrainCircuit, PenSquare imports as they are no longer used here
// Removed Tabs imports

// Import the components
import ChatPanel from "./ChatPanel";
import ResearchPanel from "./ResearchPanel";
import NotesPanel from "./NotesPanel";

interface TaskAIChatProps {
  task: Task;
  selectedSubtaskTitle: string | null;
  onSubtaskHandled: () => void;
}

export default function TaskAIChat({ task, selectedSubtaskTitle, onSubtaskHandled }: TaskAIChatProps) {
  const [activeTab, setActiveTab] = useState("chat");
  // Removed deepResearch state, assuming it's managed within ResearchPanel now

  return (
    <div className="flex flex-col h-full">
      {/* Removed the original header div with Tabs */}
      
      {/* Render active panel directly */}
      <div className="flex-grow flex flex-col">
        {activeTab === "chat" && (
          <ChatPanel 
            task={task} 
            setActiveTab={setActiveTab} 
            selectedSubtaskTitle={selectedSubtaskTitle}
            onSubtaskHandled={onSubtaskHandled}
          />
        )}
        {/* Temporarily commented out to resolve TS error */}
        {/* {activeTab === "research" && (
          <ResearchPanel /> 
        )} */}
        {activeTab === "notes" && (
          <NotesPanel task={task} />
        )}
      </div>
    </div>
  );
}
