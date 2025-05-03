import { useState } from "react";
import { Task } from "@/types/task.ts";
import ChatPanel from "./ChatPanel.tsx";
// Removed unused NotesPanel import
// Removed Bot, BrainCircuit, PenSquare imports as they are no longer used here
// Removed Tabs imports

// Removed unused Message interface

interface TaskAIChatProps {
  task: Task;
  selectedSubtaskTitle: string | null;
  // onSubtaskHandled: () => void;
}

export default function TaskAIChat({ task, selectedSubtaskTitle /*, onSubtaskHandled */ }: TaskAIChatProps) {
  const [activeTab] = useState("chat");
  // Removed deepResearch state, assuming it's managed within ResearchPanel now

  return (
    <div className="flex flex-col h-full">
      {/* Removed the original header div with Tabs */}
      
      {/* Render active panel directly */}
      <div className="flex-grow flex flex-col">
        {activeTab === "chat" && (
          <ChatPanel 
            task={task} 
            selectedSubtaskTitle={selectedSubtaskTitle}
          />
        )}
        {/* Temporarily commented out to resolve TS error */}
        {/* {activeTab === "research" && (
          <ResearchPanel /> 
        )} */}
        {/* Removed NotesPanel rendering based on activeTab */}
        {/* {activeTab === "notes" && (
          <NotesPanel task={task} />
        )} */}
      </div>
      
      {/* Remove the leftover chat window and form elements below */}
      {/* These belong inside ChatPanel */}
    </div>
  );
}
