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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Fetch profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, role, avatar_url, language_preference, created_at, updated_at, status, email_notifications_enabled, ai_mode_preference"); // Select all necessary fields

    if (profileError) throw profileError;
    if (!profiles) throw new Error("errors.profiles.notFound");

    // 2. Fetch all auth users (admin operation)
    // Paginate if necessary for large numbers of users
    const { data: authUsersData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000, // Adjust if > 1000 users
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
      email: emailMap.get(profile.id) || null, // Add email
    }));

    // Return combined data
    return new Response(JSON.stringify(usersWithEmail), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in get-all-users function:", error);
    let errorKey = "errors.internalServerError"; // Default key
    if (error instanceof Error) {
      // Check if the message is already a key
      if (error.message === "errors.profiles.notFound") {
        errorKey = error.message;
      }
      // Add more 'else if' blocks here for other specific error keys from this function
    }
    return new Response(JSON.stringify({ errorKey: errorKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
