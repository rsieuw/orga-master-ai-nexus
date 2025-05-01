// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Removed import for serve
import { corsHeaders } from "../_shared/cors.ts"; // Keep CORS headers import

// Interface for the expected JSON response from OpenAI
interface OpenAIResponse {
  title: string;
  description: string;
}

console.log("Hello from generate-task-details Function!");

// Use Deno.serve directly as in the original boilerplate
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Get OpenAI API Key from secrets
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
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
    const openaiUrl = "https://api.openai.com/v1/chat/completions";
    const model = "gpt-3.5-turbo"; // Or consider gpt-4o-mini for potentially lower cost/latency

    console.log(`Calling OpenAI API for input: "${userInput}"`);

    const openaiResponse = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        // Request JSON output directly if model supports it
        response_format: { type: "json_object" },
        temperature: 0.5, // Lower temperature for more deterministic results
        max_tokens: 150, // Limit response length
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      console.error(`OpenAI API error (${openaiResponse.status}):`, errorBody);
      throw new Error(`Fout bij communicatie met AI service (${openaiResponse.status}).`);
    }

    const result = await openaiResponse.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      console.error("OpenAI response did not contain expected content:", result);
      throw new Error("AI service gaf geen bruikbaar antwoord.");
    }

    // 5. Parse the AI's JSON response
    let generatedData: OpenAIResponse;
    try {
      generatedData = JSON.parse(content);
      // Basic validation
      if (typeof generatedData.title !== 'string' || typeof generatedData.description !== 'string') {
          throw new Error("Ongeldig JSON formaat van AI.");
      }
    } catch (e) {
      console.error("Failed to parse OpenAI JSON response:", content, e);
      throw new Error("Kon het antwoord van de AI service niet verwerken.");
    }

    console.log(`OpenAI generated:`, generatedData);

    // 6. Return the generated title and description
    return new Response(
      JSON.stringify(generatedData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in Edge Function:", error);
  return new Response(
      JSON.stringify({ error: error.message || "Er is een onverwachte fout opgetreden." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
