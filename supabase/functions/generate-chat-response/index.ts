import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Import Supabase client

// Interface for Subtask (adjust if your structure is different)
interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  // Add other fields if necessary
}

console.log("generate-chat-response function started V2");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from request
    const { query, mode, taskId, chatHistory } = await req.json();
    console.log(`V2: Received query: ${query}, mode: ${mode}, taskId: ${taskId}, history length: ${chatHistory?.length || 0}`);
    if (!query) throw new Error("Query is required");
    if (!mode) throw new Error("Mode is required");
    if (!taskId) throw new Error("taskId is required"); // Need taskId to fetch subtasks

    // 2. Load API Keys and Supabase Config
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!openAIApiKey) throw new Error("OPENAI_API_KEY environment variable not set");
    if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable not set");
    if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY environment variable not set");

    // 3. Initialize Supabase Client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: req.headers.get('Authorization')! } } // Pass auth header for RLS
    });

    // 4. Fetch current subtasks for context
    let currentSubtasks: SubTask[] = [];
    try {
        const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('subtasks')
            .eq('id', taskId)
            .single();

        if (taskError) {
            console.error("Error fetching task subtasks:", taskError);
            // Don't throw, proceed without subtask context if fetching fails
        } else if (taskData && Array.isArray(taskData.subtasks)) {
            currentSubtasks = taskData.subtasks;
            console.log(`V2: Fetched ${currentSubtasks.length} subtasks for context.`);
        }
    } catch (e) {
        console.error("Exception fetching subtasks:", e);
    }

    // 5. Prepare Prompt and Parameters for OpenAI
    let baseSystemPrompt = "You are a helpful AI assistant specialized in task management for the 'OrgaMaster AI' application. Your goal is to understand user requests about a specific task and potentially manage its subtasks.";
    let temperature = 0.5;

    // Add mode-specific instructions
     switch(mode){
      case 'precise':
        baseSystemPrompt += " Respond precisely and factually. Stick strictly to known information.";
        temperature = 0.2;
        console.log("V2: Using Precise Mode settings");
        break;
      case 'creative':
        baseSystemPrompt += " Be creative, brainstorm ideas, and use imaginative language regarding the task.";
        temperature = 0.8;
        console.log("V2: Using Creative Mode settings");
        break;
      default:
        console.log("V2: Using Default (GPT-4o mini) settings");
        break;
    }

    // --- Add Subtask Management Instructions ---
    const subtaskInstructions = `
You can manage subtasks based on the user's request. The current subtasks for this task are:
${currentSubtasks.length > 0 ? JSON.stringify(currentSubtasks) : "No subtasks currently exist."}

If the user asks you to add, update, or delete a subtask:
1. Acknowledge the request in your natural language response.
2. **CRITICAL:** Structure your JSON response to include an "action" field and a "payload" field alongside the "response" field.
   - For adding: { "action": "ADD_SUBTASK", "payload": { "title": "New Subtask Title" } }
   - For updating title: { "action": "UPDATE_SUBTASK", "payload": { "subtaskId": "ID_OF_SUBTASK_TO_UPDATE", "updates": { "title": "Updated Title" } } }
   - For completing: { "action": "UPDATE_SUBTASK", "payload": { "subtaskId": "ID_OF_SUBTASK_TO_COMPLETE", "updates": { "completed": true } } }
   - For deleting: { "action": "DELETE_SUBTASK", "payload": { "subtaskId": "ID_OF_SUBTASK_TO_DELETE" } }
3. Use the provided subtask IDs when generating the payload for update/delete actions. If the user refers to a subtask by title, find the corresponding ID from the list above. If multiple match, ask for clarification instead of performing an action.
4. Only include the 'action' and 'payload' fields if you are actually performing a subtask modification. For regular chat, only return the 'response' field.
5. Ensure the 'response' field always contains your user-facing text answer.
`;

    const finalSystemPrompt = `${baseSystemPrompt}\n${subtaskInstructions}`;

    // --- Make the OpenAI API call ---
    console.log(`V2: Making API call with prompt starting: '${finalSystemPrompt.substring(0, 70)}...' and temp: ${temperature}`);

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Or your preferred model
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...Array.isArray(chatHistory) ? chatHistory.map(msg => ({ role: msg.role, content: msg.content })) : [], // Ensure history format is correct
          { role: "user", content: query }
        ],
        temperature: temperature,
        // IMPORTANT: Instructing the model to return JSON
        response_format: { type: "json_object" }
      })
    });

    if (!completion.ok) {
      const errorBody = await completion.json().catch(()=>({ message: "Failed to parse error body" }));
      console.error("V2: OpenAI API Error Response:", errorBody);
      throw new Error(`OpenAI API request failed: ${completion.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
    }

    const rawData = await completion.text(); // Get raw text first for debugging
    console.log("V2: Raw OpenAI Response:", rawData);

    let structuredData;
    try {
      structuredData = JSON.parse(rawData); // Try parsing the raw response
    } catch (parseError) {
        console.error("V2: Failed to parse OpenAI response as JSON:", parseError);
        // Attempt to extract JSON if it's embedded (sometimes happens)
        const jsonMatch = rawData.match(/\{.*\}/s);
        if (jsonMatch && jsonMatch[0]) {
            try {
                structuredData = JSON.parse(jsonMatch[0]);
                console.log("V2: Successfully extracted and parsed JSON from raw response.");
            } catch (nestedParseError) {
                 console.error("V2: Failed to parse extracted JSON:", nestedParseError);
                 throw new Error("Received malformed JSON response from AI.");
            }
        } else {
             throw new Error("Received non-JSON response from AI.");
        }
    }


    // Extract content, action, and payload from the *parsed* JSON response object
    const responseContent = structuredData?.choices?.[0]?.message?.content?.trim();

    if (!responseContent) {
        console.warn("V2: OpenAI response content key is missing or empty in JSON.", structuredData);
        // Even if content is missing, check if there's an action
        // Maybe the action was performed but text generation failed?
    }

     // Attempt to parse the *content* itself as JSON, as the LLM might put the structured data *inside* the content field
    let finalResponseObject = { response: responseContent || "..." }; // Default to text response

    if (responseContent) {
        try {
            const contentJson = JSON.parse(responseContent);
            // If parsing succeeds AND it contains expected keys, use it
            if (contentJson.response) { // Check for the 'response' key as a minimum requirement
                 console.log("V2: Content was JSON, using parsed structure.");
                 finalResponseObject = {
                     response: contentJson.response, // Textual part
                     action: contentJson.action,     // Optional action
                     payload: contentJson.payload    // Optional payload
                 };
            } else {
                 console.log("V2: Content parsed as JSON but lacks 'response' key. Treating as plain text.");
            }

        } catch(e) {
             // Content is not JSON, treat it as plain text
             console.log("V2: Content is plain text, not JSON.");
        }
    } else if (structuredData?.action) {
        // Handle cases where the main response might be missing, but action is directly in the top-level parsed object
        console.warn("V2: Response content missing, but action found in top-level object.");
        finalResponseObject = {
             response: structuredData.response || "Action performed.", // Provide a default response
             action: structuredData.action,
             payload: structuredData.payload
         };
    }


    // 6. Return the structured response
    console.log(`V2: Final structured response being sent:`, finalResponseObject);
    return new Response(JSON.stringify(finalResponseObject), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("V2: Error in generate-chat-response:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 