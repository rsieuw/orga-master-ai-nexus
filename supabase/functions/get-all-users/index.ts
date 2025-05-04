// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Belangrijk: Gebruik de service_role key hier veilig
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

console.log("Hello from Functions!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Fetch profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, avatar_url, language_preference, created_at, updated_at, status, email_notifications_enabled, ai_mode_preference"); // Selecteer alle benodigde velden

    if (profileError) throw profileError;
    if (!profiles) throw new Error("Geen profielen gevonden.");

    // 2. Fetch all auth users (admin operation)
    // Pagineren indien nodig voor grote hoeveelheden gebruikers
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000, // Pas aan indien > 1000 gebruikers
    });

    if (authError) throw authError;

    // 3. Create email map for quick lookup
    const emailMap = new Map<string, string>();
    authUsersData?.users.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email);
      }
    });

    // 4. Combine profile data with email
    const usersWithEmail = profiles.map(profile => ({
      ...profile,
      email: emailMap.get(profile.id) || null, // Voeg email toe
    }));

    // Return combined data
    return new Response(JSON.stringify(usersWithEmail), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-all-users function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-all-users' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
