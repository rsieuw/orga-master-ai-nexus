/**
 * @fileoverview Supabase Edge Function to retrieve all user profiles along with their email addresses.
 * This function is intended for admin use. It fetches all profiles from the `profiles` table
 * and all users from Supabase Auth, then combines this data to include email addresses
 * with each profile.
 */

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Deno.serve is now preferred
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
// import { createSuccessResponse, createErrorResponse } from "../_shared/responseBuilders.ts"; // If using shared builders

/**
 * Supabase admin client instance, initialized with the Supabase URL and service role key.
 * This client has administrative privileges and should be used securely.
 * @constant
 * @type {SupabaseClient}
 */
const supabaseAdmin: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

/**
 * Main Deno server function that handles incoming HTTP requests to get all users.
 * - Handles CORS preflight requests.
 * - Fetches all user profiles from the `profiles` table using the admin client.
 * - Fetches all authenticated users from Supabase Auth using the admin client.
 * - Creates a map of user IDs to email addresses from the Auth user data.
 * - Combines the profile data with their corresponding email addresses.
 * - Returns an array of user profiles, each including an email, or an error response with an errorKey.
 * This function requires admin privileges (service_role key).
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
Deno.serve(async (req: Request) => { 
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Logging variabelen worden hieronder verwijderd of uitgecommentarieerd
  // const functionNameForLogging = 'get-all-users';
  // let userIdForLogging: string | undefined;
  // let userSpecificSupabaseClient: SupabaseClient | undefined;
  // let supabaseAdminLoggingClient: SupabaseClient | null = null;

  /* // Admin client creatie voor logging, niet meer nodig
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseServiceRoleKey) {
    supabaseAdminLoggingClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceRoleKey
    );
  } else {
    console.warn("[get-all-users] SUPABASE_SERVICE_ROLE_KEY not set.");
  }
  */

  try {
    /* // User client creatie voor logging, niet meer nodig
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      userSpecificSupabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userSpecificSupabaseClient.auth.getUser();
      userIdForLogging = user?.id;
    } else {
      console.warn("[get-all-users] No Authorization header found.");
    }
    */

    // TODO: Toevoegen van admin role check voor de aanroepende gebruiker, 
    // momenteel is de functie toegankelijk voor iedereen met de function invoke URL.
    // Dit is een beveiligingsrisico.

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, avatar_url, language_preference, created_at, updated_at, status, email_notifications_enabled, ai_mode_preference");

    if (profileError) throw profileError;
    if (!profiles) throw new Error("errors.profiles.notFound");

    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000, 
    });

    if (authError) throw authError;

    const emailMap = new Map<string, string>();
    authUsersData?.users.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email);
      }
    });

    const usersWithEmail = profiles.map(profile => ({
      ...profile,
      email: emailMap.get(profile.id) || null,
    }));

    // Logging naar user_api_logs hier uitgecommentarieerd
    /*
    if (userSpecificSupabaseClient || supabaseAdminLoggingClient) { 
      const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient!;
      await loggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging, 
        function_name: functionNameForLogging,
        metadata: { success: true, profilesFetched: profiles.length, authUsersFetched: authUsersData?.users.length },
      });
    }
    */

    return new Response(JSON.stringify(usersWithEmail), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) { 
    console.error("Error in get-all-users function:", error);
    let errorKey = "errors.internalServerError";
    if (error instanceof Error) {
      if (error.message === "errors.profiles.notFound") {
        errorKey = error.message;
      }
    }

    // Logging naar user_api_logs hier uitgecommentarieerd
    /*
    if (userSpecificSupabaseClient || supabaseAdminLoggingClient) { 
      try {
        const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient!;
        await loggingClient.from('user_api_logs').insert({
          user_id: userIdForLogging, 
          function_name: functionNameForLogging,
          metadata: { success: false, error: errorKey, rawErrorMessage: error instanceof Error ? error.message : String(error), requestIp: req.headers.get('x-forwarded-for') },
        });
      } catch (logError: unknown) {
          console.error('[get-all-users] FAILED TO LOG TO user_api_logs:', logError instanceof Error ? logError.message : String(logError));
      }
    }
    */

    return new Response(JSON.stringify({ errorKey: errorKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      // status: error.status || 500, // error.status is not always available
      status: (error instanceof Response && error.status) ? error.status : 500, 
    });
  }
});
