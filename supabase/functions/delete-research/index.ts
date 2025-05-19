/**
 * @fileoverview Supabase Edge Function to delete a saved research item.
 * This function authenticates the user, verifies the research item belongs to them,
 * and then deletes it from the `saved_research` table.
 */
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'
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

  // Logging variables
  let userIdForLogging: string | undefined;
  const functionNameForLogging = 'delete-research';
  let requestBodyForLogging: Record<string, unknown> = {};
  let supabaseClient; // Declare here to be accessible in final catch

  // Admin client for logging to user_api_logs
  let supabaseAdminLoggingClient: SupabaseClient | null = null;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseServiceRoleKey) {
    supabaseAdminLoggingClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceRoleKey
    );
  } else {
    console.warn("[delete-research] SUPABASE_SERVICE_ROLE_KEY not set. Logging to user_api_logs might be restricted by RLS.");
  }

  try {
    // 1. Create Supabase client with Auth context
    const authHeader = req.headers.get('Authorization')!;
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      // Create a new client with the user's token for RLS for the main operation
      { global: { headers: { Authorization: authHeader } } } 
    );

    // 2. Get user from Auth context
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    userIdForLogging = user?.id; // Assign userIdForLogging here

    if (userError || !user) {
      // Log an attempt if a user context was partially established or if it's an anonymous attempt
      if (supabaseClient && userIdForLogging) { // only log if client and user id is available
          const loggingClient = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
          await loggingClient.from('user_api_logs').insert({
              user_id: userIdForLogging,
              function_name: functionNameForLogging,
              metadata: { success: false, error: 'User not authorized', details: userError?.message },
          });
      }
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Parse request body to get the researchId
    let researchId: string | undefined;
    try {
      const body = await req.json();
      researchId = body.researchId;
      requestBodyForLogging = { researchId: researchId, userAgent: req.headers.get('user-agent') };
    } catch (parseError: unknown) {
      const loggingClient = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
      await loggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { success: false, error: 'Invalid JSON in request body', rawError: String(parseError), ...requestBodyForLogging },
      });
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!researchId || typeof researchId !== 'string') {
      const loggingClient = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
      await loggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { success: false, error: 'Missing or invalid researchId', ...requestBodyForLogging },
      });
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'researchId' in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }
    
    requestBodyForLogging = { researchId, userId: user.id }; // Update after validation

    // 4. Delete data from the saved_research table
    const { count, error: deleteError } = await supabaseClient
      .from('saved_research')
      .delete({ count: 'exact' })
      .eq('id', researchId)
      .eq('user_id', user.id); // Extra check: only delete if it belongs to the user

    console.log(`[delete-research] Attempted delete for researchId: ${researchId}, userId: ${user.id}. Result count: ${count}`);

    if (deleteError) {
      const loggingClient = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
      await loggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { success: false, error: `Database error: ${deleteError.message}`, researchId, dbErrorCode: deleteError.code, ...requestBodyForLogging },
      });
      throw new Error(`Database error: ${deleteError.message}`);
    }

    if (count === 0) {
      console.warn(`[delete-research] No research found with id ${researchId} for user ${user.id}, or deletion prevented (e.g., RLS).`);
      const loggingClient = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
      await loggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { success: false, warning: 'Research not found or not deleted', researchId, count, ...requestBodyForLogging },
      });
      return new Response(JSON.stringify({ 
        warning: `Research with ID ${researchId} not found or could not be deleted.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404, 
      });
    }

    // 5. Return success response & log
    const loggingClientForSuccess = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
    await loggingClientForSuccess.from('user_api_logs').insert({
      user_id: userIdForLogging,
      function_name: functionNameForLogging,
      metadata: { success: true, researchId, deletedCount: count, ...requestBodyForLogging },
    });
    // console.log(`Research with ID ${researchId} deleted successfully.`);
    return new Response(JSON.stringify({ message: "Research successfully deleted!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    // console.error("Error in delete-research function:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error while deleting research.";
    // Ensure supabaseClient is available for logging, might be uninitialized if error is early
    if (supabaseClient && userIdForLogging) {
        try {
            const loggingClient = supabaseAdminLoggingClient || supabaseClient; // Use admin client if available
            await loggingClient.from('user_api_logs').insert({
                user_id: userIdForLogging,
                function_name: functionNameForLogging,
                metadata: { success: false, error: 'Generic error in function', rawErrorMessage: errorMessage, ...requestBodyForLogging },
            });
        } catch (logError: unknown) {
            console.error('[delete-research] FAILED TO LOG TO user_api_logs:', logError instanceof Error ? logError.message : String(logError));
        }
    } else {
        console.error('[delete-research] Supabase client or user ID not available for error logging. Original error:', errorMessage);
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 