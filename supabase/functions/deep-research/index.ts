// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import standard libraries if needed (e.g., for CORS)
import { corsHeaders } from "../_shared/cors.ts"

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let languagePreference = 'nl'; // Declare with default here

  try {
    // Parse the request body to get the query, description, contextQuery, and language preference
    // Assign to the higher-scoped languagePreference
    const { query, description, contextQuery, languagePreference: reqLanguagePreference, taskId } = await req.json();
    if (reqLanguagePreference) {
      languagePreference = reqLanguagePreference;
    }

    if (!query || !taskId) {
      return new Response(
        JSON.stringify({ errorKey: "deepResearch.error.missingQueryOrTaskId" }),
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
        JSON.stringify({ errorKey: "deepResearch.error.perplexityApiKeyNotSet" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    // [PLACEHOLDER] Check user payment status
    const isPaidUser = true; // Assume true for now

    if (!isPaidUser) { 
      return new Response(
        JSON.stringify({ errorKey: "deepResearch.error.paidFeature" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 // Forbidden
        }
      );
    }
    
    // ---> MODIFICATION: Rebuild systemContent string step-by-step <---
    let systemContent = `You are an expert research assistant.
The user wants a thorough investigation.

**Research Topic:** ${query}
`;

    if (contextQuery) {
      systemContent += `**Main Task Context:** ${contextQuery}
`;
    }
    if (description) {
      systemContent += `**Additional Description:** ${description}
`;
    }

    systemContent += `
**Instructions for the research output:**
Please provide a comprehensive overview addressing the following points. Adapt the level of detail for a general user, focusing on practically applicable information.
1. Optimal approach and methodology for this specific task.
2. Necessary tools, resources, or techniques.
3. Step-by-step instructions for effective execution.
4. Time-saving strategies and best practices.
5. Common challenges and solutions.
6. Relevant experts or sources for further exploration.

Respond in ${languagePreference === 'nl' ? 'Dutch' : 'English'}.`;
    // ---> END MODIFICATION <---

    const messages = [
        {
          role: "system",
        content: systemContent // Use the rebuilt string
      },
      {
        role: "user",
        content: query, 
      },
    ];

    // ---> MODIFICATION: Use fetch to call Perplexity API directly <---
    const perplexityApiResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey}`
      },
      body: JSON.stringify({
        model: "sonar-pro", 
        messages: messages,
        // max_tokens: 1500 // Optional: Add if needed, based on API docs
      })
    });

    if (!perplexityApiResponse.ok) {
      const errorBody = await perplexityApiResponse.text();
      console.error(`Perplexity API error: ${perplexityApiResponse.status} ${perplexityApiResponse.statusText} - ${errorBody}`);
      // Return a structured error that the client can use with a key
      throw new Error("deepResearch.error.perplexityApiError"); 
    }

    const result = await perplexityApiResponse.json();
    // ---> END MODIFICATION <---

    let finalContent = "";
    if (result && result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
      finalContent = result.choices[0].message.content;
    } else {
      // If no content, use the messageKey for "could not find results"
      return new Response(
        JSON.stringify({ messageKey: "deepResearch.message.couldNotFindResults" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500, // Internal Server Error or appropriate error for failed API call
        }
      );
    }

    // Extract citations if available
    let citations: string[] | undefined = undefined;
    if (result && result.citations && Array.isArray(result.citations)) {
      citations = result.citations.filter((c: unknown): c is string => typeof c === 'string');
    }

    const data = {
      // Use the new variable here. It will be either the string content or the object with messageKey
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
    console.error("Error in deep-research function:", error);
    // Determine the error message based on languagePreference, ensuring it's defined
    const errorMessage = error instanceof Error ? error.message : (languagePreference === 'nl' ? "Er is een onbekende fout opgetreden." : "An unknown error occurred.");
    // If the error is an instance of Error, pass its message directly.
    // Otherwise, use a generic key based on languagePreference.
    const errorKey = error instanceof Error ? undefined : "deepResearch.error.unknownError";
    const errorBody = errorKey ? { errorKey } : { error: errorMessage };

    return new Response(
      JSON.stringify(errorBody),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500,
      }
    );
  }
});