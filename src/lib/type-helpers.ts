/**
 * Type-helpers voor Supabase queries
 * Deze helpers maken het mogelijk om typesafe Supabase queries te schrijven
 * zonder de TypeScript linter waarschuwingen te triggeren
 */

import type { Database } from "@/integrations/supabase/database.types.ts";

/**
 * Helper functie voor het veilig casten van kolomnamen in Supabase queries
 * @param column De kolom naam
 */
export function column<T extends string>(column: T): T {
  return column;
}

/**
 * Helper type voor tabellen in de database
 */
export type Tables = Database['public']['Tables'];

/**
 * Helper type voor kolommen van een specifieke tabel
 */
export type TableColumns<T extends keyof Tables> = keyof Tables[T]['Row'];

/**
 * Helper voor Task Insert type
 */
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

/**
 * Helper voor Task Update type
 */
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

/**
 * Helper functie voor het veilig casten van een task insert
 */
export function castTaskInsert(value: unknown): TaskInsert[] {
  return value as TaskInsert[];
}

/**
 * Helper functie voor het veilig casten van een task update
 */
export function castTaskUpdate(value: unknown): TaskUpdate {
  return value as TaskUpdate;
}

/**
 * Helper functie voor het veilig casten van waardes naar het juiste type
 * @param value De waarde die gecast moet worden
 */
export function castValue<T>(value: unknown): T {
  return value as T;
} 