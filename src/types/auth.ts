// Auth typen voor de hele applicatie
export type UserRole = "admin" | "paid" | "free";

// AiMode specifiek voor chat controls
export type AiChatMode = 'default' | 'creative' | 'precise';

// Algemene AiMode
export type GeneralAiMode = 'gpt4o' | 'creative' | 'precise' | 'instruction'; 

// Research model providers
export type ResearchModel = 'perplexity-sonar' | 'gpt4o-mini';

// Chat model providers
export type ChatModelProvider = 'perplexity-sonar' | 'gpt4o-mini';

// Research model modes
export type ResearchModelMode = 'research' | 'instruction' | 'creative';

// Layout voorkeur
export type LayoutPreference = '50-50' | '33-67';

// User profile interface
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  avatar_url: string | null;
  language_preference: string;
  email_notifications_enabled: boolean;
  ai_mode_preference: AiChatMode;
  research_model_preference?: ResearchModelMode;
  research_model_provider?: ResearchModel;
  chat_model_provider?: ChatModelProvider;
  layout_preference?: LayoutPreference;
  created_at: string;
  updated_at: string;
  status?: string;
  enabled_features: string[];
  can_use_creative_mode?: boolean;
  can_use_precise_mode?: boolean;
} 