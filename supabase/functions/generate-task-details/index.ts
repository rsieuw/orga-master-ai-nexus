/**
 * @fileoverview Supabase Edge Function to generate task details (title, description, category, emoji)
 * based on user input using the OpenAI API.
 * It takes a simple user idea or query and a language preference, then prompts OpenAI
 * to return a structured JSON object with the generated task details.
 */

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Import Supabase client
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.52.7/mod.ts";

/**
 * Interface for the expected JSON response structure from the OpenAI API.
 * @interface OpenAIResponse
 * @property {string} title - The generated, concise, action-oriented task title.
 * @property {string} description - A more detailed description of the task.
 * @property {string} category - The suggested category for the task (e.g., "Werk/Studie", "Persoonlijk").
 * @property {string} emoji - A representative emoji for the task.
 */
interface OpenAIResponse {
  title: string;
  description: string;
  category: string; // Added: suggested category for the task
  emoji: string;    // Added: representative emoji for the task
}

/**
 * @typedef {Object} GenerateTaskDetailsRequestBody
 * @property {string} input - The user's raw idea or query for the task.
 * @property {'en' | 'nl'} [languagePreference='en'] - The preferred language for the generated task details.
 */

/**
 * Main Deno server function that handles incoming HTTP requests for generating task details.
 * - Handles CORS preflight requests.
 * - Retrieves the OpenAI API key from environment variables.
 * - Parses the request body for user input and language preference.
 * - Constructs a system prompt for OpenAI based on the language preference, instructing it to generate
 *   a title, description, category, and emoji for the task, and to respond in JSON format.
 * - Calls the OpenAI Chat Completions API (gpt-4o-mini by default) with the user input.
 * - Parses and validates the JSON response from OpenAI.
 * - Returns the generated task details (title, description, category, emoji) or an error response with an errorKey.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
// Use Deno.serve directly as in the original boilerplate
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  let userIdForLogging: string | undefined;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  let openaiModelUsed: string = "gpt-4o-mini"; // Default model for this function
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let totalTokens: number | undefined;
  let openAIError: { status?: number; message: string; body?: unknown } | null = null;
  let parsedOpenAIResponse: OpenAIResponse | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    userIdForLogging = user?.id;

    // 1. Get OpenAI API Key from secrets
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in Supabase secrets.");
      return new Response(
        JSON.stringify({ errorKey: "errors.api.configMissing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get user input and language preference from request body
    let userInput: string | undefined;
    let languagePreference: string = 'en'; // Default to English
    
    try {
       const body = await req.json();
       userInput = body?.input;
       if (body?.languagePreference) {
         languagePreference = body.languagePreference;
       }
       
       if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
          throw new Error("errors.request.invalidInput");
       }
    } catch (e) {
       console.error("Failed to parse request body or invalid input:", e);
       // If the error is already one of our keys, use that, otherwise a default key
       const key = (e instanceof Error && e.message === "errors.request.invalidInput") 
                   ? e.message 
                   : "errors.request.invalidBody";
       return new Response(
         JSON.stringify({ errorKey: key }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
    }

    // 3. Construct the prompt for OpenAI - Enhanced with emoji and category generation
    // Adjust the system prompt based on language preference
    const systemPrompt = languagePreference === 'nl' 
      ? `Je bent een assistent die helpt bij het formuleren van taken. Op basis van de input van de gebruiker:
         1. Genereer een beknopte, actie-gerichte taak 'title' (maximaal 10 woorden)
         2. Maak een gedetailleerdere 'description' (maximaal 2 zinnen)
         3. Kies automatisch de meest toepasselijke 'category' uit ["Werk/Studie", "Persoonlijk", "Huishouden", "Familie", "Sociaal", "Gezondheid", "Financiën", "Projecten"]
         4. Selecteer een passende 'emoji' die specifiek is voor de taak (kleurrijk en duidelijk zichtbaar)
         
         Het antwoord MOET een geldig JSON-object zijn met de sleutels "title", "description", "category" en "emoji".
         
         Voorbeelden:
         - Voor een vergadering: { "title": "Kwartaal-vergadering voorbereiden", "description": "Maak slides en agenda voor de kwartaalvergadering van volgende week. Verzamel cijfers van alle afdelingen.", "category": "Werk/Studie", "emoji": "��" }
         - Voor een verjaardag: { "title": "Verjaardagscadeau voor mama kopen", "description": "Zoek een leuk boek of sieraad voor mama's verjaardag op 15 mei. Budget: €50.", "category": "Familie", "emoji": "🎁" }
         - Voor sporten: { "title": "Sportschoolabonnement verlengen", "description": "Bezoek de sportschool om het jaarabonnement te verlengen. Vraag naar speciale acties.", "category": "Gezondheid", "emoji": "🏋️" }`
      : `You are an assistant that helps formulate tasks. Based on the user's input:
         1. Generate a concise, action-oriented task 'title' (maximum 10 words)
         2. Create a more detailed 'description' (maximum 2 sentences)
         3. Automatically select the most appropriate 'category' from ["Werk/Studie", "Persoonlijk", "Huishouden", "Familie", "Sociaal", "Gezondheid", "Financiën", "Projecten"]
         4. Choose a fitting 'emoji' that is specific to the task (colorful and clearly visible)
         
         The response MUST be a valid JSON object with the keys "title", "description", "category", and "emoji".
         
         Examples:
         - For a meeting: { "title": "Prepare quarterly meeting", "description": "Create slides and agenda for next week's quarterly meeting. Gather figures from all departments.", "category": "Work/Study", "emoji": "📊" }
         - For a birthday: { "title": "Buy birthday gift for mom", "description": "Find a nice book or jewelry for mom's birthday on May 15th. Budget: €50.", "category": "Family", "emoji": "🎁" }
         - For exercise: { "title": "Renew gym membership", "description": "Visit the gym to renew the annual membership. Ask about special offers.", "category": "Health", "emoji": "🏋️" }`;

    const userPrompt = `User input: "${userInput}"`;

    // 4. Call OpenAI API (Chat Completions)
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    let chatCompletionUsage;

    try {
    const chatCompletion = await openai.chat.completions.create({
        model: openaiModelUsed,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 150,
      });

      chatCompletionUsage = chatCompletion.usage;
      promptTokens = chatCompletionUsage?.prompt_tokens;
      completionTokens = chatCompletionUsage?.completion_tokens;
      totalTokens = chatCompletionUsage?.total_tokens;
      openaiModelUsed = chatCompletion.model || openaiModelUsed; // Update if model in response

    const aiResponse = chatCompletion.choices?.[0]?.message?.content;

    if (!aiResponse) {
        openAIError = { message: "errors.ai.noUsableAnswer", body: chatCompletion };
      console.error("OpenAI response did not contain expected content:", chatCompletion);
        // Don't throw yet, log first
      } else {
        // Attempt to parse and validate immediately after successful OpenAI call
        try {
          const tempParsed = JSON.parse(aiResponse) as OpenAIResponse; // Parse first
          // Now validate the parsedResponse structure
      if (
            typeof tempParsed.title === 'string' && 
            typeof tempParsed.description === 'string' &&
            typeof tempParsed.category === 'string' &&
            typeof tempParsed.emoji === 'string'
      ) {
            parsedOpenAIResponse = tempParsed; // Assign if valid
          } else {
              openAIError = { message: "errors.ai.invalidJson", body: aiResponse };
              console.error("OpenAI response JSON structure invalid:", aiResponse);
              // parsedOpenAIResponse remains null
      }
    } catch (e) {
          openAIError = { message: "errors.ai.processingFailed", body: aiResponse };
          console.error("Failed to parse OpenAI JSON response for logging:", aiResponse, e);
          parsedOpenAIResponse = null; // Clear if parsing failed
        }
      }
    } catch (e: unknown) { // Explicitly type e as unknown
        console.error("OpenAI API call failed:", e);
        const status = (typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).status === 'number')
            ? (e as Record<string, unknown>).status as number
            : undefined;

        openAIError = { 
            message: e instanceof Error ? e.message : "errors.ai.apiCallFailed", 
            status // Use the derived status
        };
    }
    
    // Log external API call (OpenAI)
    try {
      await supabase.from('external_api_usage_logs').insert({
        user_id: userIdForLogging,
        // task_id: null, // No specific task_id for initial generation
        service_name: 'OpenAI',
        function_name: 'chatCompletionsCreate', // More specific function
        tokens_prompt: promptTokens,
        tokens_completion: completionTokens,
        tokens_total: totalTokens,
        // cost: calculateCost(...), // Implement if needed
        metadata: { 
          model: openaiModelUsed,
          languagePreference,
          success: !openAIError, 
          error: openAIError ? openAIError : undefined,
          // response_id: chatCompletion.id, // If available and needed
        },
      });
    } catch (logError) {
      console.error('Failed to log to external_api_usage_logs', logError);
    }

    // If OpenAI call or parsing failed, throw to be caught by the main catch block
    if (openAIError) {
      const errorKey = openAIError.message.startsWith("errors.") ? openAIError.message : "errors.ai.apiCallFailed";
      return new Response(JSON.stringify({ errorKey: errorKey, details: openAIError.body || openAIError.message }), { status: openAIError.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!parsedOpenAIResponse) { // Should be redundant if openAIError is handled
        const errorKey = "errors.ai.processingFailed";
        return new Response(JSON.stringify({ errorKey: errorKey, details: "Failed to get valid structured data from AI." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    
    return new Response(
      JSON.stringify(parsedOpenAIResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    const err = error as Error;
    console.error("[generate-task-details] Main catch error:", err);
    const errorKeyForCatch = err.message.startsWith("errors.") ? err.message : "errors.internalServerError";
    return new Response(JSON.stringify({ errorKey: errorKeyForCatch, details: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});
