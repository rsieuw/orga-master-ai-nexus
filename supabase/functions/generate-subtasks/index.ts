/**
 * @fileoverview Supabase Edge Function to generate subtasks for a given task using OpenAI.
 * This function takes task details (title, description, priority, deadline), language preference,
 * existing subtasks, and optionally chat history, notes, and research results as context.
 * It then calls the OpenAI API to generate a list of new, unique, and complementary subtasks.
 * The response is a JSON object containing an array of subtask suggestions.
 */

/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";
import { OpenAI } from "https://deno.land/x/openai@v4.52.7/mod.ts";

// --- CORS Headers ---
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Adjust for production
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };
// --- End CORS Headers ---

/**
 * Interface for a suggested subtask.
 * @interface SubtaskSuggestion
 * @property {string} title - The action-oriented title of the subtask.
 */
interface SubtaskSuggestion {
  title: string;
}

// Interface voor de items zoals ze mogelijk uit de AI komen (voor validatie)
interface RawSubtaskItem {
  title?: unknown;
  [key: string]: unknown; // To allow other properties that will be ignored
}

// --- New Interfaces for Data Fetching ---
// interface ChatMessage { ... }
// interface Note { ... }
// interface ResearchResult { ... }

// --- End New Interfaces ---

// console.log("generate-subtasks function started - v2 (with context)");

/**
 * Interface for the request body of the generate-subtasks function.
 * @interface RequestBody
 * @property {string} taskId - The ID of the main task.
 * @property {string} taskTitle - The title of the main task.
 * @property {string} [taskDescription] - Optional description of the main task.
 * @property {string} [taskPriority] - Optional priority of the main task.
 * @property {string} [taskDeadline] - Optional deadline of the main task (ISO string format).
 * @property {string} languagePreference - The preferred language for the subtasks (e.g., 'en', 'nl').
 * @property {string[]} [existingSubtaskTitles] - Optional array of titles of already existing subtasks.
 * @property {Array<{role: string, content: string, created_at: string, message_type?: string}>} [chatMessages] - Optional chat history for context.
 * @property {Array<{content: string, created_at: string}>} [notes] - Optional notes for context.
 * @property {Array<{research_content: string, created_at: string}>} [researchResults] - Optional research results for context.
 * @property {string} user_id - Not expected from client, will be extracted from auth
 */
interface RequestBody {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  taskPriority?: string;
  taskDeadline?: string;
  languagePreference: string;
  existingSubtaskTitles?: string[];
  // Optional fields for extra context if provided directly instead of fetched
  chatMessages?: { role: string; content: string; created_at: string; message_type?: string }[];
  notes?: { content: string; created_at: string }[];
  researchResults?: { research_content: string; created_at: string }[];
  // user_id is not expected from client, will be extracted from auth
}

const errorMessages = {
  en: {
    requestMissingParams: "Request body must include 'taskId', 'taskTitle' and 'languagePreference'.",
    missingTaskId: "Task ID is missing or invalid in the request.",
    missingOpenAiKey: "OpenAI API key not found.",
    aiRequestFailed: "OpenAI API request failed.",
    aiInvalidStructure: "OpenAI response JSON does not have the expected structure.",
    aiJsonParseFailed: "Failed to parse OpenAI JSON response.",
    aiNoContent: "No content found in OpenAI response.",
    aiSubtasksInvalidFormat: "AI response 'subtasks' is not a valid JSON array string or direct array.",
    aiSubtasksInvalidArrayStructure: "AI response 'subtasks' array items must have 'title' and optionally 'description' strings.",
    aiSubtasksExtractionFailed: "Failed to parse AI content or extract subtasks array.",
    functionExecError: "Error executing function.",
    noDeadline: "No deadline provided."
  },
  nl: {
    requestMissingParams: "Request body moet 'taskId', 'taskTitle' en 'languagePreference' bevatten.",
    missingTaskId: "Taak-ID ontbreekt of is ongeldig in het verzoek.",
    missingOpenAiKey: "OpenAI API key niet gevonden.",
    aiRequestFailed: "OpenAI API request mislukt.",
    aiInvalidStructure: "OpenAI response JSON heeft niet de verwachte structuur.",
    aiJsonParseFailed: "OpenAI JSON response parsen mislukt.",
    aiNoContent: "Geen inhoud gevonden in OpenAI response.",
    aiSubtasksInvalidFormat: "AI-respons 'subtasks' is geen geldige JSON-arraystring of directe array.",
    aiSubtasksInvalidArrayStructure: "Items in AI-respons 'subtasks'-array moeten 'title' en optioneel 'description' strings bevatten.",
    aiSubtasksExtractionFailed: "AI-inhoud parsen of subtasks-array extraheren mislukt.",
    functionExecError: "Fout bij uitvoeren functie.",
    noDeadline: "Geen deadline opgegeven."
  }
};

