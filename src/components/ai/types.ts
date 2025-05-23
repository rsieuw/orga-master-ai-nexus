// Remove the unused Task import
// import { Task } from "@/types/task.ts";
import { Sparkles, Target, LucideIcon, Bot } from 'lucide-react';

/**
 * Defines the possible roles for a message sender.
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * Defines the different types of messages that can be displayed in the chat.
 */
export type MessageType = 
  | 'standard'          // Standard chat message (user or assistant)
  | 'research_result'   // Result of deep research (from assistant)
  | 'system'            // System message (e.g., "Research started", "Subtask selected")
  | 'error'             // Error message (from assistant)
  | 'note_saved'        // Confirmation that a note has been saved (from user, right-aligned)
  | 'action_confirm'    // Confirmation that an AI action has been performed (e.g., task renamed)
  | 'saved_research_display' // Saved research result for display
  | 'research_loader';   // Temporary message while loading research

/**
 * Represents a citation with a URL and an optional title.
 */
export interface Citation {
  url?: string;
  title?: string;
  text?: string;
  number?: number;
}

/**
 * Represents a message in the chat.
 */
export interface Message {
  /** The unique identifier for the message. */
  id: string;
  /** The role of the message sender. */
  role: 'user' | 'assistant';
  /** The content of the message. */
  content: string;
  /** The type of the message. */
  messageType?: MessageType;
  /** The timestamp when the message was created (in milliseconds). */
  timestamp?: number;
  /** The ISO string representation of when the message was created. */
  createdAt?: string;
  /** Indicates if the message is currently loading. */
  isLoading?: boolean;
  /** Indicates if the message represents an error. */
  isError?: boolean;
  /** An array of citations or citation URLs related to the message. */
  citations?: (Citation | string)[];
  /** The database ID of the message, if it's persisted. */
  dbId?: string;
  /** Indicates if the message is pinned. */
  isPinned?: boolean;
  /** The ID of the saved research associated with this message, if any. */
  savedResearchId?: string | null;
  /** Indicates if the message content can be saved as research. */
  canBeSaved?: boolean;
  /** The title of the subtask related to this message. */
  subtask_title?: string | null;
  /** The ID of the subtask related to this message. */
  subtaskId?: string | null;
  /** The prompt that generated this message, if applicable. */
  prompt?: string;
  /** Flag to force direct display of the message, bypassing some conditions. */
  _forceDisplay?: boolean;
  /** The mode used for research. */
  mode?: ResearchMode;
  /** The used AI model. */
  model?: string;
  /** The query entered by the user. */
  query?: string;
}

/**
 * Represents an AI model configuration.
 */
export interface AIModel {
  /** The unique identifier for the AI model. Must match AiMode in AuthContext. */
  id: 'default' | 'creative' | 'precise';
  /** The translation key for the AI model's name. */
  nameKey: string;
  /** The translation key for the AI model's description. */
  descriptionKey: string;
  /** The Lucide icon component for the AI model. */
  icon: LucideIcon;
}

/**
 * An array of available AI model configurations.
 */
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

// Voeg ResearchMode definitie hier toe
export type ResearchMode = 'research' | 'instruction' | 'creative';
