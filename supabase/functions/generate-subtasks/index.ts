/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Import the Supabase client
import { corsHeaders } from "../_shared/cors.ts";

// --- CORS Headers ---
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Adjust for production
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };
// --- End CORS Headers ---

// --- Interfaces ---
interface SubtaskSuggestion {
  title: string;
}

interface FunctionResponse {
  subtasks?: SubtaskSuggestion[];
  error?: string;
}

// --- New Interfaces for Data Fetching ---
// interface ChatMessage { ... }
// interface Note { ... }
// interface ResearchResult { ... }

// --- End New Interfaces ---

// console.log("generate-subtasks function started - v2 (with context)");

serve(async (req) => {
  console.log("generate-subtasks function invoked at: ", new Date().toISOString()); // Added for debugging
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from request - Now expecting taskId
    const { taskId } = await req.json();
    // console.log("Received taskId:", taskId);

    if (!taskId || typeof taskId !== 'string') { // Check if it's a string, adjust type if necessary (e.g., number)
      throw new Error("errors.request.missingTaskId");
    }

    // 2. Load Environment Variables
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Service Role Key is safer here, but Anon for now

    if (!openAIApiKey) throw new Error("errors.env.openaiKeyMissing");
    if (!supabaseUrl) throw new Error("errors.env.supabaseUrlMissing");
    if (!supabaseAnonKey) throw new Error("errors.env.supabaseAnonKeyMissing");

    // 3. Initialize Supabase Client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: req.headers.get('Authorization')! } } // Use user's auth token
    });

    // 4. Fetch data from Supabase
    // console.log(`Fetching data for taskId: ${taskId}`);

    // Fetch main task details
    const { data: taskData, error: taskError } = await supabase
      .from('tasks') // REPLACE 'tasks' with your actual table name
      .select('title, description, priority, deadline')
      .eq('id', taskId)
      .single();

    if (taskError) throw new Error("errors.task.fetchFailed"); // Details in server log, generic to client
    if (!taskData) throw new Error("errors.task.notFound"); // taskId can be added by client if needed

    // Fetch chat messages (Assumption: table 'chat_messages' with 'task_id')
    // Adjust table name, columns, and sorting if necessary
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages') // Table name is correct
      .select('role, content, created_at, message_type') // Column names adjusted: sender->role, message->content
      .eq('task_id', taskId) // Filter by task_id
      .order('created_at', { ascending: true }); // Sort by time

    if (chatError) console.warn(`Could not fetch chat messages: ${chatError.message}`); // Continue, but log the warning

    // Fetch notes (Assumption: table 'notes' with 'task_id')
    // Adjust if necessary
    const { data: notes, error: notesError } = await supabase
      .from('task_notes') // Table name adjusted: notes -> task_notes
      .select('content, created_at') // Select relevant columns
      .eq('task_id', taskId) // Filter by task_id
      .order('created_at', { ascending: true });

    if (notesError) console.warn(`Could not fetch notes: ${notesError.message}`);

    // Fetch research results (Assumption: table 'research_results' with 'task_id')
    // Adjust if necessary
    const { data: researchResults, error: researchError } = await supabase
      .from('saved_research') // Table name adjusted: research_results -> saved_research
      .select('research_content, created_at') // Column names adjusted: query/result_markdown -> research_content
      .eq('task_id', taskId) // Filter by task_id
      .order('created_at', { ascending: true });

    if (researchError) console.warn(`Could not fetch research results: ${researchError.message}`);

    // --- Actual AI Logic ---
    // Construct the prompt with the extra context
    const systemPrompt = `You are an AI assistant specialized in breaking down tasks into actionable subtasks.

Use the main task, the associated chat history, notes, and research results to generate a list of logical, actionable subtasks.
Pay specific attention to messages in the chat history marked as research results (even if not separately provided as 'Research Results'); these may contain valuable context.
These subtasks should help the user successfully complete the main task. Ensure each step is small, clear, and independently executable, in a logical order if possible. Consider priorities and deadlines if mentioned.

Format the output as a JSON object with a single key "subtasks" containing an array of objects, each with a "title" key. For example:
{ "subtasks": [{ "title": "Subtask 1" }, { "title": "Subtask 2" }] }

Return only this JSON object — no explanation or extra text.
`; // System prompt slightly adjusted for JSON object output

    // Build the user prompt dynamically with the fetched data
    let userPromptContent = `**Main Task:**\nTitle: ${taskData.title}\n`;
    if (taskData.description) userPromptContent += `Description: ${taskData.description}\n`;
    if (taskData.priority) userPromptContent += `Priority: ${taskData.priority}\n`;
    if (taskData.deadline) {
      try {
        userPromptContent += `Deadline: ${new Date(taskData.deadline).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric'})}\n`;
      } catch (dateError) { console.warn("Could not parse deadline:", taskData.deadline); }
    }

    if (chatMessages && chatMessages.length > 0) {
      userPromptContent += `\n**Chat History (latest messages first):**\n`;
      // Optionally limit length, or only include relevant messages? For now: all (or last few)
      const recentMessages = chatMessages.slice(-10); // Take max last 10 messages
      recentMessages.forEach(msg => {
        // Add marker for research result
        const prefix = msg.message_type === 'research_result' ? '[RESEARCH RESULT] ' : '';
        // Use msg.role and msg.content instead of msg.sender and msg.message
        userPromptContent += `- ${msg.role === 'user' ? 'User' : 'AI'} (${new Date(msg.created_at).toLocaleString('en-US')}): ${prefix}${msg.content}\n`;
      });
    }

    if (notes && notes.length > 0) {
      userPromptContent += `\n**Notes:**\n`;
      notes.forEach(note => {
        userPromptContent += `- ${note.content} (${new Date(note.created_at).toLocaleString('en-US')})\n`;
      });
    }

    if (researchResults && researchResults.length > 0) {
      userPromptContent += `\n**Research Results:**\n`;
      researchResults.forEach(res => {
        // Use res.research_content and remove res.query
        userPromptContent += `Result (summary):\n${res.research_content.substring(0, 500)}...\n---\n`; // Take first 500 chars
      });
    }

    userPromptContent += `\nNow generate the subtasks for the main task above, using all provided context.`;

    // Call OpenAI
    // console.log("Calling OpenAI to generate subtasks...");
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPromptContent }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });

    if (!completion.ok) {
      const errorBody = await completion.json().catch(()=>({ message: "Failed to parse error body" }));
      console.error("OpenAI API Error Response:", errorBody);
      // Stuur een generieke key; details zijn gelogd server-side
      throw new Error("errors.openai.requestFailed"); 
    }

    // Parse the response
    const rawData = await completion.text(); 
    // console.log("Raw OpenAI Response for subtasks:", rawData);

    // Define a type for the expected OpenAI response structure
    type OpenAIResponse = {
      choices: {
        message: {
          content: string;
        };
      }[];
    };

    let structuredData: OpenAIResponse;
    try {
      structuredData = JSON.parse(rawData) as OpenAIResponse;
      // Basic validation
      if (!structuredData?.choices?.[0]?.message?.content) {
        throw new Error("errors.ai.invalidStructure");
      }
    } catch (parseError) {
       console.error("Failed to parse OpenAI JSON response:", parseError, rawData);
       throw new Error("errors.ai.jsonParseFailed");
    }

    const aiContent = structuredData?.choices?.[0]?.message?.content?.trim();
    if (!aiContent) {
       throw new Error("errors.ai.noContent");
    }

    let generatedSubtasks: SubtaskSuggestion[];
    try {
      // Parse the *entire* object returned by the AI
      const parsedObject = JSON.parse(aiContent);

      // Get the 'subtasks' array from the object
      const subtasksArray = parsedObject.subtasks;

      // Validate if the 'subtasks' property is a valid array
      if (!Array.isArray(subtasksArray) || !subtasksArray.every(item => typeof item === 'object' && item !== null && 'title' in item && typeof item.title === 'string')) {
         console.error("AI response object does not contain a valid 'subtasks' array:", subtasksArray);
         throw new Error("errors.ai.subtasks.invalidArray");
      }
      generatedSubtasks = subtasksArray as SubtaskSuggestion[];

    } catch (parseError) {
       console.error("Failed to parse AI content or extract subtasks array:", parseError, aiContent);
       throw new Error("errors.ai.subtasks.extractionFailed"); // Client kan AI content loggen indien nodig
    }

    // console.log(`Generated ${generatedSubtasks.length} subtasks.`);
    // --- End Actual AI Logic ---

    const responsePayload: FunctionResponse = { subtasks: generatedSubtasks };

    // Correct return statement inside try block
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-subtasks:", error);
    let errorKey = "errors.internalServerError"; // Default fallback key

    if (error instanceof Error) {
      const knownKeys = [
        "errors.request.missingTaskId",
        "errors.env.openaiKeyMissing",
        "errors.env.supabaseUrlMissing",
        "errors.env.supabaseAnonKeyMissing",
        "errors.task.fetchFailed",
        "errors.task.notFound",
        "errors.openai.requestFailed",
        "errors.ai.invalidStructure",
        "errors.ai.jsonParseFailed",
        "errors.ai.noContent",
        "errors.ai.subtasks.invalidArray",
        "errors.ai.subtasks.extractionFailed"
      ];
      if (knownKeys.includes(error.message)) {
        errorKey = error.message;
      }
    }
    const responsePayload: FunctionResponse = { error: errorKey }; // Stuur de key
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Blijf 500 voor server errors, client kan specifieke melding tonen
    });
  }
}); 