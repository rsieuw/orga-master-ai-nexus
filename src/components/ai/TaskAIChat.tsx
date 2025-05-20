import { useState } from "react";
import { Task } from "@/types/task.ts";
import ChatPanel from "./ChatPanel.tsx";
// Removed unused NotesPanel import
// Removed Bot, BrainCircuit, PenSquare imports as they are no longer used here
// Removed Tabs imports

// Removed unused Message interface

/**
 * Props for the TaskAIChat component.
 */
interface TaskAIChatProps {
  /** The task object for which the AI chat is displayed. */
  task: Task;
  /** The title of the currently selected subtask, if any. */
  selectedSubtaskTitle?: string | null;
  // onSubtaskHandled: () => void; // Example of a potential prop
}

/**
 * TaskAIChat component displays the AI chat interface for a specific task.
 * It primarily renders the ChatPanel.
 * 
 * @param {TaskAIChatProps} props - The props for the component.
 * @returns {JSX.Element} The TaskAIChat component.
 */
export default function TaskAIChat({ task, selectedSubtaskTitle /*, onSubtaskHandled */ }: TaskAIChatProps) {
  const [activeTab] = useState("chat"); // Currently, only "chat" tab is active
  // const [deepResearch, setDeepResearch] = useState<Message[]>([]); // Research state is managed within ResearchPanel or useDeepResearch hook

  return (
    <div className="flex flex-col h-full flex-grow min-h-0">
      {/* The original header div with Tabs has been removed as it's not currently used. */}
      
      {/* Render active panel directly */}
      <div className="flex-grow flex flex-col min-h-0">
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
