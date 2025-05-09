// Verwijder de ongebruikte Task import
// import { Task } from "@/types/task.ts";
import { LucideIcon, Bot, Brain, Zap } from "lucide-react";

export type MessageRole = "user" | "assistant" | "system";

export type MessageType = 
  | 'standard'          // Standaard chatbericht (user of assistant)
  | 'research_result'   // Resultaat van deep research (van assistant)
  | 'system'            // Systeembericht (bv. "Onderzoek gestart", "Subtaak geselecteerd")
  | 'error'             // Foutmelding (van assistant)
  | 'note_saved'        // Bevestiging dat een notitie is opgeslagen (van user, rechts uitgelijnd)
  | 'action_confirm'    // Bevestiging dat een AI actie is uitgevoerd (bv. taak hernoemd)
  | 'saved_research_display' // Opgeslagen onderzoeksresultaat voor weergave
  | 'research_loader'   // Tijdelijk bericht tijdens het laden van onderzoek
  | 'status';          // 'status' toegevoegd

export interface Message {
  id: string; // Client-side ID toegevoegd
  role: MessageRole;
  content: string;
  timestamp?: number; // Overweeg createdAt: string te gebruiken voor consistentie
  createdAt?: string; // Toegevoegd voor consistentie
  messageType?: MessageType;
  dbId?: string; // Voor notities en opgeslagen onderzoek, om ze te kunnen verwijderen
  citations?: string[]; 
  subtaskId?: string; // Toegevoegd
  subtask_title?: string | null; // Voor research_result en saved_research_display
  prompt?: string | null; // Voor research_result en saved_research_display gegenereerd via prompt
  isLoading?: boolean; // Toegevoegd
  isError?: boolean; // Toegevoegd
  savedResearchId?: string; // Toegevoegd
  canBeSaved?: boolean; // Toegevoegd
  isPinned?: boolean; // Nieuw veld voor pinnen
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
