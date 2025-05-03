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
    // Parse the request body to get the query, description, contextQuery, and language preference
    const { query, description, contextQuery, languagePreference = 'nl' } = await req.json();

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

    // ---> TOEKOMSTIGE CHECK: Betaalde Functie Toegangscontrole <---
    // TODO: Implementeer hier de logica om te checken of de gebruiker een betaald abonnement heeft.
    // Bijvoorbeeld: haal user op met req.headers.get('Authorization')!, 
    // check tegen een 'subscriptions' tabel.
    const isPaidUser = true; // Placeholder: later vervangen door echte check
    console.log("[PLACEHOLDER] Checking user payment status (currently always true)...");

    if (!isPaidUser) { 
      // Dit blok wordt nu overgeslagen.
      console.warn("Access denied: Deep research is a paid feature.");
      return new Response(
        JSON.stringify({ error: "Toegang geweigerd: Deze functie vereist een actief abonnement." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403, // Forbidden
        }
      );
    }
    // ---> EINDE Placeholder Check <---

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
              content: `You are an expert research assistant helping a user understand and execute a task or subtask in their project management workflow.

${contextQuery 
  ? `Main Task Title: \"${contextQuery}\"\nSubtask to Research: \"${query}\"` 
  : `Task Title: \"${query}\"\nTask Description: \"${description || 'No description provided.'}\"`
}

Based on your search results and understanding of the core topic (${contextQuery ? 'the subtask "' + query + '" in the context of the main task' : 'the task "' + query + '"'}), provide a structured and practical response to help the user move forward. Your response should include the following sections:

1.  **${headers.summary}** – Briefly explain the main topic or concept behind the task/subtask in simple terms.
2.  **${headers.challenges}** – Identify common pitfalls, dependencies, or factors the user should watch out for. **Use markdown bullet points (e.g., \`- Challenge one\`) for each item.**
3.  **${headers.steps}** – List at least 4 clear and specific actions the user can take right away to begin working on the task/subtask. **Start EACH step STRICTLY with a number followed by a period and a space (e.g., \`1. Step one\`, \`2. Step two\`). Do NOT use bold text or other formatting at the beginning of the step itself.**
4.  **${headers.resources}** – If applicable, suggest one or two high-quality resources (articles, tools, or references) that directly support this task/subtask. **Format these as markdown links: \`[Resource Title](URL)\`**. 

Provide a comprehensive and detailed response, practical, and focused on helping the user make meaningful progress within their project.

**Respond in the following language: ${languagePreference}.**`
            },
            // Voeg een user message toe als laatste item, zoals vereist door Perplexity
            { role: "user", content: `Provide research based on the ${contextQuery ? 'subtask: "' + query + '" (related to main task: "' + contextQuery + '")' : 'task: "' + query + '"'}` }
          ],
          max_tokens: 1500 
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