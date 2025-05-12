// Remove the unused Task import
// import { Task } from "@/types/task.ts";
import { Sparkles, Target, LucideIcon, Bot } from 'lucide-react';

export type MessageRole = "user" | "assistant" | "system";

export type MessageType = 
  | 'standard'          // Standard chat message (user or assistant)
  | 'research_result'   // Result of deep research (from assistant)
  | 'system'            // System message (e.g., "Research started", "Subtask selected")
  | 'error'             // Error message (from assistant)
  | 'note_saved'        // Confirmation that a note has been saved (from user, right-aligned)
  | 'action_confirm'    // Confirmation that an AI action has been performed (e.g., task renamed)
  | 'saved_research_display' // Saved research result for display
  | 'research_loader';   // Temporary message while loading research

export interface Citation {
  url: string;
  title?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  messageType: 'standard' | 'research_result' | 'system' | 'error' | 'note_saved' | 'action_confirm' | 'saved_research_display' | 'research_loader';
  timestamp?: number;
  createdAt?: string;
  isLoading?: boolean;
  isError?: boolean;
  citations?: (Citation | string)[];
  dbId?: string;
  isPinned?: boolean;
  savedResearchId?: string;
  canBeSaved?: boolean;
  subtask_title?: string | null;
  subtaskId?: string | null;
  prompt?: string | null;
  _forceDisplay?: boolean; // Nieuwe flag om directe weergave te forceren
}

export interface AIModel {
  id: 'default' | 'creative' | 'precise'; // Must match AiMode in AuthContext
  nameKey: string; // Translation key for the name
  descriptionKey: string; // Translation key for the description
  icon: LucideIcon;
}

export const aiModels: AIModel[] = [
  {
    id: 'default',
    nameKey: 'aiModes.default.name',
    descriptionKey: 'aiModes.default.description',
    icon: Bot,
  },
  {
    id: 'creative',
    nameKey: 'aiModes.creative.name',
    descriptionKey: 'aiModes.creative.description',
    icon: Sparkles,
  },
  {
    id: 'precise',
    nameKey: 'aiModes.precise.name',
    descriptionKey: 'aiModes.precise.description',
    icon: Target,
  },
];
