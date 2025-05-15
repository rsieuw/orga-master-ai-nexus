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
Deno.serve(async (req: Request) => { // Replaced std/serve with Deno.serve and typed req
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Logging variables
  let userIdForLogging: string | undefined;
  const functionNameForLogging = 'get-all-users';
  let userSpecificSupabaseClient: SupabaseClient | undefined;

  try {
    // Create a client with the user's auth context for logging who is calling this admin function
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
      // Optional: Handle cases where no auth header is provided, though an admin function like this should require it.
      // For now, we'll allow the function to proceed, but logging might be anonymous.
      console.warn("[get-all-users] No Authorization header found. Logging will be anonymous if user ID cannot be determined.");
    }

    // 1. Fetch profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, avatar_url, language_preference, created_at, updated_at, status, email_notifications_enabled, ai_mode_preference");

    if (profileError) throw profileError;
    if (!profiles) throw new Error("errors.profiles.notFound");

    // 2. Fetch all auth users (admin operation)
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000, 
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
      email: emailMap.get(profile.id) || null,
    }));

    // Log success to user_api_logs
    if (userSpecificSupabaseClient) { // Check if client was initialized
      await userSpecificSupabaseClient.from('user_api_logs').insert({
        user_id: userIdForLogging, // This might be undefined if auth header was missing
        function_name: functionNameForLogging,
        metadata: { success: true, profilesFetched: profiles.length, authUsersFetched: authUsersData?.users.length },
      });
    }

    // Return combined data
    return new Response(JSON.stringify(usersWithEmail), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) { // Typed error
    console.error("Error in get-all-users function:", error);
    let errorKey = "errors.internalServerError";
    if (error instanceof Error) {
      if (error.message === "errors.profiles.notFound") {
        errorKey = error.message;
      }
    }

    // Log failure to user_api_logs
    if (userSpecificSupabaseClient) { // Check if client was initialized
      try {
        await userSpecificSupabaseClient.from('user_api_logs').insert({
          user_id: userIdForLogging, // Might be undefined
          function_name: functionNameForLogging,
          metadata: { success: false, error: errorKey, rawErrorMessage: error instanceof Error ? error.message : String(error), requestIp: req.headers.get('x-forwarded-for') },
        });
      } catch (logError: unknown) {
          console.error('[get-all-users] FAILED TO LOG TO user_api_logs:', logError instanceof Error ? logError.message : String(logError));
      }
    }

    return new Response(JSON.stringify({ errorKey: errorKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
