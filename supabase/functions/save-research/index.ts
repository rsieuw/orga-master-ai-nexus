/**
 * @fileoverview Supabase Edge Function to save research content associated with a task.
 * This function authenticates the user, validates the input (taskId, researchContent),
 * and inserts the research data into the `saved_research` table.
 * It returns the ID of the newly saved research item.
 */
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts";

/**
 * @typedef {Object} SaveResearchRequestBody
 * @property {string} taskId - The ID of the task to which this research is related.
 * @property {string} researchContent - The main content of the research.
 * @property {Array<Object>} [citations] - Optional array of citation objects (structure depends on DB schema).
 * @property {string} [subtaskTitle] - Optional title of a specific subtask this research might be for.
 * @property {string} [prompt] - Optional original prompt that led to this research.
 */

// Define CORS headers directly for simplicity
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Adjust in production!
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

/**
 * Main Deno server function that handles incoming HTTP requests to save research.
 * - Handles CORS preflight requests.
 * - Authenticates the user using the Authorization header.
 * - Parses the request body for `taskId`, `researchContent`, and optional `citations`, `subtaskTitle`, `prompt`.
 * - Validates that `taskId` and `researchContent` are provided and are strings.
 * - Inserts the research data into the `saved_research` table, associated with the user and task.
 * - Returns a success response with a messageKey and the `savedResearchId` or an error response with an errorKey.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  let supabaseAdminLoggingClient: SupabaseClient | null = null;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseServiceRoleKey) {
    supabaseAdminLoggingClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceRoleKey
    );
  } else {
    console.warn("[save-research] SUPABASE_SERVICE_ROLE_KEY not set. Logging might be restricted.");
  }

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("User not authenticated", authError);
      return new Response(JSON.stringify({ errorKey: 'errors.unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const requestBody = await req.json();
    const { taskId, researchContent, citations, subtaskTitle, prompt } = requestBody;
    
    if (!taskId || typeof taskId !== 'string') {
      throw new Error("Missing or invalid 'taskId'");
    }
    if (typeof researchContent !== 'string') { 
        throw new Error("Missing or invalid 'researchContent'");
    }

    const { data: savedData, error: insertError } = await supabase
      .from('saved_research')
      .insert({
        task_id: taskId,
        user_id: user.id,
        research_content: researchContent,
        citations: citations, 
        subtask_title: subtaskTitle || null,
        prompt: prompt || null 
      })
      .select('id') 
      .single(); 

    if (insertError) {
      console.error("Error inserting saved research:", insertError);
      throw insertError; 
    }

    if (!savedData || !savedData.id) {
      console.error("Failed to retrieve ID after inserting saved research");
      throw new Error("errors.research.idRetrievalFailed");
    }

    return new Response(
      JSON.stringify({ messageKey: "success.researchSaved", savedResearchId: savedData.id }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    let errorKey = "errors.internalServerError"; 
    if (error instanceof Error) {
      if (error.message === "errors.research.idRetrievalFailed") {
        errorKey = error.message;
      } else if (error.name === 'AuthApiError') { 
        errorKey = "errors.unauthorized"; 
      } else if (error.message.includes("unique constraint")) { 
        errorKey = "errors.request.duplicateEntry"; 
      }
      console.error("Caught error in save-research function:", error.message);
    }

    return new Response(JSON.stringify({ errorKey: errorKey, message: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 