/**
 * Main Deno server function that handles incoming HTTP requests for generating subtasks.
 * - Handles CORS preflight requests.
 * - Parses and validates the request body for necessary parameters.
 * - Retrieves the OpenAI API key from environment variables.
 * - Constructs a detailed system prompt for OpenAI based on task details, existing subtasks, language, and provided context (chat, notes, research).
 * - Calls the OpenAI Chat Completions API (gpt-4-turbo-preview by default) with a JSON response format.
 * - Parses the AI's response, expecting a JSON object with a "subtasks" array.
 * - Validates the structure and content of the generated subtasks.
 * - Returns a successful response with the array of subtask suggestions or an error response.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
serve(async (req) => {
  console.log("generate-subtasks function invoked!", new Date().toISOString());
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Initialiseer langForError hier met een fallback
  const acceptLanguageHeader = req.headers.get('accept-language');
  let langForError = 'en'; // Default fallback
  if (acceptLanguageHeader) {
    if (acceptLanguageHeader.startsWith('nl')) {
      langForError = 'nl';
    } // Blijf 'en' als het niet 'nl' is of als de header ontbreekt
  }

  // const supabaseAdminClient = createClient( // Verwijderd
  //   Deno.env.get("SUPABASE_URL") ?? '',
  //   Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '',
  //   {
  //     auth: {
  //       persistSession: false,
  //     }
  //   }
  // );
  
  // Pass through user auth for RLS on user_api_logs and external_api_usage_logs if needed,
  // or rely on service_role if tables allow it.
  // For user-specific logging, using the user's auth context is better.
  const userSpecificSupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? '',
    Deno.env.get("SUPABASE_ANON_KEY") ?? '', // Assuming anon key for user context logs
    {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: { persistSession: false }
    }
  );

  // Admin client for logging to user_api_logs
  let supabaseAdminLoggingClient: SupabaseClient | null = null;
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (supabaseServiceRoleKey) {
    supabaseAdminLoggingClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      supabaseServiceRoleKey
    );
  } else {
    console.warn("[generate-subtasks] SUPABASE_SERVICE_ROLE_KEY not set. Logging to user_api_logs might be restricted by RLS.");
  }


  let userIdForLogging: string | undefined;
  const _functionNameForLogging = 'generate-subtasks';
  let _requestBodyForLogging: Record<string, unknown> = {};
  
  let openaiModelUsed: string | undefined;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let totalTokens: number | undefined;
  let openAIError: { status?: number; message: string; body?: unknown } | null = null;
  let _generatedSubtasks: SubtaskSuggestion[] = [];
  let _taskIdForCatch: string | undefined; // For logging in catch block


  try {
    console.log("Attempting to parse request body...");
    const requestBody = await req.json() as RequestBody;
    console.log("Successfully parsed request body:", requestBody);

    // Overschrijf langForError als we de languagePreference uit de body hebben
    if (requestBody.languagePreference) {
      langForError = requestBody.languagePreference === 'nl' ? 'nl' : 'en';
    }

    // Get user for logging
    const { data: { user } } = await userSpecificSupabaseClient.auth.getUser();
    userIdForLogging = user?.id;

    const { 
      taskId,
      taskTitle, 
      taskDescription, 
      taskPriority, 
      taskDeadline, 
      languagePreference, 
      existingSubtaskTitles,
      chatMessages,
      notes,
      researchResults 
    } = requestBody;

    _requestBodyForLogging = {
        taskId,
        taskTitleLength: taskTitle?.length,
        taskDescriptionProvided: !!taskDescription,
        taskPriorityProvided: !!taskPriority,
        taskDeadlineProvided: !!taskDeadline,
        languagePreference,
        existingSubtasksCount: existingSubtaskTitles?.length || 0,
        chatMessagesCount: chatMessages?.length || 0,
        notesCount: notes?.length || 0,
        researchResultsCount: researchResults?.length || 0,
    };

    _taskIdForCatch = taskId; // Set for catch block logging
    // const languagePreferenceForExternalLog = languagePreference; // Verwijderd, niet gebruikt in actieve logging

    const currentLangErrorMessages = errorMessages[languagePreference as keyof typeof errorMessages] || errorMessages.en;

    if (!taskId) throw new Error(currentLangErrorMessages.missingTaskId);
    if (!taskTitle || !languagePreference) throw new Error(currentLangErrorMessages.requestMissingParams);
    
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) throw new Error(currentLangErrorMessages.missingOpenAiKey);

    const deadlineForPrompt = taskDeadline ? `Deadline: ${taskDeadline}` : currentLangErrorMessages.noDeadline;

    let systemPrompt = `You are an AI assistant specialized in breaking down tasks into actionable subtasks. Your goal is to provide a concise list of 5-7 relevant subtasks. Each subtask must have only a "title" (string, action-oriented). Consider priority and deadline if provided. Output a valid JSON object with a single key "subtasks", which is an array of these subtask objects, where each object only has a "title" key. Example: {"subtasks": [{"title": "Titel 1"}, {"title": "Titel 2"}]}. The language for subtasks should match the task title's language (${languagePreference.startsWith('nl') ? 'Dutch' : 'English'}).`;
    if (existingSubtaskTitles && existingSubtaskTitles.length > 0) {
      systemPrompt += `\n\nIMPORTANT: The following subtasks already exist. Do NOT generate duplicates. Focus on NEW, UNIQUE, and COMPLEMENTARY subtasks:\n- ${existingSubtaskTitles.join('\n- ')}\nIf many subtasks exist, refine or add what's missing. If the task is well-divided, generate fewer or no new subtasks.`;
    }
    let userPromptContent = `**Main Task:**\nTitle: "${taskTitle}"\n`;
    if (taskDescription) userPromptContent += `Description: "${taskDescription}"\n`;
    if (taskPriority && taskPriority !== 'none') userPromptContent += `Priority: ${taskPriority}\n`;
    if (taskDeadline) userPromptContent += `${deadlineForPrompt}\n`;

    // Context appending logic (chatMessages, notes, researchResults) - condensed for brevity
    if (chatMessages && chatMessages.length > 0) {
        userPromptContent += `\n**Relevant Chat History (last 5 messages):**\n`;
        chatMessages.slice(-5).forEach(msg => {
            userPromptContent += `${msg.role === 'user' ? 'User' : 'Assistant'} (${new Date(msg.created_at).toLocaleDateString()}): ${msg.content}\n`;
      });
    }
    if (notes && notes.length > 0) {
        userPromptContent += `\n**Relevant Notes (last 3 entries):**\n`;
        notes.slice(-3).forEach(note => {
            userPromptContent += `- (${new Date(note.created_at).toLocaleDateString()}): ${note.content}\n`;
      });
    }
    if (researchResults && researchResults.length > 0) {
        userPromptContent += `\n**Relevant Research (last 2 snippets):**\n`;
        researchResults.slice(-2).forEach(result => {
            userPromptContent += `- (Research from ${new Date(result.created_at).toLocaleDateString()}): ${result.research_content.substring(0, 200)}...\n`;
      });
    }

    openaiModelUsed = "gpt-4o-mini"; // Or "gpt-4-turbo-preview" as in original comments
    const openai = new OpenAI({ apiKey: openAIApiKey });
    let aiResponseContent: string | null = null;
    let openAIUsage: OpenAI.Completions.CompletionUsage | undefined = undefined;

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: openaiModelUsed,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptContent },
      ],
      response_format: { type: "json_object" }, 
        temperature: 0.5,
        max_tokens: 500, 
      });

      aiResponseContent = chatCompletion.choices?.[0]?.message?.content ?? null;
      openAIUsage = chatCompletion.usage;
      promptTokens = openAIUsage?.prompt_tokens;
      completionTokens = openAIUsage?.completion_tokens;
      totalTokens = openAIUsage?.total_tokens;
      openaiModelUsed = chatCompletion.model || openaiModelUsed;

      if (!aiResponseContent) {
        openAIError = { message: currentLangErrorMessages.aiNoContent, body: chatCompletion };
      }
    } catch (e: unknown) {
      console.error("OpenAI API call failed:", e);
      const status = (typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).status === 'number')
            ? (e as Record<string, unknown>).status as number
            : undefined;
      openAIError = { 
          message: e instanceof Error ? e.message : currentLangErrorMessages.aiRequestFailed,
          status
      };
    }

    // Log external API call (OpenAI)
    try {
      await userSpecificSupabaseClient.from('external_api_usage_logs').insert({
        user_id: userIdForLogging,
        task_id: _taskIdForCatch,
        service_name: 'OpenAI',
        function_name: 'chatCompletions.create_subtasks',
        tokens_prompt: promptTokens,
        tokens_completion: completionTokens,
        tokens_total: totalTokens,
        metadata: { 
          model: openaiModelUsed,
          languagePreference: languagePreference,
          success: !openAIError, 
          error: openAIError ? openAIError : undefined,
        },
      });
    } catch (logError) {
      console.error('Failed to log to external_api_usage_logs', logError);
    }

    if (openAIError) {
      throw new Error(openAIError.message); // Caught by main try-catch
    }
    if (!aiResponseContent) { // Should be caught by openAIError but as a safeguard
        throw new Error(currentLangErrorMessages.aiNoContent);
    }

    // --- Start of existing AI response parsing logic ---
    let parsedAiJson: { subtasks?: RawSubtaskItem[] | string };
    try {
      parsedAiJson = JSON.parse(aiResponseContent);
    } catch (e) {
      console.error("Initial JSON.parse failed for AI response:", aiResponseContent, e);
      throw new Error(currentLangErrorMessages.aiJsonParseFailed);
    }

    let rawSubtasksArray: RawSubtaskItem[];
    if (typeof parsedAiJson.subtasks === 'string') {
      try {
        rawSubtasksArray = JSON.parse(parsedAiJson.subtasks) as RawSubtaskItem[];
      } catch (e) {
        console.error("Failed to parse 'subtasks' string field into array:", parsedAiJson.subtasks, e);
        throw new Error(currentLangErrorMessages.aiSubtasksInvalidFormat);
      }
    } else if (Array.isArray(parsedAiJson.subtasks)) {
      rawSubtasksArray = parsedAiJson.subtasks;
    } else {
      console.error("'subtasks' field is not a stringified array nor a direct array:", parsedAiJson);
      throw new Error(currentLangErrorMessages.aiSubtasksInvalidArrayStructure);
    }

    if (!Array.isArray(rawSubtasksArray)) {
      throw new Error(currentLangErrorMessages.aiSubtasksInvalidArrayStructure);
    }

    _generatedSubtasks = rawSubtasksArray.reduce((acc: SubtaskSuggestion[], item: RawSubtaskItem) => {
      if (item && typeof item.title === 'string' && item.title.trim() !== '') {
        const subtask: SubtaskSuggestion = { title: item.title.trim() };
        acc.push(subtask);
      }
      return acc;
    }, []);
    // --- End of existing AI response parsing logic ---
    
    // Log internal API call SUCCESS
    try {
      const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient;
      await loggingClient.from('user_api_logs').insert({
        user_id: userIdForLogging,
        function_name: _functionNameForLogging,
        metadata: { 
          ..._requestBodyForLogging, 
          success: true, 
          generatedSubtasksCount: _generatedSubtasks.length,
          openaiModelUsed,
          promptTokens,
          completionTokens
        },
      });
    } catch (logError) {
      console.error('Failed to log SUCCESS to user_api_logs', logError);
    }

    return new Response(
      JSON.stringify({ subtasks: _generatedSubtasks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (e) {
    // console.error("[generate-subtasks] CAUGHT ERROR:", e);
    const errorsForLang = errorMessages[langForError as keyof typeof errorMessages] || errorMessages.en;
    
    let errorKeyForResponse = "functionExecError"; // Default error key
    let messageForResponse = errorsForLang.functionExecError; // Default message
    const detailsForResponse = e instanceof Error ? e.message : String(e);

    if (e instanceof Error) {
      // Probeer een specifiekere errorKey te vinden
      const knownKeys = Object.keys(errorsForLang) as Array<keyof typeof errorsForLang>;
      for (const key of knownKeys) {
        if (errorsForLang[key] === e.message) {
          errorKeyForResponse = key;
          messageForResponse = e.message;
          break;
        }
      }
      // Als het geen directe match is, maar wel een bekende error string bevat:
      if (errorKeyForResponse === "functionExecError") { //Nog steeds default?
        if (e.message.includes("OpenAI API key not found")) errorKeyForResponse = "missingOpenAiKey";
        else if (e.message.includes("OpenAI API request failed")) errorKeyForResponse = "aiRequestFailed";
        // Update messageForResponse ook als key is aangepast, tenzij het al de e.message was
        if (errorsForLang[errorKeyForResponse as keyof typeof errorsForLang] && messageForResponse !== e.message) {
          messageForResponse = errorsForLang[errorKeyForResponse as keyof typeof errorsForLang];
        }
      }
    } else { // Non-error object thrown
      messageForResponse = String(e); // Gebruik de string representatie
    }

    // De uitgecommentarieerde logging naar user_api_logs gebruikte 'errorMessage' en 'errorKey'.
    // We gebruiken nu errorKeyForResponse en messageForResponse voor de HTTP response.

    // if (supabaseAdminLoggingClient || userSpecificSupabaseClient) {
    //   const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient;
    //   console.log("[generate-subtasks] Logging FAILURE to user_api_logs...");
    //   // const loggingClientForError = supabaseAdminLoggingClient || userSpecificSupabaseClient; // Redundant
    //   if (userIdForLogging && loggingClient) {
    //       try {
    //           await loggingClient.from('user_api_logs').insert({
    //               user_id: userIdForLogging,
    //               function_name: _functionNameForLogging,
    //               metadata: {
    //                   ..._requestBodyForLogging,
    //                   task_id: _taskIdForCatch, // Gebruik _taskIdForCatch hier
    //                   success: false,
    //                   error_message: messageForResponse, // Gebruik messageForResponse
    //                   error_key: errorKeyForResponse, // Gebruik errorKeyForResponse
    //                   raw_error: e instanceof Error ? e.stack : String(e),
    //                   language_preference: langForError, 
    //                   openai_model_used: openaiModelUsed, 
    //                   prompt_tokens: promptTokens, 
    //                   completion_tokens: completionTokens
    //               },
    //           });
    //       } catch (dbError) {
    //           console.error("[generate-subtasks] Database error during FAILURE log to user_api_logs:", dbError);
    //       }
    //   } else {
    //       console.warn("[generate-subtasks] Cannot log FAILURE to user_api_logs: userId or logging client missing.");
    //   }
    // }

    return new Response(JSON.stringify({ error: messageForResponse, errorKey: errorKeyForResponse, details: detailsForResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});

// Helper function to create Supabase client with service role
// Not strictly necessary to be separate if only used once, but can be good practice
// function getSupabaseAdminClient(): SupabaseClient {
//   const supabaseUrl = Deno.env.get('SUPABASE_URL');
//   const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

//   if (!supabaseUrl || !supabaseServiceRoleKey) {
//     throw new Error('Missing Supabase URL or Service Role Key in environment variables.');
//   }

//   return createClient(supabaseUrl, supabaseServiceRoleKey, {
//     auth: {
//       autoRefreshToken: false,
//       persistSession: false,
//       // detectSessionInUrl: false // For server-side, often not needed
//     }
//   });
// }

// console.log(`Function ${new URL(import.meta.url).pathname} loaded successfully.`); 