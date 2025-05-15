/**
 * @fileoverview Defines types and interfaces related to user authentication, authorization, and preferences.
 */

/**
 * Represents the possible roles a user can have within the application.
 * @typedef {"admin" | "paid" | "free"} UserRole
 */
export type UserRole = "admin" | "paid" | "free";

/**
 * Represents the AI interaction modes specifically for chat controls.
 * @typedef {'default' | 'creative' | 'precise'} AiChatMode
 */
export type AiChatMode = 'default' | 'creative' | 'precise';

/**
 * Represents the general AI interaction modes available in the application.
 * @typedef {'gpt4o' | 'creative' | 'precise' | 'instruction'} GeneralAiMode
 */
export type GeneralAiMode = 'gpt4o' | 'creative' | 'precise' | 'instruction'; 

/**
 * Represents the available AI models for research purposes.
 * @typedef {'perplexity-sonar' | 'gpt4o-mini'} ResearchModel
 */
export type ResearchModel = 'perplexity-sonar' | 'gpt4o-mini';

/**
 * Represents the available AI model providers for chat functionalities.
 * @typedef {'perplexity-sonar' | 'gpt4o-mini'} ChatModelProvider
 */
export type ChatModelProvider = 'perplexity-sonar' | 'gpt4o-mini';

/**
 * Represents the different modes for the research AI model.
 * @typedef {'research' | 'instruction' | 'creative'} ResearchModelMode
 */
export type ResearchModelMode = 'research' | 'instruction' | 'creative';

/**
 * Represents the user's preferred layout configuration for certain parts of the UI.
 * @typedef {'50-50' | '33-67'} LayoutPreference
 */
export type LayoutPreference = '50-50' | '33-67';

/**
 * Interface representing a user's profile information and preferences.
 * @interface UserProfile
 */
export interface UserProfile {
  /** The unique identifier for the user. */
  id: string;
  /** The email address of the user. */
  email: string;
  /** The display name of the user. Can be null. */
  name: string | null;
  /** The role of the user within the application. */
  role: UserRole;
  /** The URL of the user's avatar image. Can be null. */
  avatar_url: string | null;
  /** The user's preferred language code (e.g., 'en', 'nl'). */
  language_preference: string;
  /** Indicates whether email notifications are enabled for the user. */
  email_notifications_enabled: boolean;
  /** The user's preferred AI interaction mode for chat. */
  ai_mode_preference: AiChatMode;
  /** Optional preferred mode for the research AI model. */
  research_model_preference?: ResearchModelMode;
  /** Optional preferred provider for the research AI model. */
  research_model_provider?: ResearchModel;
  /** Optional preferred provider for the chat AI model. */
  chat_model_provider?: ChatModelProvider;
  /** Optional preferred layout configuration. */
  layout_preference?: LayoutPreference;
  /** The creation timestamp of the user profile (ISO string). */
  created_at: string;
  /** The last update timestamp of the user profile (ISO string). */
  updated_at: string;
  /** Optional status of the user account (e.g., 'active', 'inactive'). */
  status?: string;
  /** An array of feature keys that are enabled for this user. */
  enabled_features: string[];
  /** Optional flag indicating if the user can use the 'creative' AI mode. */
  can_use_creative_mode?: boolean;
  /** Optional flag indicating if the user can use the 'precise' AI mode. */
  can_use_precise_mode?: boolean;
} 