/**
 * @fileoverview Supabase Edge Function to delete a saved research item.
 * This function authenticates the user, verifies the research item belongs to them,
 * and then deletes it from the `saved_research` table.
 */
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
// import { supabaseAdmin } from "../_shared/supabaseAdmin.ts" // Not used in this version

// console.log(`Function 'delete-research' booting up.`);

/**
 * @typedef {Object} DeleteResearchRequestBody
 * @property {string} researchId - The ID of the research item to be deleted.
 */

/**
 * Main Deno server function that handles incoming HTTP requests to delete research.
 * - Handles CORS preflight requests.
 * - Authenticates the user using the Authorization header.
 * - Parses the request body to get the `researchId`.
 * - Deletes the specified research item from the `saved_research` table,
 *   ensuring it belongs to the authenticated user.
 * - Returns a success message or an error response.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Create Supabase client with Auth context
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Get user from Auth context
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      // console.error("User authentication error:", userError);
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Parse request body to get the researchId
    const { researchId } = await req.json();
    if (!researchId || typeof researchId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'researchId' in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // 4. Delete data from the saved_research table
    const { count, error: deleteError } = await supabaseClient
      .from('saved_research')
      .delete({ count: 'exact' })
      .eq('id', researchId)
      .eq('user_id', user.id); // Extra check: only delete if it belongs to the user

    // ---> NEW: Log the result of the delete operation <---
    console.log(`[delete-research] Attempted delete for researchId: ${researchId}, userId: ${user.id}. Result count: ${count}`);
    // ---> END NEW <---

    if (deleteError) {
      // console.error("Error deleting saved research:", deleteError);
      // Differentiate between not found and other errors?
      // For now, just throw generic error
      throw new Error(`Database error: ${deleteError.message}`);
    }

    // ---> NEW: Check if anything was actually deleted <---
    if (count === 0) {
      console.warn(`[delete-research] No research found with id ${researchId} for user ${user.id}, or deletion prevented (e.g., RLS).`);
      // Decide whether to return an error here or success (if 'not found' is also ok)
      // For now, we return a milder error message
      return new Response(JSON.stringify({ 
        warning: `Research with ID ${researchId} not found or could not be deleted.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, // Or 403 if RLS is more likely
      });
    }
    // ---> END NEW <---

    // 5. Return success response
    // console.log(`Research with ID ${researchId} deleted successfully.`);
    return new Response(JSON.stringify({ message: "Research successfully deleted!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // console.error("Error in delete-research function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error while deleting research.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 