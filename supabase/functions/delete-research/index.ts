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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let supabaseClient;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) { // Expliciet controleren op null of undefined
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } } 
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("[delete-research] User authentication failed:", userError);
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    let researchId: string | undefined;
    try {
      const body = await req.json();
      researchId = body.researchId;
    } catch (parseError: unknown) {
      console.error("[delete-research] Error parsing JSON request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!researchId || typeof researchId !== 'string') {
      console.warn(`[delete-research] Missing or invalid researchId for user ${user.id}. Received:`, researchId);
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'researchId' in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
    
    const { count, error: deleteError } = await supabaseClient
      .from('saved_research')
      .delete({ count: 'exact' })
      .eq('id', researchId)
      .eq('user_id', user.id);

    console.log(`[delete-research] Attempted delete for researchId: ${researchId}, userId: ${user.id}. Result count: ${count}`);

    if (deleteError) {
      console.error(`[delete-research] Database error for user ${user.id}, researchId ${researchId}:`, deleteError);
      // Gooi de error opnieuw zodat het generieke catch block het afhandelt
      throw new Error(`Database error during delete: ${deleteError.message}`); 
    }

    if (count === 0) {
      console.warn(`[delete-research] No research found with id ${researchId} for user ${user.id}, or deletion prevented (e.g., RLS or item does not exist).`);
      return new Response(JSON.stringify({ 
        warning: `Research with ID ${researchId} not found for this user or could not be deleted.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, 
      });
    }

    return new Response(JSON.stringify({ message: "Research successfully deleted!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    console.error("[delete-research] Generic error in function execution:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error while deleting research.";
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 