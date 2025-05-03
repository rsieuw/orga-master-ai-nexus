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
    // Parse the request body to get the query, description, and language preference
    const { query, description, languagePreference = 'nl' } = await req.json();

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

    // Declareer variabelen vóór de try-catch
    let researchResult = "Kon geen onderzoeksresultaten vinden.";
    let citations: string[] | undefined = undefined;

    // --- Vertaalde Koppen --- 
    let headers = {
      summary: "Key Concept Summary",
      challenges: "Potential Challenges or Considerations",
      steps: "Actionable First Steps",
      resources: "Relevant Resources (Optional)"
    };
    if (languagePreference === 'nl') {
      headers = {
        summary: "Kernconcept Samenvatting",
        challenges: "Mogelijke Uitdagingen of Overwegingen",
        steps: "Concrete Eerste Stappen",
        resources: "Relevante Bronnen (Optioneel)"
      };
    }
    // --- Einde Vertaalde Koppen ---

    // --- Perplexity API call ---
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
            {
              role: "system",
              content: `You are an expert research assistant helping a user understand and execute a task in their project management workflow.

Task Title: "${query}"
Task Description: "${description || 'No description provided.'}"

Based on your search results and understanding of the core topic, provide a structured and practical response to help the user move forward with this task. Your response should include the following sections:

1.  **${headers.summary}** – Briefly explain the main topic or concept behind the task in simple terms.
2.  **${headers.challenges}** – Identify common pitfalls, dependencies, or factors the user should watch out for. **Use markdown bullet points (e.g., \`- Challenge one\`) for each item.**
3.  **${headers.steps}** – List 2–4 clear and specific actions the user can take right away to begin working on the task. **Use markdown numbered list format (e.g., \`1. Step one\`) for each step.**
4.  **${headers.resources}** – If applicable, suggest one or two high-quality resources (articles, tools, or references) that directly support this task. **Format these as markdown links: \`[Resource Title](URL)\`**. 

Keep your response concise, practical, and focused on helping the user make meaningful progress within their project.

**Respond in the following language: ${languagePreference}.**`
            },
            // Voeg een user message toe als laatste item, zoals vereist door Perplexity
            { role: "user", content: `Provide research based on the task: "${query}"` }
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
        console.warn("Unexpected response structure from Perplexity (content):", result);
      }

      // Extract citations if available
      if (result.citations && Array.isArray(result.citations)) {
        citations = result.citations.filter((c: unknown): c is string => typeof c === 'string');
        console.log(`Extracted ${citations.length} citations.`);
      } else {
        console.log("No citations array found in Perplexity response.");
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
      citations: citations
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
    --data '{"query":"Your research topic here", "description":"Optional description", "languagePreference":"en"}'

*/