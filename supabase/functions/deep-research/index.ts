// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import standard libraries if needed (e.g., for CORS)
import { corsHeaders } from "../_shared/cors.ts"

console.log(`Function 'deep-research' up and running!`);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body to get the query
    const { query } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing 'query' in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    console.log(`Received research query: ${query}`);

    // Retrieve Perplexity API key from secrets
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: "Perplexity API key not set in Supabase secrets." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    const perplexityUrl = "https://api.perplexity.ai/chat/completions";

    // --- Perplexity API call ---
    let researchResult = "Kon geen onderzoeksresultaten vinden."; // Default value
    try {
      const response = await fetch(perplexityUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${perplexityApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro", // Or another suitable model like sonar-medium-online
          messages: [
            { role: "system", content: "Provide a concise and informative answer based on your search results." },
            { role: "user", content: query },
          ],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result = await response.json();
      
      // Extract the content from the first assistant choice
      if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
        researchResult = result.choices[0].message.content;
      } else {
        console.warn("Unexpected response structure from Perplexity:", result);
      }

    } catch (apiError) {
      console.error("Error calling Perplexity API:", apiError);
      // Return the API error message to the client for more specific feedback
      return new Response(
        JSON.stringify({ error: `Failed to get research result: ${apiError.message}` }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 502 // Bad Gateway might be appropriate here
        }
      );
    }
    // ---

    const data = {
      researchResult: researchResult,
    };

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/deep-research' \
    --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
    --header 'Content-Type: application/json' \
    --data '{"query":"Your research topic here"}'

*/
