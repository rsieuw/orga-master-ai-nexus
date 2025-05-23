// Database table names as constants to prevent string literals
export const DATABASE_TABLES = {
  SYSTEM_SETTINGS: "system_settings" as const,
  TASKS: "tasks" as const,
  PROFILES: "profiles" as const,
  CHAT_MESSAGES: "chat_messages" as const,
  // ... other tables if needed
};

/**
 * Interface for the system_settings table.
 */
export interface SystemSettings {
  id: string;
  setting_name: string;
  setting_value: Record<string, unknown>; // Generic record type instead of 'any'
  created_at: string;
  updated_at: string | null;
}

/**
 * Interface specific for AI generation limits.
 */
export interface AiGenerationLimits {
  free_user_limit: number;
  paid_user_limit: number;
}
