import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
// Import OpenAI library (assuming deno port or compatibility)
// Example: import OpenAI from 'https://deno.land/x/openai/mod.ts'; 
// Or use fetch directly

console.log("generate-chat-response function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from request
    const { query, mode, taskId, chatHistory } = await req.json();
    console.log(`Received query: ${query}, mode: ${mode}, taskId: ${taskId}, history length: ${chatHistory?.length || 0}`);

    if (!query) {
      throw new Error("Query is required");
    }
    if (!mode) {
      throw new Error("Mode is required");
    }

    // 2. Load API Key (MUST be set in Supabase secrets)
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }
    
    // --- TODO: Initialize OpenAI Client ---
    // const openai = new OpenAI({ apiKey }); // Example

    // 3. Determine parameters based on mode
    let systemPrompt = "You are a helpful assistant focusing on task management.";
    let temperature = 0.5; // Default temperature

    switch (mode) {
      case 'precise':
        systemPrompt = "You are a precise and factual assistant. Stick strictly to the information provided or known facts related to the task context. Avoid speculation or overly creative language.";
        temperature = 0.2;
        console.log("Using Precise Mode settings");
        break;
      case 'creative':
        systemPrompt = "You are a creative assistant. Feel free to brainstorm, suggest ideas, and use imaginative language related to the task context.";
        temperature = 0.8;
        console.log("Using Creative Mode settings");
        break;
      case 'default': // GPT-4o mini
      default:
        // Use the default systemPrompt and temperature
        console.log("Using Default (GPT-4o mini) settings");
        break;
    }

    // --- TODO: Add logic to fetch chat history or task details if needed using taskId ---

    // --- Make the actual OpenAI API call ---
    console.log(`Making API call with prompt starting: '${systemPrompt.substring(0, 50)}...' and temp: ${temperature}`);
    
    // Use fetch API call to OpenAI
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using gpt-4o-mini as requested
        messages: [
          { role: "system", content: systemPrompt },
          // Include previous messages (chat history) if provided
          ...(Array.isArray(chatHistory) ? chatHistory : []), 
          { role: "user", content: query }
        ],
        temperature: temperature,
        // max_tokens: 1000, // Optional: Limit response length
      }),
    });

    if (!completion.ok) {
       const errorBody = await completion.json().catch(() => ({ message: "Failed to parse error body" })); // Graceful handling if error body isn't JSON
       console.error("OpenAI API Error Response:", errorBody);
       throw new Error(`OpenAI API request failed: ${completion.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
    }

    const data = await completion.json();
    // Add more robust checking for the response structure
    const responseContent = data?.choices?.[0]?.message?.content?.trim() || ""; 
    
    if (!responseContent) {
      console.warn("OpenAI response was successful but content is empty or missing.", data);
      throw new Error("Received empty response from AI.");
    }
    // --- End OpenAI API call ---

    // 4. Return the response
    console.log(`AI Response received: ${responseContent.substring(0, 100)}...`);
    return new Response(
      JSON.stringify({ response: responseContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-chat-response:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 