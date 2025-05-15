/**
 * @fileoverview Supabase Edge Function to generate chat responses using OpenAI.
 * This function handles user queries related to tasks, including managing subtasks
 * and the main task itself. It supports different modes (precise, creative, research, instruction)
 * and language preferences. It interacts with the Supabase database to fetch task details
 * and then calls the OpenAI API to generate a response, potentially including actions
 * to be performed by the client.
 */

/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import { supabaseAdmin } from "../_shared/supabaseAdmin.ts"; // Commented out as it's not directly used in this function and causes load/lint issues
// import { OpenAI } from "https://deno.land/x/openai@v4.52.7/mod.ts"; // OpenAI class not used, direct fetch is used

// Interface for Subtask (adjust if your structure is different)
// interface SubTask {
//   id: string;
//   title: string;
//   completed: boolean;
//   // Add other fields if necessary
// }

/**
 * Interface defining the expected structure for an AI-generated response.
 * @interface AIResponse
 * @property {string} response - The natural language response to the user.
 * @property {string} [action] - An optional action string (e.g., 'ADD_SUBTASK') if the AI determines an action is needed.
 * @property {Record<string, unknown>} [payload] - An optional payload for the action, containing necessary data (e.g., { title: "New Subtask Title" }).
 */
interface AIResponse {
  response: string; 
  action?: string;  
  payload?: Record<string, unknown>; // Use Record<string, unknown> instead of any
}

/**
 * Interface defining the expected structure of a chat completion response from the OpenAI API.
 * @interface OpenAIChatCompletion
 * @property {string} [id] - The ID of the completion.
 * @property {string} [object] - The type of object (e.g., 'chat.completion').
 * @property {number} [created] - Timestamp of creation.
 * @property {string} [model] - The model used for the completion.
 * @property {Array<{index?: number, message?: {role?: string, content?: string}, finish_reason?: string}>} [choices] - An array of choices, typically one.
 * @property {{prompt_tokens?: number, completion_tokens?: number, total_tokens?: number}} [usage] - Token usage information.
 * @property {string} [system_fingerprint] - System fingerprint.
 */
