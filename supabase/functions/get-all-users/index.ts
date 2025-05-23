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
Deno.serve(async (req: Request) => { 
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ errorKey: "errors.auth.missingHeader" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Create a Supabase client with the user's token
    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the calling user's data
    const { data: { user: callingUser }, error: userError } = await supabaseUserClient.auth.getUser();

    if (userError || !callingUser) {
      console.error("Error fetching calling user or no user found:", userError);
      return new Response(JSON.stringify({ errorKey: "errors.auth.invalidUser" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Fetch the calling user's profile to check their role
    const { data: userProfile, error: profileFetchError } = await supabaseAdmin // Use admin client to fetch profile reliably
      .from('profiles')
      .select('role')
      .eq('id', callingUser.id)
      .single();

    if (profileFetchError) {
      console.error("Error fetching user profile for admin check:", profileFetchError);
      return new Response(JSON.stringify({ errorKey: "errors.profiles.fetchFailed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!userProfile || userProfile.role !== 'admin') {
      console.warn(`User ${callingUser.id} with role ${userProfile?.role || 'unknown'} attempted to access get-all-users.`);
      return new Response(JSON.stringify({ errorKey: "errors.auth.notAdmin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403, // Forbidden
      });
    }

    // User is admin, proceed to fetch all users
    // Admin role check has been implemented.
    // console.log("[get-all-users] Admin access GRANTED."); // Optional: log successful admin access

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

    return new Response(JSON.stringify({ errorKey: errorKey }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: (error instanceof Response && error.status) ? error.status : 500, 
    });
  }
});
