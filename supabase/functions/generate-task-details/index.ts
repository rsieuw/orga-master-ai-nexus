// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Removed import for serve
import { corsHeaders } from "../_shared/cors.ts"; // Keep CORS headers import
import { OpenAI } from "https://deno.land/x/openai@v4.52.7/mod.ts";

// Interface for the expected JSON response from OpenAI
interface OpenAIResponse {
  title: string;
  description: string;
}

// console.log("Hello from generate-task-details Function!"); // Verwijderd

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

    // 3. Construct the prompt for OpenAI
    // Adjust the system prompt based on language preference
    const systemPrompt = languagePreference === 'nl' 
      ? `Je bent een assistent die helpt bij het formuleren van taken. Op basis van de input van de gebruiker, genereer je een beknopte, actie-gerichte taak 'title' (maximaal 10 woorden) en een iets gedetailleerdere 'description' (maximaal 3 zinnen). Het antwoord MOET een geldig JSON-object zijn met alleen de sleutels "title" en "description". Voorbeelden: { "title": "Teamlunch organiseren", "description": "Plan een teamlunch voor volgende vrijdag. Zoek een restaurant en stuur een uitnodiging." }`
      : `You are an assistant that helps formulate tasks. Based on the user's input, generate a concise, action-oriented task 'title' (maximum 10 words) and a slightly more detailed 'description' (maximum 3 sentences). The response MUST be a valid JSON object with only the keys "title" and "description". Example: { "title": "Organize team lunch", "description": "Plan a team lunch for next Friday. Find a restaurant and send an invitation." }`;

    const userPrompt = `User input: "${userInput}"`;

    // 4. Call OpenAI API (Chat Completions)
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    // console.log(`Calling OpenAI API for input: "${userInput}"`); // Verwijderd
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
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

    // 5. Parse and validate the response
    let generatedData: OpenAIResponse;
    try {
      generatedData = JSON.parse(aiResponse);
      // Basic validation
      if (typeof generatedData.title !== 'string' || typeof generatedData.description !== 'string') {
          throw new Error("errors.ai.invalidJson"); // Key as message
      }
    } catch (e) {
      console.error("Failed to parse OpenAI JSON response:", aiResponse, e);
      const key = (e instanceof Error && e.message === "errors.ai.invalidJson") 
                  ? e.message 
                  : "errors.ai.processingFailed";
      throw new Error(key); // Key as message
    }

    // console.log(`OpenAI generated:`, generatedData); // Verwijderd

    // 6. Return the generated title and description
    return new Response(
      JSON.stringify(generatedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // console.error("Error in generate-task-details:", error); // Keep or remove server-side logging if necessary
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
      // Note: errors.api.configMissing and errors.request.invalidBody worden al direct met JSON.stringify({ errorKey: ... }) afgehandeld.
    }
    return new Response(JSON.stringify({ errorKey: errorKey }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
