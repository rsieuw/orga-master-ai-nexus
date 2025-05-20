// Database table names as constants to prevent string literals
export const DATABASE_TABLES = {
  SYSTEM_SETTINGS: "system_settings" as const,
  TASKS: "tasks" as const,
  PROFILES: "profiles" as const,
  CHAT_MESSAGES: "chat_messages" as const,
  // ... andere tabellen indien nodig
};

// Interface voor de system_settings tabel
export interface SystemSettings {
  id: string;
  setting_name: string;
  setting_value: Record<string, unknown>; // Generiek record type in plaats van 'any'
  created_at: string;
  updated_at: string | null;
}

// Interface specifiek voor AI generation limits
export interface AiGenerationLimits {
  free_user_limit: number;
  paid_user_limit: number;
}
