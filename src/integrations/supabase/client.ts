import { createClient } from '@supabase/supabase-js';
import type { Database } from './index.ts';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  console.error("Supabase URL is not set in environment variables. Did you forget to set VITE_SUPABASE_URL?");
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error("Supabase Anon Key is not set in environment variables. Did you forget to set VITE_SUPABASE_PUBLISHABLE_KEY?");
}

/**
 * Supabase client instance voor interactie met de Supabase backend.
 * Gëoptimaliseerd om de belasting van realtime queries te verminderen.
 * Het gebruik van realtime is beperkt met aangepaste parameters.
 * De `Database` type generiek biedt typeveiligheid voor databaseoperaties.
 * @constant
 * @type {import('@supabase/supabase-js').SupabaseClient<Database>}
 */
export const supabase = createClient<Database>(
  SUPABASE_URL!, 
  SUPABASE_PUBLISHABLE_KEY!,
  {
    realtime: {
      params: {
        // Beperk het aantal events per seconde om overbelasting te voorkomen
        eventsPerSecond: 1,
        // Verhoog de retry timeout voor minder frequente verbindingspogingen
        retryAfterError: 5000,
        // Grotere hearbeat interval vermindert verbindingsfrequentie
        heartbeatIntervalMs: 60000,
      }
    },
    // Verwijder ongeldig global.fetch object
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
); 