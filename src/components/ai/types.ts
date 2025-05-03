// Verwijder de ongebruikte Task import
// import { Task } from "@/types/task.ts";
import { LucideIcon, Bot, Brain, Zap } from "lucide-react";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  messageType?: 'standard' | 'research_result' | 'system' | 'error' | 'note_saved' | 'action_confirm';
  citations?: string[];
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const aiModels: AIModel[] = [
  {
    id: "default",
    name: "GPT-4o mini",
    description: "Snelle, algemene antwoorden",
    icon: Bot,
  },
  {
    id: "creative",
    name: "Creative Mode",
    description: "Voor brainstorming en ideeën",
    icon: Brain,
  },
  {
    id: "precise",
    name: "Precise Mode",
    description: "Voor feitelijke en gedetailleerde antwoorden",
    icon: Zap,
  },
];
