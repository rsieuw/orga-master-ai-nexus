import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl) {
  console.error("ERROR: SUPABASE_URL is not set.");
  // In a real scenario, you might want to throw an error or handle this more gracefully
}
if (!supabaseServiceRoleKey) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.");
  // In a real scenario, you might want to throw an error or handle this more gracefully
}

export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl ?? "",
  supabaseServiceRoleKey ?? ""
);

// Optional: You can also export a function to get a new admin client if needed elsewhere,
// though for most shared purposes, the singleton instance above is fine.
// export const getSupabaseAdminClient = (): SupabaseClient => {
//   const url = Deno.env.get("SUPABASE_URL");
//   const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
//   if (!url || !key) {
//     throw new Error("Supabase URL or Service Role Key is not set in environment variables for admin client.");
//   }
//   return createClient(url, key);
// }; 