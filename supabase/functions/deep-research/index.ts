// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import standard libraries if needed (e.g., for CORS)
import { corsHeaders } from "../_shared/cors.ts"
import { Perplexity } from "https://deno.land/x/perplexity_ai@0.1.0/mod.ts"; // Replaced $VERSION with 0.1.0
// import { supabaseAdmin } from "../_shared/supabaseAdmin.ts"; // Removed unused import

// console.log(`Function 'deep-research' up and running!`); // Verwijderd

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse the request body to get the query, description, contextQuery, and language preference
    const { query, description, contextQuery, languagePreference = 'nl', taskId } = await req.json();
    // const authHeader = req.headers.get("Authorization")!; // Removed unused variable

    // console.log(`Received research query: ${query}`); // Verwijderd

    if (!query || !taskId) {
      return new Response(
        JSON.stringify({ error: "Missing 'query' or 'taskId' in request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

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

    // [PLACEHOLDER] Check user payment status
    // console.log("[PLACEHOLDER] Checking user payment status (currently always true)..."); // Verwijderd
    const isPaidUser = true; // Assume true for now

    if (!isPaidUser) { 
      // Dit blok wordt nu overgeslagen.
      // console.warn("Access denied: Deep research is a paid feature."); // Verwijderd
      return new Response(
        JSON.stringify({ error: "Toegang geweigerd: Deze functie vereist een actief abonnement." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403, // Forbidden
        }
      );
    }
    // ---> EINDE Placeholder Check <---

    const perplexity = new Perplexity(perplexityApiKey);

    const researchResult = await perplexity.search(query, {
      model: "sonar-pro", // Or another suitable model like sonar-medium-online
      messages: [
        {
          role: "system",
          content: `You are an expert research assistant helping a user understand and execute a task or subtask in their project management workflow.

${contextQuery
  ? `The main task context is: "${contextQuery}". The specific subtask to research is: "${query}".`
  : `The task to research is: "${query}".`}

${description ? `Additional description provided: "${description}".` : ''}

Your goal is to provide a concise yet comprehensive research summary covering:
1.  **Key Concept Summary:** Explain the core ideas or background needed.
2.  **Potential Challenges or Considerations:** Highlight potential difficulties or important factors.
3.  **Actionable First Steps:** Suggest concrete initial actions the user can take.
4.  **(Optional) Relevant Resources:** Include links to high-quality articles, tools, or documentation if applicable and genuinely helpful.

Format your response clearly using Markdown.

**Respond in the following language: ${languagePreference}.**`
        },
        // Voeg een user message toe als laatste item, zoals vereist door Perplexity
        { role: "user", content: `Provide research based on the ${contextQuery ? `subtask: "${query}" (related to main task: "${contextQuery}")` : `task: "${query}"`}` }
      ],
      max_tokens: 1500
    });

    if (!researchResult.ok) {
      const errorBody = await researchResult.text();
      throw new Error(`Perplexity API error: ${researchResult.status} ${researchResult.statusText} - ${errorBody}`);
    }

    const result = await researchResult.json();
    
    // Declare a variable to hold the extracted content
    let finalContent: string = "Kon geen onderzoeksresultaten vinden."; 

    // Extract the content from the first assistant choice
    if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      // Assign to the new variable instead of the constant
      finalContent = result.choices[0].message.content;
    } else {
      // console.warn("Unexpected response structure from Perplexity (content):", result); // Verwijderd
      // finalContent behoudt de default waarde
    }

    // Extract citations if available
    let citations: string[] | undefined = undefined;
    if (result.citations && Array.isArray(result.citations)) {
      citations = result.citations.filter((c: unknown): c is string => typeof c === 'string');
      // console.log(`Extracted ${citations.length} citations.`); // Verwijderd
    } else {
      // console.log("No citations array found in Perplexity response."); // Verwijderd
    }

    const data = {
      // Use the new variable here
      researchResult: finalContent,
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
    // console.error("Error processing request:", error); // Verwijderd
    // Check if error is an instance of Error before accessing .message
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(
      JSON.stringify({ error: errorMessage }),
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