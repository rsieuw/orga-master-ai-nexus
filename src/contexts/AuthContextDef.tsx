import { createContext } from "react";
import { Session } from "@supabase/supabase-js";
import { 
  UserProfile,
  AiChatMode
} from "@/types/auth.ts";

export interface AuthContextProps {
  isAuthenticated: boolean;
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateUser: (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'research_model_provider' | 'chat_model_provider' | 'layout_preference'>>) => Promise<void>;
  aiMode: AiChatMode;
  setAiMode: (mode: AiChatMode) => void;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined); 