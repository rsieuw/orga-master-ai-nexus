/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Import Supabase client
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.52.7/mod.ts";

// Interface for Subtask (adjust if your structure is different)
interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  // Add other fields if necessary
}

// --- Define expected AI Response structure ---
interface AIResponse {
  response: string; 
  action?: string;  
  payload?: Record<string, unknown>; // Use Record<string, unknown> instead of any
}
// --- End AI Response structure definition ---

// console.log("generate-chat-response function started V2");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from request
    const { query, mode, taskId, chatHistory, languagePreference = 'en' } = await req.json();
    // console.log(`V2: Received query: ${query}, mode: ${mode}, taskId: ${taskId}, lang: ${languagePreference}, history length: ${chatHistory?.length || 0}`);
    if (!query) throw new Error("Query is required");
    if (!mode) throw new Error("Mode is required");
    if (!taskId) throw new Error("taskId is required"); // Need taskId to fetch subtasks
    const preferredLanguage = languagePreference === 'en' ? 'English' : 'Dutch';

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
    let currentSubtasks: { title: string; is_completed: boolean }[] = [];
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
            // console.log(`V2: Fetched ${currentSubtasks.length} subtasks for context.`);
        }
    } catch (e) {
        console.error("Exception fetching subtasks:", e);
    }

    // 5. Prepare Prompt and Parameters for OpenAI
    let baseSystemPrompt = `You are a helpful AI assistant specialized in task management for the 'OrgaMaster AI' application. Your goal is to understand user requests about a specific task and potentially manage its subtasks or the main task itself. Respond ONLY in ${preferredLanguage}. The ID of the current main task is ${taskId}.`;
    let temperature = 0.5;
    let model = "gpt-4o-mini";

    // Add mode-specific instructions
     switch(mode){
      case 'precise':
        baseSystemPrompt += " Respond precisely and factually. Stick strictly to known information.";
        temperature = 0.2;
        model = "gpt-4o";
        baseSystemPrompt += "\n\nMODE: Precise. Respond with factual, accurate, and concise responses.";
        // console.log("V2: Using Precise Mode settings");
        break;
      case 'creative':
        baseSystemPrompt += " Be creative, brainstorm ideas, and use imaginative language regarding the task.";
        temperature = 0.8;
        model = "gpt-4o";
        baseSystemPrompt += "\n\nMODE: Creative. Be imaginative, explore possibilities, and suggest novel ideas.";
        // console.log("V2: Using Creative Mode settings");
        break;
      default:
        baseSystemPrompt += "\n\nMODE: Balanced (Default). Provide helpful, relevant, and concise responses.";
        // console.log("V2: Using Default (GPT-4o mini) settings");
        break;
    }

    // --- Add Main Task Management Instructions ---
    const mainTaskInstructions = `\nYou can also manage the main task itself based on the user's request.
If the user asks you to rename or update the title of the main task:
1. Acknowledge the request in your natural language response.
2. **CRITICAL:** Structure your JSON response to include an "action" field and a "payload" field alongside the "response" field.
   - For updating the title: { "action": "UPDATE_TASK_TITLE", "payload": { "newTitle": "The New Task Title" } }
3. Only include the 'action' and 'payload' fields if you are actually performing a task modification. For regular chat, only return the 'response' field.
4. Ensure the 'response' field always contains your user-facing text answer.
`;

    // --- Add Subtask Management Instructions ---
    const subtaskInstructions = `\
You can manage subtasks based on the user's request **if they explicitly mention 'subtask'**. The current subtasks for this task (ID: ${taskId}) are:\n${currentSubtasks.length > 0 ? JSON.stringify(currentSubtasks) : "No subtasks currently exist."}

If the user **explicitly asks to add, update, or delete a 'subtask'**:
1. Acknowledge the request in your natural language response.
2. **CRITICAL:** Structure your JSON response to include an "action" field and a "payload" field alongside the "response" field.
   - For adding: { "action": "ADD_SUBTASK", "payload": { "title": "New Subtask Title" } }
   - For updating title: { "action": "UPDATE_SUBTASK", "payload": { "subtaskId": "ID_OF_SUBTASK_TO_UPDATE", "updates": { "title": "Updated Title" } } }
   - For completing: { "action": "UPDATE_SUBTASK", "payload": { "subtaskId": "ID_OF_SUBTASK_TO_COMPLETE", "updates": { "completed": true } } }
   - For deleting: { "action": "DELETE_SUBTASK", "payload": { "subtaskId": "ID_OF_SUBTASK_TO_DELETE" } }
   - For deleting ALL subtasks: { "action": "DELETE_ALL_SUBTASKS", "payload": { "taskId": "${taskId}" } }
3. Use the provided subtask IDs when generating the payload for update/delete actions. If the user refers to a subtask by title, find the corresponding ID from the list above. If multiple match, ask for clarification instead of performing an action.
4. **Only include the 'action' and 'payload' fields if you are actually performing a subtask modification based on an explicit 'subtask' request.** For regular chat or requests about the main task, only return the 'response' field.
5. Ensure the 'response' field always contains your user-facing text answer.
`;

    // --- Language Instruction (Nu dynamisch) ---
    const languageInstruction = `\n\n**IMPORTANT: Always respond in ${preferredLanguage}.**`;

    // Combine all instructions
    const finalSystemPrompt = `${baseSystemPrompt}\n${mainTaskInstructions}\n${subtaskInstructions}${languageInstruction}`;

    // --- Make the OpenAI API call ---
    // console.log(`V2: Making API call with prompt starting: '${finalSystemPrompt.substring(0, 100)}...' and temp: ${temperature}`);

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...Array.isArray(chatHistory) ? chatHistory.map(msg => ({ role: msg.role, content: msg.content })) : [], // Ensure history format is correct
          { role: "user", content: query }
        ],
        temperature: temperature,
        response_format: { type: "json_object" }
      })
    });

    if (!completion.ok) {
      const errorBody = await completion.json().catch(()=>({ message: "Failed to parse error body" }));
      console.error("V2: OpenAI API Error Response:", errorBody);
      throw new Error(`OpenAI API request failed: ${completion.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
    }

    // --- Response Parsing ---
    const rawData = await completion.text(); 
    // console.log("V2: Raw OpenAI Response:", rawData);

    let structuredData: any; // Keep as any for parsing flexibility
    try {
      structuredData = JSON.parse(rawData);
    } catch (parseError) {
       // ... (handling for non-JSON or partially extracted JSON remains the same)
       throw new Error("Received non-JSON response from AI."); // Or handle fallback
    }

    // ---> HERZIENE LOGICA <---
    // Extract the main content part from the AI response first
    let aiContentString: string | null = null;
    try {
      aiContentString = structuredData?.choices?.[0]?.message?.content?.trim() ?? null;
    } catch (error) {
      // console.error("V2: Error accessing OpenAI response content:", error); // Optional
      // Handle cases where the structure might be different or null
    }

    // Initialize finalResponseObject with defaults
    let finalAction: string | null = null;
    let finalPayload: unknown = null;
    let finalResponse: string = "Sorry, ik kon geen antwoord genereren."; // Default text

    if (aiContentString) {
        // Try to parse the content string itself as JSON (in case AI wrapped the whole action object)
        try {
            const aiResponseParsed: unknown = JSON.parse(aiContentString);
            // Check if this parsed JSON contains the action/payload
            if (typeof aiResponseParsed === 'object' && aiResponseParsed !== null) {
                // Type check for properties
                const action = (aiResponseParsed as { action?: unknown }).action;
                const payload = (aiResponseParsed as { payload?: unknown }).payload;
                const response = (aiResponseParsed as { response?: unknown }).response;

                if (typeof action === 'string') {
                    finalAction = action;
                    // console.log("V2: Parsed 'action' from aiContentString:", finalAction);
                }
                // Keep payload as unknown, specific handling should occur where it's used
                finalPayload = payload;
                // console.log("V2: Parsed 'payload' from aiContentString.");

                if (typeof response === 'string') {
                    finalResponse = response;
                    // console.log("V2: Parsed 'response' text from aiContentString.");
                } else if (finalAction) {
                    // If we found an action but no explicit response text, use a default
                    finalResponse = "Oké, ik voer de actie uit."; 
                } else {
                   // If it's JSON but not our action structure, treat contentJson as the response text?
                   // Or stick to default error. Let's stick to default for now.
                   // console.warn("V2: Parsed contentJson but it doesn't match expected action structure.");
                   finalResponse = aiContentString; // Fallback to using the raw string if JSON parse worked but structure unknown
                }
            } else {
                 // Parsed contentJson is not an object, treat original string as text
                // console.log("V2: aiContentString parsed, but is not an object. Treating as plain text.");
                finalResponse = aiContentString;
            }
        } catch (e) {
            // Parsing aiContentString failed, it's just plain text
            // console.log("V2: aiContentString is plain text.");
            finalResponse = aiContentString;
        }
    } else {
        // aiContentString was null/empty from the start
        // console.warn("V2: AI response content was missing or empty.");
        // finalResponse keeps its default error message
    }

    // Construct the final object
    const finalResponseObject: AIResponse = { response: finalResponse };
    if (finalAction) {
        finalResponseObject.action = finalAction;
    }
    if (finalPayload !== undefined) {
        finalResponseObject.payload = finalPayload;
    }
    // ---> EINDE HERZIENE LOGICA <---

    // 6. Return the structured response
    // console.log(`V2: Final structured response being sent:`, finalResponseObject);
    return new Response(JSON.stringify(finalResponseObject), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("V2: Error in generate-chat-response:", error);
    // Type check the error before accessing message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 