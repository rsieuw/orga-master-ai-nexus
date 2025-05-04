import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.ts';

const SUPABASE_URL = "https://wzoeijpdtpysbkmxbcld.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6b2VpanBkdHB5c2JrbXhiY2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNTg0NzcsImV4cCI6MjA2MTYzNDQ3N30.BuqUr8eTib3tC42OEkH4K7gYhWIATvuLwdGak5MZEC4";
 
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY); 