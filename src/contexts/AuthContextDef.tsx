import { createContext } from "react";
import { Session } from "@supabase/supabase-js";
import { 
  UserProfile,
  AiChatMode
} from "@/types/auth.ts";

/**
 * Defines the shape of the authentication context.
 *
 * @interface AuthContextProps
 */
export interface AuthContextProps {
  /** Indicates if the user is currently authenticated. */
  isAuthenticated: boolean;
  /** The current user's profile data, or null if not authenticated. */
  user: UserProfile | null;
  /** The current Supabase session object, or null if not authenticated. */
  session: Session | null;
  /** Indicates if authentication status is currently being loaded. */
  isLoading: boolean;
  /** 
   * Logs in a user with email and password.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<void>} A promise that resolves on successful login.
   */
  login: (email: string, password: string) => Promise<void>;
  /** 
   * Logs out the current user.
   * @returns {Promise<void>} A promise that resolves on successful logout.
   */
  logout: () => Promise<void>;
  /** 
   * Registers a new user.
   * @param {string} email - The new user's email.
   * @param {string} password - The new user's password.
   * @param {string} name - The new user's name.
   * @returns {Promise<void>} A promise that resolves on successful registration.
   */
  register: (email: string, password: string, name: string) => Promise<void>;
  /** 
   * Sends a password reset email to the user.
   * @param {string} email - The user's email.
   * @returns {Promise<void>} A promise that resolves when the email is sent.
   */
  resetPassword: (email: string) => Promise<void>;
  /** 
   * Updates the current user's password.
   * @param {string} password - The new password.
   * @returns {Promise<void>} A promise that resolves on successful password update.
   */
  updatePassword: (password: string) => Promise<void>;
  /** 
   * Updates the current user's profile data.
   * @param {Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'research_model_provider' | 'chat_model_provider' | 'layout_preference'>>} data - The user data to update.
   * @returns {Promise<void>} A promise that resolves on successful update.
   */
  updateUser: (data: Partial<Pick<UserProfile, 'name' | 'email' | 'language_preference' | 'email_notifications_enabled' | 'ai_mode_preference' | 'research_model_preference' | 'research_model_provider' | 'chat_model_provider' | 'layout_preference'>>) => Promise<void>;
  /** The currently selected AI chat mode. */
  aiMode: AiChatMode;
  /** 
   * Sets the AI chat mode.
   * @param {AiChatMode} mode - The AI chat mode to set.
   */
  setAiMode: (mode: AiChatMode) => void;
  /** 
   * Signs in a user with Google OAuth.
   * @returns {Promise<void>} A promise that resolves on successful sign-in initiation.
   */
  signInWithGoogle: () => Promise<void>;
}

/**
 * React context for managing authentication state and actions.
 * Provides access to user information, session details, and authentication functions.
 */
export const AuthContext = createContext<AuthContextProps | undefined>(undefined); 