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

  try {
    // 1. Create Supabase client with Auth context
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient: SupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Get user from Auth context
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User authentication error:", userError);
      return new Response(JSON.stringify({ errorKey: 'errors.unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 3. Parse request body
    const { taskId, researchContent, citations, subtaskTitle, prompt } = await req.json();
    
    if (!taskId || typeof taskId !== 'string') {
      return new Response(JSON.stringify({ error: "Missing or invalid 'taskId'" }), { status: 400, headers: corsHeaders });
    }
    if (typeof researchContent !== 'string') { 
        return new Response(JSON.stringify({ error: "Missing or invalid 'researchContent'" }), { status: 400, headers: corsHeaders });
    }
    // Optional: Add more validation for other fields like citations, subtaskTitle, prompt if needed

    // 4. Insert data into the saved_research table
    const { data: savedData, error: insertError } = await supabaseClient
      .from('saved_research')
      .insert({
        task_id: taskId,
        user_id: user.id,
        research_content: researchContent,
        citations: citations, // Ensure this matches your DB schema (e.g., jsonb or text[])
        subtask_title: subtaskTitle || null,
        prompt: prompt || null // Added prompt to insert
      })
      .select('id') // Select the ID of the new row
      .single(); // Expect a single result

    if (insertError) {
      console.error("Error inserting saved research:", insertError);
      throw insertError; // Let the generic error handler catch it
    }

    if (!savedData || !savedData.id) {
      console.error("Failed to retrieve ID after inserting saved research");
      throw new Error("errors.research.idRetrievalFailed");
    }

    // 5. Return success response, including the new ID
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
      } else if (error.name === 'AuthApiError') { // Example for specific Supabase errors
        errorKey = "errors.unauthorized"; // Or a more specific key
      } else if (error.message.includes("unique constraint")) { // Example for DB constraint errors
        errorKey = "errors.request.duplicateEntry"; // Define this key in your translations
      }
      // Log the actual error message for server-side debugging
      console.error("Caught error in save-research function:", error.message);
    }
    return new Response(JSON.stringify({ errorKey: errorKey, message: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, // Or a more appropriate status code based on the error
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}); 