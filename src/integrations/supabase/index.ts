/**
 * @fileoverview Centrale exportlocatie voor alle Supabase-gerelateerde types.
 * Dit bestand consolideert alle databasetypes op één plek om dubbele definities te voorkomen.
 */

// Exporteer de Database type en gerelateerde types uit het gegenereerde types bestand
export type { 
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes
} from './database.types.ts';

// Exporteer interfaces voor specifieke tabellen
export type { SystemSettings, AiGenerationLimits } from '@/constants/databaseTables.ts'; 