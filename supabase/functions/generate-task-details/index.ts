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

// Removed import for serve
import { corsHeaders } from "../_shared/cors.ts"; // Keep CORS headers import
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

  try {
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
       userInput = body?.input; // Expecting { "input": "user's idea..." }
       
       // Get language preference if provided
       if (body?.languagePreference) {
         languagePreference = body.languagePreference;
       }
       
       if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
          throw new Error("errors.request.invalidInput"); // Key as message
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
         - Voor een vergadering: { "title": "Kwartaal-vergadering voorbereiden", "description": "Maak slides en agenda voor de kwartaalvergadering van volgende week. Verzamel cijfers van alle afdelingen.", "category": "Werk/Studie", "emoji": "📊" }
         - Voor een verjaardag: { "title": "Verjaardagscadeau voor mama kopen", "description": "Zoek een leuk boek of sieraad voor mama's verjaardag op 15 mei. Budget: €50.", "category": "Familie", "emoji": "🎁" }
         - Voor sporten: { "title": "Sportschoolabonnement verlengen", "description": "Bezoek de sportschool om het jaarabonnement te verlengen. Vraag naar speciale acties.", "category": "Gezondheid", "emoji": "🏋️" }`
      : `You are an assistant that helps formulate tasks. Based on the user's input:
         1. Generate a concise, action-oriented task 'title' (maximum 10 words)
         2. Create a more detailed 'description' (maximum 2 sentences)
         3. Automatically select the most appropriate 'category' from ["Werk/Studie", "Persoonlijk", "Huishouden", "Familie", "Sociaal", "Gezondheid", "Financiën", "Projecten"]
         4. Choose a fitting 'emoji' that is specific to the task (colorful and clearly visible)
         
         The response MUST be a valid JSON object with the keys "title", "description", "category", and "emoji".
         
         Examples:
         - For a meeting: { "title": "Prepare quarterly meeting", "description": "Create slides and agenda for next week's quarterly meeting. Gather figures from all departments.", "category": "Werk/Studie", "emoji": "📊" }
         - For a birthday: { "title": "Buy birthday gift for mom", "description": "Find a nice book or jewelry for mom's birthday on May 15th. Budget: €50.", "category": "Familie", "emoji": "🎁" }
         - For exercise: { "title": "Renew gym membership", "description": "Visit the gym to renew the annual membership. Ask about special offers.", "category": "Gezondheid", "emoji": "🏋️" }`;

    const userPrompt = `User input: "${userInput}"`;

    // 4. Call OpenAI API (Chat Completions)
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // Request JSON output directly if model supports it
      response_format: { type: "json_object" },
      temperature: 0.5, // Lower temperature for more deterministic results
      max_tokens: 150, // Limit response length
    });

    const aiResponse = chatCompletion.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error("OpenAI response did not contain expected content:", chatCompletion);
      throw new Error("errors.ai.noUsableAnswer"); // Key as message
    }

    // 5. Parse and validate the response - Updated to include emoji and category
    let generatedData: OpenAIResponse;
    try {
      generatedData = JSON.parse(aiResponse);
      // Enhanced validation for all fields
      if (
        typeof generatedData.title !== 'string' || 
        typeof generatedData.description !== 'string' ||
        typeof generatedData.category !== 'string' ||
        typeof generatedData.emoji !== 'string'
      ) {
          throw new Error("errors.ai.invalidJson"); // Key as message
      }
    } catch (e) {
      console.error("Failed to parse OpenAI JSON response:", aiResponse, e);
      const key = (e instanceof Error && e.message === "errors.ai.invalidJson") 
                  ? e.message 
                  : "errors.ai.processingFailed";
      throw new Error(key); // Key as message
    }

    // 6. Return the generated title, description, category and emoji
    return new Response(
      JSON.stringify(generatedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    let errorKey = "errors.internal.generateTaskDetails"; // Default fallback key
    if (error instanceof Error) {
      // Check if the message is already one of our defined keys
      const knownKeys = [
        "errors.request.invalidInput", 
        "errors.ai.noUsableAnswer", 
        "errors.ai.invalidJson", 
        "errors.ai.processingFailed"
      ];
      if (knownKeys.includes(error.message)) {
        errorKey = error.message;
      }
      // Note: errors.api.configMissing and errors.request.invalidBody are already handled directly with JSON.stringify({ errorKey: ... }).
    }
    return new Response(JSON.stringify({ errorKey: errorKey }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
