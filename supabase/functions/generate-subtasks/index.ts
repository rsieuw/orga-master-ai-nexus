/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Verwijderd of uitgecommentarieerd
import { corsHeaders } from "../_shared/cors.ts";
import { format, parseISO } from 'date-fns';
import { enUS, nl } from 'date-fns/locale';
import OpenAI from 'https://esm.sh/openai@^4.26.0';

// --- CORS Headers ---
// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Adjust for production
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };
// --- End CORS Headers ---

// --- Interfaces ---
interface SubtaskSuggestion {
  title: string;
  description?: string;
}

// --- New Interfaces for Data Fetching ---
// interface ChatMessage { ... }
// interface Note { ... }
// interface ResearchResult { ... }

// --- End New Interfaces ---

// console.log("generate-subtasks function started - v2 (with context)");

interface RequestBody {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  taskPriority?: string;
  taskDeadline?: string;
  languagePreference: string;
  existingSubtaskTitles?: string[];
  // Optioneel velden voor extra context als je die direct meegeeft ipv op te halen
  chatMessages?: { role: string; content: string; created_at: string; message_type?: string }[];
  notes?: { content: string; created_at: string }[];
  researchResults?: { research_content: string; created_at: string }[];
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

interface FunctionSuccessResponse {
  subtasks: SubtaskSuggestion[];
}

interface FunctionErrorResponse {
  error: string;
  details?: string;
}

serve(async (req) => {
  // console.log("generate-subtasks function invoked at: ", new Date().toISOString()); // Retain for now if useful for debugging
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  let currentLangErrorMessages = errorMessages.en; // Default to English

  try {
    const requestBody = await req.json() as RequestBody;
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

    currentLangErrorMessages = errorMessages[languagePreference as keyof typeof errorMessages] || errorMessages.en;

    if (!taskId) {
      throw new Error(currentLangErrorMessages.missingTaskId);
    }

    if (!taskTitle || !languagePreference) {
      throw new Error(currentLangErrorMessages.requestMissingParams);
    }
    if (!openAIApiKey) {
      throw new Error(currentLangErrorMessages.missingOpenAiKey);
    }

    const locale = languagePreference.startsWith('nl') ? nl : enUS;
    const formattedDeadline = taskDeadline ? format(parseISO(taskDeadline), 'PPP', { locale }) : currentLangErrorMessages.noDeadline;

    let systemPrompt = `You are an AI assistant specialized in breaking down tasks into actionable subtasks. Your goal is to provide a concise list of 5-7 relevant subtasks. Each subtask must have a "title" (string, action-oriented) and may have a "description" (string, 1-2 sentences for clarification). Consider priority and deadline if provided. Output a valid JSON object with a single key "subtasks", which is an array of these subtask objects. Example: {"subtasks": [{"title": "Titel 1", "description": "Beschrijving 1."}]}. The language for subtasks should match the task title's language (${languagePreference.startsWith('nl') ? 'Dutch' : 'English'}).`;

    if (existingSubtaskTitles && existingSubtaskTitles.length > 0) {
      systemPrompt += `\n\nIMPORTANT: The following subtasks already exist. Do NOT generate duplicates. Focus on NEW, UNIQUE, and COMPLEMENTARY subtasks:\n- ${existingSubtaskTitles.join('\n- ')}\nIf many subtasks exist, refine or add what's missing. If the task is well-divided, generate fewer or no new subtasks.`;
    }

    let userPromptContent = `**Main Task:**\nTitle: "${taskTitle}"\n`;
    if (taskDescription) userPromptContent += `Description: "${taskDescription}"\n`;
    if (taskPriority && taskPriority !== 'none') userPromptContent += `Priority: ${taskPriority}\n`;
    if (taskDeadline) userPromptContent += `Deadline: ${formattedDeadline}\n`;

    if (chatMessages && chatMessages.length > 0) {
      userPromptContent += `\n**Chat History (most recent ${chatMessages.length > 10 ? 10 : chatMessages.length} messages):**\n`;
      chatMessages.slice(-10).forEach(msg => {
        const prefix = msg.message_type === 'research_result' ? '[RESEARCH RESULT] ' : '';
        userPromptContent += `- ${msg.role === 'user' ? 'User' : 'AI'} (${new Date(msg.created_at).toLocaleTimeString(languagePreference)}): ${prefix}${msg.content}\n`;
      });
    }

    if (notes && notes.length > 0) {
      userPromptContent += `\n**Notes:**\n`;
      notes.forEach(note => {
        userPromptContent += `- ${note.content} (${new Date(note.created_at).toLocaleTimeString(languagePreference)})\n`;
      });
    }

    if (researchResults && researchResults.length > 0) {
      userPromptContent += `\n**Research Results (Summaries):**\n`;
      researchResults.forEach(res => {
        userPromptContent += `- ${res.research_content.substring(0, 300)}...\n`;
      });
    }
    userPromptContent += `\nNow, generate the subtasks based on all the provided context.`;
    
    const openai = new OpenAI({ apiKey: openAIApiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPromptContent },
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.4, // Adjusted for more focused output
      max_tokens: 1200, // Adjusted based on increased context
    });

    if (!completion.choices?.[0]?.message?.content) {
      console.error("OpenAI API response missing expected content structure:", completion);
      throw new Error(currentLangErrorMessages.aiInvalidStructure);
    }

    const rawData = completion.choices[0].message.content.trim();
    let parsedJson: { subtasks?: unknown }; // Expect an object with a subtasks key
    try {
      parsedJson = JSON.parse(rawData) as { subtasks?: unknown };
    } catch (jsonParseError) {
      const err = jsonParseError as Error;
      console.error("Failed to parse OpenAI JSON response:", err, "Raw data:", rawData);
      throw new Error(currentLangErrorMessages.aiJsonParseFailed + `: ${err.message}`);
    }

    if (typeof parsedJson !== 'object' || parsedJson === null || !('subtasks' in parsedJson)) {
      console.error("Parsed JSON is not an object, is null, or missing 'subtasks' key. Raw data:", rawData, "Parsed:", parsedJson);
      throw new Error(currentLangErrorMessages.aiSubtasksExtractionFailed + ": Parsed JSON structure incorrect.");
    }

    const subtasksArray = parsedJson.subtasks;
    if (!Array.isArray(subtasksArray)) {
      console.error("'subtasks' key in JSON response is not an array. Parsed JSON:", parsedJson);
      throw new Error(currentLangErrorMessages.aiSubtasksInvalidFormat + ": 'subtasks' is not an array.");
    }

    const validatedSubtasks: SubtaskSuggestion[] = subtasksArray.filter((item: unknown): item is SubtaskSuggestion => {
      const subItem = item as Partial<SubtaskSuggestion>; // Type assertion for checking
      const isValid = typeof subItem.title === 'string' && subItem.title.trim() !== '' &&
                      (subItem.description === undefined || typeof subItem.description === 'string');
      if (!isValid) {
        console.warn("Invalid subtask item filtered out:", item);
      }
      return isValid;
    });

    const responsePayload: FunctionSuccessResponse = { subtasks: validatedSubtasks };
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    const error = e as Error;
    // Try to get languagePreference from request body for error message localization, if possible
    // This is a bit tricky as req.json() can only be consumed once.
    // For simplicity, currentLangErrorMessages initialized earlier will be used.
    // If request parsing failed early, it defaults to English.
    
    console.error(`Error in generate-subtasks function: ${error.name} - ${error.message}`, error.stack);

    const responsePayload: FunctionErrorResponse = {
      error: error.message || currentLangErrorMessages.functionExecError,
      details: error.stack,
    };
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, 
    });
  }
}); 