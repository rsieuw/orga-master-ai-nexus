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
        JSON.stringify({ error: "Interne serverfout: API configuratie ontbreekt." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get user input from request body
    let userInput: string | undefined;
    try {
       const body = await req.json();
       userInput = body?.input; // Expecting { "input": "user's idea..." }
       if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
          throw new Error("Ongeldige of ontbrekende 'input' in request body.");
       }
    } catch (e) {
       console.error("Failed to parse request body or invalid input:", e);
       return new Response(
         JSON.stringify({ error: e.message || "Ongeldige request body." }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
    }


    // 3. Construct the prompt for OpenAI
    const systemPrompt = `Je bent een assistent die helpt bij het formuleren van taken. Gebaseer op de input van de gebruiker, genereer een beknopte, actiegerichte taak 'title' (maximaal 10 woorden) en een iets gedetailleerdere 'description' (maximaal 3 zinnen). De response MOET een geldig JSON object zijn met alleen de keys "title" en "description". Voorbeeld: { "title": "Teamlunch organiseren", "description": "Plan een teamlunch voor volgende week vrijdag. Zoek een restaurant en stuur een uitnodiging." }`;

    const userPrompt = `Gebruikersinput: "${userInput}"`;

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
      throw new Error("AI service gaf geen bruikbaar antwoord.");
    }

    // 5. Parse and validate the response
    let generatedData: OpenAIResponse;
    try {
      generatedData = JSON.parse(aiResponse);
      // Basic validation
      if (typeof generatedData.title !== 'string' || typeof generatedData.description !== 'string') {
          throw new Error("Ongeldig JSON formaat van AI.");
      }
    } catch (e) {
      console.error("Failed to parse OpenAI JSON response:", aiResponse, e);
      // Type check for error message
      const errorMessage = e instanceof Error ? e.message : "Kon het antwoord van de AI service niet verwerken.";
      throw new Error(errorMessage);
    }

    // console.log(`OpenAI generated:`, generatedData); // Verwijderd

    // 6. Return the generated title and description
    return new Response(
      JSON.stringify(generatedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    // console.error("Error in generate-task-details:", error); // Behoud of verwijder server-side logging indien nodig
    // Type check for error message
    const errorMessage = error instanceof Error ? error.message : "Interne serverfout bij genereren taakdetails";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-task-details' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
