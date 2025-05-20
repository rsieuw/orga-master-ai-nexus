import { createClient } from '@supabase/supabase-js';
import type { Database } from './index.ts';

/**
 * The URL for the Supabase project.
 * @constant
 * @type {string}
 */
const SUPABASE_URL = "https://wzoeijpdtpysbkmxbcld.supabase.co";
/**
 * The publishable anonymous key for the Supabase project.
 * This key is safe to be used in a browser environment.
 * @constant
 * @type {string}
 */
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b2VpanBkdHB5c2JrbXhiY2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTg0NzcsImV4cCI6MjA2MTYzNDQ3N30.BuqUr8eTib3tC42OEkH4K7gYhWIATvuLwdGak5MZEC4";
 
/**
 * Supabase client instance for interacting with the Supabase backend.
 * It is initialized with the project URL and the publishable anonymous key.
 * The `Database` type generic provides type safety for database operations.
 * @constant
 * @type {import('@supabase/supabase-js').SupabaseClient<Database>}
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); 