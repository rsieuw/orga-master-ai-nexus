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
 * @property {Citation[]} [citations] - An optional array of citations.
 */
interface AIResponse {
  response: string; 
  action?: string;  
  payload?: Record<string, unknown>; // Use Record<string, unknown> instead of any
  citations?: Citation[]; // Added for structured citations
}

/**
 * Interface for a single citation.
 */
interface Citation {
  number: number;
  title: string;
  url: string;
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

// Definieer openAIError in een scope die toegankelijk is voor de buitenste catch block
let openAIError: { status?: number; message: string; body?: unknown, details?: string, provider?: string } | null = null;

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
  // Reset openAIError voor elke request
  openAIError = null;

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[OPTIONS] Handling OPTIONS request.');
    return new Response('ok', { headers: corsHeaders });
  }

  // let _userIdForLogging: string | undefined; // Verwijderd, was ongebruikt
  // const functionNameForLogging = 'generate-chat-response'; // Verwijderd
  // let requestBodyForContext: Record<string, unknown> = {}; // Verwijderd

  // Client voor gebruikersauthenticatie en data fetchen (zoals subtasks)
  const supabaseUserClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  // Client specifiek voor logging naar user_api_logs met service_role rechten - Verwijderd
  // let supabaseAdminLoggingClient: SupabaseClient | null = null;
  // const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  let openaiModelUsed: string | undefined;
  // let _promptTokens: number | undefined; // Verwijderd, was ongebruikt
  // let _completionTokens: number | undefined; // Verwijderd, was ongebruikt
  // let _totalTokens: number | undefined; // Verwijderd, was ongebruikt
  // let _externalCallResponseTimeMs: number | undefined; // Verwijderd, was ongebruikt

  try {
    const { data: { user } } = await supabaseUserClient.auth.getUser();
    if (!user) { // Toegevoegde check voor het geval user null is (bv. token verlopen/ongeldig)
        throw new Error("User not authenticated or session expired.");
    }
    // _userIdForLogging = user.id; // Uitgecommentarieerd, was ongebruikt

    // 1. Extract data from request
    const body = await req.json();
    const { query, mode, taskId, chatHistory, languagePreference = 'en' } = body;
    // requestBodyForContext = { query, mode, taskId, languagePreference, chatHistoryLength: chatHistory?.length || 0 }; // Verwijderd
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

    // 4. Fetch current subtasks for context
    let currentSubtasks: { title: string; is_completed: boolean }[] = [];
    try {
        const { data: taskData, error: taskError } = await supabaseUserClient
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
    
    // Updated instruction for splitting research into subtasks
    const researchToSubtasksInstructionNL = `\n\nAls de gebruiker vraagt om subtaken te maken VAN EEN EERDER ONDERZOEK (bijv. "Kun je subtaken maken van dit onderzoek?", "Splits dit onderzoek op in subtaken", "Wat zijn de actiepunten uit de laatste onderzoeksresultaten?"), MOET je kijken in de recente chatgeschiedenis naar onderzoeksresultaten die jij (de assistent) hebt gegeven. Op basis van DIE onderzoeksresultaten, genereer een duidelijke, genummerde lijst van VOORGESTELDE subtaken in het 'response'-veld van je JSON-antwoord. Start GEEN nieuw onderzoek naar hoe je subtaken maakt. Je antwoord moet een lijst met suggesties zijn, bijvoorbeeld: "Op basis van het vorige onderzoek over 'Onderwerp X', hier zijn enkele voorgestelde subtaken:\n1. Voorgestelde subtaak A\n2. Voorgestelde subtaak B\n3. Voorgestelde subtaak C". Voeg geen 'action' of 'payload' velden toe hiervoor; alleen de tekstuele lijst in de 'response'.`;
    const researchToSubtasksInstructionEN = `\n\nIf the user asks to create subtasks FROM A PREVIOUS RESEARCH (e.g., "Can you make subtasks from this research?", "Split this research into subtasks", "What are the actionable steps from the last research results?"), you MUST look at the recent chat history for research results provided by you (the assistant). Based on THOSE research results, generate a clear, numbered list of SUGGESTED subtasks in the 'response' field of your JSON answer. DO NOT start a new research task about how to make subtasks. Your response should be a list of suggestions, for example: "Based on the previous research on 'Topic X', here are some suggested subtasks:\n1. Suggested subtask A\n2. Suggested subtask B\n3. Suggested subtask C". Do not include 'action' or 'payload' fields for this; just the textual list in the 'response'.`;

    if (preferredLanguage === 'Dutch') {
      baseSystemPrompt += researchToSubtasksInstructionNL;
    } else {
      baseSystemPrompt += researchToSubtasksInstructionEN;
    }

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
        baseSystemPrompt += " Focus on providing well-researched, in-depth information. Cite your sources clearly in the text using numbered references in square brackets (e.g., [1], [2]).";
        temperature = 0.3;
        openaiModelUsed = "gpt-4o-mini"; // Potentially a stronger model for research
        baseSystemPrompt += "\n\nMODE: Research. Provide thorough analysis and fact-based responses. \n";
        baseSystemPrompt += "IMPORTANT: If you provide sources, you MUST populate the 'citations' field in your JSON response. \n";
        baseSystemPrompt += "The 'citations' field must be an array of objects, where each object has 'number' (integer, matching the [number] in your text), 'title' (string), and 'url' (string, a direct working URL). \n";
        baseSystemPrompt += "Example for 'citations' field: [{\"number\": 1, \"title\": \"Example Source Title\", \"url\": \"https://example.com/source1\"}]";
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

    // 5. Call OpenAI API
    let aiResponseContent: string | null = null; // Initialize to null
    let aiSuccess = false;
    let structuredData: OpenAIChatCompletion | null = null; // Declare structuredData in a higher scope

    const openAIRequestBody = {
      model: openaiModelUsed,
      messages: [
        { role: "system", content: finalSystemPrompt },
        ...Array.isArray(chatHistory) ? chatHistory.map(msg => ({ role: msg.role, content: msg.content })) : [],
        { role: "user", content: query }
      ],
      temperature: temperature,
      response_format: { type: "json_object" }
    };

    // const startTimeFetch = performance.now(); // Verwijderd, was ongebruikt

    try {
      console.log('[OPENAI_FETCH_START] Attempting to fetch from OpenAI. Model:', openaiModelUsed);
      const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify(openAIRequestBody)
      });

      // const endTimeFetch = performance.now(); // Verwijderd, was ongebruikt
      // _externalCallResponseTimeMs = Math.round(endTimeFetch - startTimeFetch); // Uitgecommentarieerd, was ongebruikt

      const rawData = await openAIResponse.text(); // Lees altijd de raw data als tekst
      console.log(`[OPENAI_RAW_RESPONSE] Status: ${openAIResponse.status}, Raw Data (first 500 chars): ${rawData.substring(0, 500)}`);

      if (!openAIResponse.ok) {
        const errorMessage = `${t('errors.chatResponse.openAIRequestFailed', langKey)} ${openAIResponse.status} ${openAIResponse.statusText} - Raw: ${rawData.substring(0, 500)}`;
        openAIError = { status: openAIResponse.status, message: errorMessage, body: rawData }; // Sla rawData op ipv geparste body
        console.error("[OPENAI_FETCH_ERROR] OpenAI API Error Response:", openAIError);
      } else {
        // structuredData was already declared, just assign here
        try {
          console.log('[OPENAI_PARSE_START] Attempting to parse OpenAI JSON response.');
          structuredData = JSON.parse(rawData) as OpenAIChatCompletion;
          console.log('[OPENAI_PARSE_SUCCESS] Successfully parsed OpenAI JSON response.');
          openaiModelUsed = structuredData.model ?? openaiModelUsed;
          if (structuredData?.usage) {
            // _promptTokens = structuredData.usage.prompt_tokens; // Uitgecommentarieerd, was ongebruikt
            // _completionTokens = structuredData.usage.completion_tokens; // Uitgecommentarieerd, was ongebruikt
            // _totalTokens = structuredData.usage.total_tokens; // Uitgecommentarieerd, was ongebruikt
          }
          // Corrected assignment for aiResponseContent
          if (structuredData?.choices && structuredData.choices.length > 0 && structuredData.choices[0].message && typeof structuredData.choices[0].message.content === 'string') {
            aiResponseContent = structuredData.choices[0].message.content.trim();
          } else {
            aiResponseContent = null;
          }

          if (aiResponseContent !== null) { // Check if content was successfully extracted
             aiSuccess = true; // Mark as success if we have content
          } else if (!(structuredData?.choices && structuredData.choices.length > 0 && structuredData.choices[0].finish_reason === 'stop')){
            // If no content AND finish_reason is not 'stop' (or choices are missing), it might be an issue.
            // However, allow empty content if finish_reason is 'stop'.
            console.warn("AI response content is null, but not due to finish_reason='stop' or choices structure.");
            // Consider if this should set openAIError or aiSuccess = false depending on strictness
          }

        } catch (parseError: unknown) {
          const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          openAIError = { message: `${t('errors.chatResponse.nonJsonResponseFromAI', langKey)} - ParseError: ${parseErrorMessage}`, details: rawData.substring(0,1000) };
          console.error("[OPENAI_PARSE_ERROR] Failed to parse OpenAI JSON response. ParseError:", parseErrorMessage, "Raw data received:", rawData.substring(0,1000));
          aiSuccess = false; // Parsing failed
        }
      }
    } catch (fetchError) {
      // const endTimeFetch = performance.now(); // Verwijderd, was ongebruikt
      // _externalCallResponseTimeMs = Math.round(endTimeFetch - startTimeFetch); // Uitgecommentarieerd, was ongebruikt
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error("[FETCH_EXCEPTION] Error during fetch to OpenAI:", errorMessage, fetchError);
      openAIError = { message: `${t('errors.chatResponse.openAIRequestFailed', langKey)} ${errorMessage}` };
    }
    
    // Log external API call (OpenAI)
    // if (supabaseAdminLoggingClient) {
    //     try {
    //       const logEntry = {
    //         user_id: userIdForLogging, // Moet _userIdForLogging zijn als die variabele nog bestond
    //         function_name: functionNameForLogging,
    //         service_name: 'OpenAI',
    //         tokens_prompt: promptTokens, // Moet _promptTokens zijn
    //         tokens_completion: completionTokens, // Moet _completionTokens zijn
    //         tokens_total: totalTokens, // Moet _totalTokens zijn
    //         cost: 0, // Assuming cost is not available in the API response
    //         metadata: { 
    //           success: aiSuccess, 
    //           error: openAIError ? JSON.stringify(openAIError) : undefined, 
    //           model: openaiModelUsed, 
    //           response_id: structuredData?.id, // Now structuredData is in scope
    //           requestBody: requestBodyForContext,
    //         },
    //         response_time_ms: externalCallResponseTimeMs, // Moet _externalCallResponseTimeMs zijn
    //       };

    //       await supabaseAdminLoggingClient.from('external_api_usage_logs').insert([logEntry]);
    //     } catch (e: unknown) {
    //       const errorMessage = e instanceof Error ? e.message : String(e);
    //       console.error('Failed to log to external_api_usage_logs', errorMessage);
    //     }
    // } else {
    //     console.warn("Skipping external_api_usage_logs due to missing service_role key.");
    // }

    // Now, if there was an OpenAI error, throw it to be caught by the main catch block
    if (openAIError) {
      console.error('[THROWING_OPENAI_ERROR] Throwing error after OpenAI call failure or parse error:', openAIError.message);
      throw new Error(openAIError.message);
    }
    if (!aiSuccess || !aiResponseContent) { 
       console.error('[MISSING_AI_CONTENT] AI call was marked as not successful or content is missing, even after passing error checks. AI Success:', aiSuccess, 'Content Present:', !!aiResponseContent);
       throw new Error(t('errors.chatResponse.nonJsonResponseFromAI', langKey)); 
    }

    let finalAction: string | null = null;
    let finalPayload: Record<string, unknown> | null = null;
    let finalResponse: string = preferredLanguage === 'Dutch' ? t('responses.defaultError', 'nl') : t('responses.defaultError', 'en');

    if (aiResponseContent) {
        try {
            const aiResponseParsed: unknown = JSON.parse(aiResponseContent);
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
                   finalResponse = aiResponseContent; 
                }
            } else {
                // Als het geen object is, maar we hebben wel aiResponseContent, dan is dat de response.
                // Dit gebeurt als de AI, ondanks de prompt voor JSON, platte tekst teruggeeft.
                console.warn("[AI_RESPONSE_NOT_OBJECT] AI response content was not a parsable object, using raw content as response. Content:", aiResponseContent.substring(0, 200));
                finalResponse = aiResponseContent;
            }
        } catch (e: unknown) {
            // Dit catch blok wordt geraakt als JSON.parse(aiResponseContent) zelf een error gooit.
            const parseExceptionMessage = e instanceof Error ? e.message : String(e);
            console.warn("[AI_PARSE_EXCEPTION] Exception while trying to parse aiResponseContent. Using raw content. Error:", parseExceptionMessage, "Content:", aiResponseContent.substring(0,200));
            finalResponse = aiResponseContent;
        }
    } else {
        // console.warn("V2: AI response content was missing or empty.");
    }

    const finalResponseObject: AIResponse = { response: finalResponse };
    if (finalAction) finalResponseObject.action = finalAction;
    if (finalPayload !== null) finalResponseObject.payload = finalPayload;
    
    // Log internal API call SUCCESS
    // if (supabaseAdminLoggingClient && userIdForLogging) {
    //     try {
    //       await supabaseAdminLoggingClient.from('user_api_logs').insert({
    //         user_id: userIdForLogging,
    //         function_name: functionNameForLogging,
    //         metadata: { ...requestBodyForContext, success: true, openaiModelUsed, promptTokens, completionTokens, response_time_ms: externalCallResponseTimeMs },
    //       });
    //     } catch (e: unknown) {
    //       const errorMessage = e instanceof Error ? e.message : String(e);
    //       console.error('Failed to log SUCCESS to user_api_logs', errorMessage);
    //     }
    // } else {
    //     console.warn("Skipping SUCCESS user_api_logs due to missing service_role key or userId.");
    // }

    return new Response(JSON.stringify(finalResponseObject), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e: unknown) {
    const langKeyForError = req.headers.get('accept-language')?.includes('nl') ? 'nl' : 'en';
    // const functionNameForLogging = 'generate-chat-response';
    // let errorMessageDisplay = t('errors.chatResponse.functionExecError', langKeyForError); // Verwijderd, gebruik e.message of een specifiekere key
    
    let errorKey = "errors.chatResponse.functionExecError"; // Standaard error key
    let details = t('errors.chatResponse.unknownError', langKeyForError);

    if (e instanceof Error) {
      details = e.message;
      // Probeer een specifiekere errorKey te vinden als de message een bekende key is
      const knownErrorKeys = [
          t('errors.chatResponse.queryRequired', langKeyForError),
          t('errors.chatResponse.modeRequired', langKeyForError),
          t('errors.chatResponse.taskIdRequired', langKeyForError),
          t('errors.chatResponse.openAIApiKeyMissing', langKeyForError),
          t('errors.chatResponse.supabaseUrlMissing', langKeyForError),
          t('errors.chatResponse.supabaseAnonKeyMissing', langKeyForError),
          t('errors.chatResponse.openAIRequestFailed', langKeyForError), // Algemene OpenAI fout
          t('errors.chatResponse.nonJsonResponseFromAI', langKeyForError) // Specifiek voor JSON parsing
      ];
      if (knownErrorKeys.includes(details)) {
          errorKey = details; // Gebruik de message als key als het een bekende is
      } else if (details.startsWith(t('errors.chatResponse.openAIRequestFailed', langKeyForError))) {
          errorKey = t('errors.chatResponse.openAIRequestFailed', langKeyForError); // Vang specifiek OpenAI Request Failed
      } else if (details.includes(t('errors.chatResponse.nonJsonResponseFromAI', langKeyForError).substring(0,10))) { // Gedeeltelijke match voor non-JSON
          errorKey = t('errors.chatResponse.nonJsonResponseFromAI', langKeyForError);
      }
      console.error(`[GLOBAL_CATCH_ERROR] Error in generate-chat-response: Message: "${details}", Error Object:`, e);
    } else {
      details = String(e);
      console.error(`[GLOBAL_CATCH_ERROR] Non-Error object thrown in generate-chat-response:`, String(e));
    }

    // Bepaal de HTTP-status voor de error response
    // Gebruik de status van de global `openAIError` variabele als die gezet is.
    let errorStatusToReturn = 500;
    if (openAIError && typeof (openAIError as { status?: number }).status === 'number') {
        // De linter ziet openAIError.status hier mogelijk als 'never' door complexe type inferentie.
        // Een expliciete cast helpt de linter. Na de typeof check is status gegarandeerd een number.
        errorStatusToReturn = (openAIError as { status: number }).status;
    } else if (e instanceof Error && e.message.includes("429")) {
        // Fallback als de error een rate limit error is maar openAIError niet (goed) gezet was.
        errorStatusToReturn = 429;
    }

    // Log internal API call FAILURE
    // if (supabaseAdminLoggingClient && userIdForLogging) {
    //     try {
    //       await supabaseAdminLoggingClient.from('user_api_logs').insert({
    //         user_id: userIdForLogging,
    //         function_name: functionNameForLogging,
    //         metadata: { 
    //             ...requestBodyForContext, 
    //             success: false, 
    //             error: details,
    //             rawError: String(e),
    //             openaiModelUsed,
    //             promptTokens, // Moet _promptTokens zijn
    //             completionTokens, // Moet _completionTokens zijn
    //             response_time_ms: externalCallResponseTimeMs // Moet _externalCallResponseTimeMs zijn
    //         },
    //       });
    //     } catch (finalLogErr: unknown) {
    //       const finalLogErrorMessage = finalLogErr instanceof Error ? finalLogErr.message : String(finalLogErr);
    //       console.error('Failed to log FAILURE to user_api_logs', finalLogErrorMessage);
    //     }
    // } else {
    //     console.warn("Skipping FAILURE user_api_logs due to missing service_role key or userId.");
    // }
    
    return new Response(JSON.stringify({ errorKey: errorKey, details: details }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorStatusToReturn, // Gebruik de afgeleide status
    });
  }
}); 