interface OpenAIChatCompletion {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: {
    index?: number;
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  system_fingerprint?: string;
}

// Translation helper - simplified implementation for Edge Functions
const translations = {
  en: {
    errors: {
      chatResponse: {
        queryRequired: "Query is required",
        modeRequired: "Mode is required",
        taskIdRequired: "taskId is required",
        openAIApiKeyMissing: "OPENAI_API_KEY environment variable not set",
        supabaseUrlMissing: "SUPABASE_URL environment variable not set",
        supabaseAnonKeyMissing: "SUPABASE_ANON_KEY environment variable not set",
        errorFetchingSubtasks: "Error fetching task subtasks:",
        exceptionFetchingSubtasks: "Exception fetching subtasks:",
        openAIRequestFailed: "OpenAI API request failed:",
        nonJsonResponseFromAI: "Received non-JSON response from AI.",
        structureMismatchOrChoicesMissing: "Parsed data does not match expected OpenAIChatCompletion structure or choices are missing.",
        payloadNotValidObject: "Payload from AI is not a valid object, ignoring for finalPayload.",
        functionExecError: "Function execution error",
        unknownError: "Unknown error",
        failedParseErrorBody: "Failed to parse error body"
      }
    },
    responses: {
      defaultError: "Sorry, I couldn't generate a response.",
      defaultAction: "Okay, I'll perform the action.",
      noSubtasks: "No subtasks currently exist."
    }
  },
  nl: {
    errors: {
      chatResponse: {
        queryRequired: "Query is vereist",
        modeRequired: "Modus is vereist",
        taskIdRequired: "taskId is vereist",
        openAIApiKeyMissing: "OPENAI_API_KEY omgevingsvariabele niet ingesteld",
        supabaseUrlMissing: "SUPABASE_URL omgevingsvariabele niet ingesteld",
        supabaseAnonKeyMissing: "SUPABASE_ANON_KEY omgevingsvariabele niet ingesteld",
        errorFetchingSubtasks: "Fout bij ophalen subtasks:",
        exceptionFetchingSubtasks: "Exceptie bij ophalen subtasks:",
        openAIRequestFailed: "OpenAI API request mislukt:",
        nonJsonResponseFromAI: "Geen JSON-respons ontvangen van AI.",
        structureMismatchOrChoicesMissing: "Geparste data komt niet overeen met de verwachte OpenAIChatCompletion structuur of keuzes ontbreken.",
        payloadNotValidObject: "Payload van AI is geen geldig object, wordt genegeerd voor finalPayload.",
        functionExecError: "Fout bij uitvoeren functie",
        unknownError: "Onbekende fout",
        failedParseErrorBody: "Kon foutgegevens niet verwerken"
      }
    },
    responses: {
      defaultError: "Sorry, ik kon geen antwoord genereren.",
      defaultAction: "Oké, ik voer de actie uit.",
      noSubtasks: "Er bestaan nog geen subtaken."
    }
  }
};

/**
 * Simple translation function to retrieve localized strings.
 * It navigates a nested translation object based on a dot-separated key.
 * Falls back to English if a key is not found in the specified language.
 * 
 * @param {string} key - The dot-separated key for the translation string (e.g., "errors.chatResponse.queryRequired").
 * @param {'en' | 'nl'} [lang='en'] - The target language code ('en' or 'nl').
 * @returns {string} The translated string, or the key itself if not found after fallbacks.
 */
// Translation function
function t(key: string, lang = 'en'): string {
  const langKey = lang === 'nl' ? 'nl' : 'en';
  
  // Split the key path (e.g. "errors.chatResponse.queryRequired")
  const path = key.split('.');
  
  // Navigate through the translations object
  let result: unknown = translations[langKey];
  for (const segment of path) {
    if (result && typeof result === 'object' && segment in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[segment];
    } else {
      // Fallback to English if key not found
      console.warn(`Translation key not found: ${key}, language: ${langKey}`);
      if (langKey !== 'en') {
        return t(key, 'en');
      }
      return key; // Last resort fallback
    }
  }
  
  return result as string;
}

// console.log("generate-chat-response function started V2");

/**
 * @typedef {Object} GenerateChatRequestBody
 * @property {string} query - The user's query or message.
 * @property {'precise' | 'creative' | 'research' | 'instruction' | string} mode - The desired mode for the AI response.
 * @property {string} taskId - The ID of the current task to which the chat pertains.
 * @property {Array<{role: 'user' | 'assistant', content: string}>} [chatHistory] - Optional previous chat messages for context.
 * @property {'en' | 'nl'} [languagePreference='en'] - The preferred language for the AI's response.
 */

/**
 * Main Deno server function that handles incoming HTTP requests for generating chat responses.
 * - Handles CORS preflight requests.
 * - Extracts and validates parameters from the request body (query, mode, taskId, languagePreference, chatHistory).
 * - Retrieves necessary API keys and Supabase configuration from environment variables.
 * - Initializes a Supabase client with user authentication context.
 * - Fetches current subtasks for the given taskId to provide context to the AI.
 * - Constructs a detailed system prompt for OpenAI based on the mode, task context, subtasks, and language preference.
 * - Calls the OpenAI Chat Completions API.
 * - Parses the AI's response, expecting a JSON string that conforms to the AIResponse interface.
 * - Formats and returns the AI-generated response, including any actions and payload if specified by the AI.
 * - Handles errors gracefully, returning appropriate error messages and status codes.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let userIdForLogging: string | undefined;
  const functionNameForLogging = 'generate-chat-response';
  let requestBodyForContext: Record<string, unknown> = {}; // For logging context

  // Initialize Supabase client with the Auth context of the user making the request.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  let openaiModelUsed: string | undefined;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let totalTokens: number | undefined;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    userIdForLogging = user?.id;

    // 1. Extract data from request
    const { query, mode, taskId, chatHistory, languagePreference = 'en' } = await req.json();
    requestBodyForContext = { query, mode, taskId, languagePreference, chatHistoryLength: chatHistory?.length || 0 }; // Store for logging
    const langKey = languagePreference === 'nl' ? 'nl' : 'en';
    
    if (!query) throw new Error(t('errors.chatResponse.queryRequired', langKey));
    if (!mode) throw new Error(t('errors.chatResponse.modeRequired', langKey));
    if (!taskId) throw new Error(t('errors.chatResponse.taskIdRequired', langKey));
    const preferredLanguage = languagePreference === 'en' ? 'English' : 'Dutch';

    // 2. Load API Keys and Supabase Config
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!openAIApiKey) throw new Error(t('errors.chatResponse.openAIApiKeyMissing', langKey));
    if (!supabaseUrl) throw new Error(t('errors.chatResponse.supabaseUrlMissing', langKey));
    if (!supabaseAnonKey) throw new Error(t('errors.chatResponse.supabaseAnonKeyMissing', langKey));

    // 4. Fetch current subtasks for context (Moved before OpenAI call)
    let currentSubtasks: { title: string; is_completed: boolean }[] = [];
    try {
        const { data: taskData, error: taskError } = await supabase
            .from('tasks')
            .select('subtasks')
            .eq('id', taskId)
            .single();

        if (taskError) {
            console.error(t('errors.chatResponse.errorFetchingSubtasks', langKey), taskError);
        } else if (taskData && Array.isArray(taskData.subtasks)) {
            currentSubtasks = taskData.subtasks;
        }
    } catch (e) {
        console.error(t('errors.chatResponse.exceptionFetchingSubtasks', langKey), e);
    }

    // 5. Prepare Prompt and Parameters for OpenAI
    let baseSystemPrompt = `You are a helpful AI assistant specialized in task management for the 'OrgaMaster AI' application. Your goal is to understand user requests about a specific task and potentially manage its subtasks or the main task itself. Respond ONLY in ${preferredLanguage}. The ID of the current main task is ${taskId}.`;
    let temperature = 0.5;
    openaiModelUsed = "gpt-4o-mini"; // Default model, potentially overridden by mode

     switch(mode){
      case 'precise':
        baseSystemPrompt += " Respond precisely and factually. Stick strictly to known information.";
        temperature = 0.2;
        openaiModelUsed = "gpt-4o-mini";
        baseSystemPrompt += "\n\nMODE: Precise. Respond with factual, accurate, and concise responses.";
        break;
      case 'creative':
        baseSystemPrompt += " Be creative, brainstorm ideas, and use imaginative language regarding the task.";
        temperature = 0.8;
        openaiModelUsed = "gpt-4o-mini"; // Or a more creative model if available/desired
        baseSystemPrompt += "\n\nMODE: Creative. Be imaginative, explore possibilities, and suggest novel ideas.";
        break;
      case 'research':
        baseSystemPrompt += " Focus on providing well-researched, in-depth information with proper citations when possible.";
        temperature = 0.3;
        openaiModelUsed = "gpt-4o"; // Potentially a stronger model for research
        baseSystemPrompt += "\n\nMODE: Research. Provide thorough analysis and fact-based responses.";
        break;
      case 'instruction':
        baseSystemPrompt += " Focus on following instructions precisely, step-by-step, and in a systematic manner.";
        temperature = 0.2;
        openaiModelUsed = "gpt-4o-mini";
        baseSystemPrompt += "\n\nMODE: Instruction. Follow directions precisely and provide structured guidance.";
        break;
      default:
        baseSystemPrompt += "\n\nMODE: Balanced (Default). Provide helpful, relevant, and concise responses.";
        break;
    }

    const mainTaskInstructions = `\nYou can also manage the main task itself based on the user's request.
If the user asks you to rename or update the title of the main task:
1. Acknowledge the request in your natural language response.
2. **CRITICAL:** Structure your JSON response to include an "action" field and a "payload" field alongside the "response" field.
   - For updating the title: { "action": "UPDATE_TASK_TITLE", "payload": { "newTitle": "The New Task Title" } }
3. Only include the 'action' and 'payload' fields if you are actually performing a task modification. For regular chat, only return the 'response' field.
4. Ensure the 'response' field always contains your user-facing text answer.
`;

    const subtaskInstructions = `\
You can manage subtasks based on the user's request **if they explicitly mention 'subtask'**. The current subtasks for this task (ID: ${taskId}) are:\n${currentSubtasks.length > 0 ? JSON.stringify(currentSubtasks) : t('responses.noSubtasks', langKey)}

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

    const languageInstruction = `\n\n**IMPORTANT: Always respond in ${preferredLanguage}.**`;
    const finalSystemPrompt = `${baseSystemPrompt}\n${mainTaskInstructions}\n${subtaskInstructions}${languageInstruction}`;

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: openaiModelUsed, // Use the determined model
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...Array.isArray(chatHistory) ? chatHistory.map(msg => ({ role: msg.role, content: msg.content })) : [],
          { role: "user", content: query }
        ],
        temperature: temperature,
        response_format: { type: "json_object" }
      })
    });

    let openAIError = null;
    if (!completion.ok) {
      const errorBody = await completion.json().catch(()=>({ message: t('errors.chatResponse.failedParseErrorBody', langKey) }));
      const errorMessage = `${t('errors.chatResponse.openAIRequestFailed', langKey)} ${completion.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`;
      openAIError = {
        status: completion.status,
        message: errorMessage,
        body: errorBody
      };
      console.error("V2: OpenAI API Error Response:", errorBody);
      // throw new Error(errorMessage); // We will throw later after logging
    }

    const rawData = await completion.text(); 
    let structuredData: OpenAIChatCompletion | null = null; // Use specific type

    try {
      if (completion.ok) { // Only parse if completion was ok
          structuredData = JSON.parse(rawData) as OpenAIChatCompletion;
          openaiModelUsed = structuredData?.model ?? openaiModelUsed; // Update model from response if available
          promptTokens = structuredData?.usage?.prompt_tokens;
          completionTokens = structuredData?.usage?.completion_tokens;
          totalTokens = structuredData?.usage?.total_tokens;
      }
    } catch (parseError) {
       // If parsing fails even on an OK response, it's an issue.
       openAIError = {
         status: completion.status, // Could still be 200 but invalid JSON
         message: t('errors.chatResponse.nonJsonResponseFromAI', langKey),
         body: rawData // Log the raw data that failed to parse
       };
       console.error("V2: Failed to parse OpenAI JSON response:", parseError, "Raw data:", rawData);
       // We will throw later after logging
    }
    
    // Log external API call (OpenAI)
    try {
      await supabase.from('external_api_usage_logs').insert({
        user_id: userIdForLogging,
        task_id: taskId,
        service_name: 'OpenAI',
        function_name: 'chatCompletions',
        tokens_prompt: promptTokens,
        tokens_completion: completionTokens,
        tokens_total: totalTokens,
        // cost: calculateCost(openaiModelUsed, promptTokens, completionTokens), // Placeholder for cost calculation
        metadata: { 
          model: openaiModelUsed, 
          mode,
          languagePreference,
          success: !openAIError, 
          error: openAIError ? openAIError : undefined,
          response_id: structuredData?.id 
        },
      });
    } catch (e) {
      console.error('Failed to log to external_api_usage_logs', e);
      // Do not crash the main function for logging failure
    }

    // Now, if there was an OpenAI error, throw it to be caught by the main catch block
    if (openAIError) {
      throw new Error(openAIError.message);
    }
    if (!structuredData) { // Should not happen if openAIError wasn't thrown, but as a safeguard
       throw new Error(t('errors.chatResponse.nonJsonResponseFromAI', langKey)); 
    }


    let aiContentString: string | null = null;
    if (structuredData.choices && structuredData.choices.length > 0 && structuredData.choices[0].message) {
      aiContentString = structuredData.choices[0].message.content?.trim() ?? null;
    } else {
      console.warn(t('errors.chatResponse.structureMismatchOrChoicesMissing', langKey));
    }

    let finalAction: string | null = null;
    let finalPayload: Record<string, unknown> | null = null;
    let finalResponse: string = preferredLanguage === 'Dutch' ? t('responses.defaultError', 'nl') : t('responses.defaultError', 'en');

    if (aiContentString) {
        try {
            const aiResponseParsed: unknown = JSON.parse(aiContentString);
            if (typeof aiResponseParsed === 'object' && aiResponseParsed !== null) {
                const action = (aiResponseParsed as { action?: unknown }).action;
                const payloadFromAI = (aiResponseParsed as { payload?: unknown }).payload;
                const response = (aiResponseParsed as { response?: unknown }).response;

                if (typeof action === 'string') finalAction = action;
                if (typeof payloadFromAI === 'object' && payloadFromAI !== null && !Array.isArray(payloadFromAI)) {
                    finalPayload = payloadFromAI as Record<string, unknown>;
                } else if (payloadFromAI !== undefined) {
                    console.warn(t('errors.chatResponse.payloadNotValidObject', langKey));
                }
                if (typeof response === 'string') {
                    finalResponse = response;
                } else if (finalAction) {
                    finalResponse = preferredLanguage === 'Dutch' ? t('responses.defaultAction', 'nl') : t('responses.defaultAction', 'en');
                } else {
                   finalResponse = aiContentString; 
                }
            } else {
                finalResponse = aiContentString;
            }
        } catch (e) {
            finalResponse = aiContentString;
        }
    } else {
        // console.warn("V2: AI response content was missing or empty.");
    }

    const finalResponseObject: AIResponse = { response: finalResponse };
    if (finalAction) finalResponseObject.action = finalAction;
    if (finalPayload !== null) finalResponseObject.payload = finalPayload;
    
    // Log internal API call SUCCESS
    try {
      await supabase.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { ...requestBodyForContext, success: true, openaiModelUsed, promptTokens, completionTokens },
      });
    } catch (e) {
      console.error('Failed to log SUCCESS to user_api_logs', e);
    }

    return new Response(JSON.stringify(finalResponseObject), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    const langKeyForError = req.headers.get('accept-language')?.includes('nl') ? 'nl' : 'en';
    const errorMessage = t('errors.chatResponse.functionExecError', langKeyForError);
    console.error("Error in generate-chat-response:", e);
    
    let details = t('errors.chatResponse.unknownError', langKeyForError);
    if (e instanceof Error) {
      details = e.message;
    } else if (typeof e === 'string') {
      details = e;
    }

    // Log internal API call FAILURE
    try {
      await supabase.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { 
            ...requestBodyForContext, 
            success: false, 
            error: (e instanceof Error) ? e.message : String(e),
            rawError: String(e), // Include the raw error string
            openaiModelUsed, // Log model even on failure if known
            promptTokens,    // Log tokens if available
            completionTokens 
        },
      });
    } catch (finalLogErr) {
      console.error('Failed to log FAILURE to user_api_logs', finalLogErr);
    }
    
    const errorStatus = (e instanceof Error && e.message.includes("OpenAI API request failed with status 429")) ? 429 : 500;
    return new Response(JSON.stringify({ error: errorMessage, details: details }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorStatus,
    });
  }
}); 


