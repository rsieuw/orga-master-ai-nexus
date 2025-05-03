/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Importeer de Supabase client

// --- CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Pas aan voor productie
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
// --- Einde CORS Headers ---

// --- Interfaces ---
interface SubtaskSuggestion {
  title: string;
}

interface FunctionResponse {
  subtasks?: SubtaskSuggestion[];
  error?: string;
}

// --- Nieuwe Interfaces voor Data Ophalen ---
// interface ChatMessage { ... }
// interface Note { ... }
// interface ResearchResult { ... }

// --- Einde Nieuwe Interfaces ---

console.log("generate-subtasks function started - v2 (with context)");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from request - Nu verwachten we taskId
    const { taskId } = await req.json();
    console.log("Received taskId:", taskId);

    if (!taskId || typeof taskId !== 'string') { // Check of het een string is, pas type aan indien nodig (bv number)
      throw new Error("Valid taskId is required in the request body");
    }

    // 2. Load Environment Variables
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Service Role Key is veiliger hier, maar Anon voor nu

    if (!openAIApiKey) throw new Error("OPENAI_API_KEY environment variable not set");
    if (!supabaseUrl) throw new Error("SUPABASE_URL environment variable not set");
    if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY environment variable not set");

    // 3. Initialiseer Supabase Client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: req.headers.get('Authorization')! } } // Gebruik user's auth token
    });

    // 4. Haal data op uit Supabase
    console.log(`Fetching data for taskId: ${taskId}`);

    // Haal hoofdtaak details op
    const { data: taskData, error: taskError } = await supabase
      .from('tasks') // VERVANG 'tasks' met je daadwerkelijke tabelnaam
      .select('title, description, priority, deadline')
      .eq('id', taskId)
      .single();

    if (taskError) throw new Error(`Error fetching task: ${taskError.message}`);
    if (!taskData) throw new Error(`Task with ID ${taskId} not found.`);

    // Haal chatberichten op (Aanname: tabel 'chat_messages' met 'task_id')
    // Pas tabelnaam, kolommen en sortering aan indien nodig
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages') // Tabelnaam is correct
      .select('role, content, created_at') // Kolomnamen aangepast: sender->role, message->content
      .eq('task_id', taskId) // Filter op task_id
      .order('created_at', { ascending: true }); // Sorteer op tijd

    if (chatError) console.warn(`Could not fetch chat messages: ${chatError.message}`); // Ga door, maar log de waarschuwing

    // Haal notities op (Aanname: tabel 'notes' met 'task_id')
    // Pas aan indien nodig
    const { data: notes, error: notesError } = await supabase
      .from('task_notes') // Tabelnaam aangepast: notes -> task_notes
      .select('content, created_at') // Selecteer relevante kolommen
      .eq('task_id', taskId) // Filter op task_id
      .order('created_at', { ascending: true });

    if (notesError) console.warn(`Could not fetch notes: ${notesError.message}`);

    // Haal onderzoeksresultaten op (Aanname: tabel 'research_results' met 'task_id')
    // Pas aan indien nodig
    const { data: researchResults, error: researchError } = await supabase
      .from('saved_research') // Tabelnaam aangepast: research_results -> saved_research
      .select('research_content, created_at') // Kolomnamen aangepast: query/result_markdown -> research_content
      .eq('task_id', taskId) // Filter op task_id
      .order('created_at', { ascending: true });

    if (researchError) console.warn(`Could not fetch research results: ${researchError.message}`);

    // --- Werkelijke AI Logica ---
    // Construeer de prompt met de extra context
    const systemPrompt = `Je bent een AI-assistent gespecialiseerd in het opsplitsen van complexe taken in concrete, behapbare subtaken.

Gebruik de hoofdtaak, de bijbehorende chatgeschiedenis, notities en onderzoeksresultaten om een lijst van logische, actiegerichte subtaken te genereren. Deze subtaken moeten de gebruiker helpen de hoofdtaak succesvol te voltooien. Zorg dat elke stap klein, duidelijk en zelfstandig uitvoerbaar is, indien mogelijk in een logische volgorde. Houd rekening met prioriteiten en deadlines als die vermeld zijn.

Formatteer de output als een JSON-object met een enkele sleutel "subtasks" die een array van objecten bevat, elk met een "title" sleutel. Bijvoorbeeld:
{ "subtasks": [{ "title": "Subtaak 1" }, { "title": "Subtaak 2" }] }

Geef uitsluitend dit JSON-object terug — geen toelichting of extra tekst.
`; // System prompt licht aangepast voor JSON object output

    // Bouw de user prompt dynamisch op met de opgehaalde data
    let userPromptContent = `**Hoofdtaak:**\nTitel: ${taskData.title}\n`;
    if (taskData.description) userPromptContent += `Beschrijving: ${taskData.description}\n`;
    if (taskData.priority) userPromptContent += `Prioriteit: ${taskData.priority}\n`;
    if (taskData.deadline) {
      try {
        userPromptContent += `Deadline: ${new Date(taskData.deadline).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric'})}\n`;
      } catch (dateError) { console.warn("Kon deadline niet parsen:", taskData.deadline); }
    }

    if (chatMessages && chatMessages.length > 0) {
      userPromptContent += `\n**Chatgeschiedenis (laatste berichten eerst):**\n`;
      // Beperk eventueel de lengte, of neem alleen relevante berichten? Voor nu: alles (of laatste paar)
      const recentMessages = chatMessages.slice(-10); // Neem max laatste 10 berichten
      recentMessages.forEach(msg => {
        // Gebruik msg.role en msg.content ipv msg.sender en msg.message
        userPromptContent += `- ${msg.role === 'user' ? 'Gebruiker' : 'AI'} (${new Date(msg.created_at).toLocaleString('nl-NL')}): ${msg.content}\n`;
      });
    }

    if (notes && notes.length > 0) {
      userPromptContent += `\n**Notities:**\n`;
      notes.forEach(note => {
        userPromptContent += `- ${note.content} (${new Date(note.created_at).toLocaleString('nl-NL')})\n`;
      });
    }

    if (researchResults && researchResults.length > 0) {
      userPromptContent += `\n**Onderzoeksresultaten:**\n`;
      researchResults.forEach(res => {
        // Gebruik res.research_content en verwijder res.query
        userPromptContent += `Resultaat (samenvatting):\n${res.research_content.substring(0, 500)}...\n---\n`; // Neem eerste 500 chars
      });
    }

    userPromptContent += `\nGenereer nu de subtaken voor de bovenstaande hoofdtaak, gebruikmakend van alle verstrekte context.`;

    // Roep OpenAI aan
    console.log("Calling OpenAI to generate subtasks...");
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
      throw new Error(`OpenAI API request failed: ${completion.statusText} - ${errorBody?.error?.message || JSON.stringify(errorBody)}`);
    }

    // Parse de response
    const rawData = await completion.text(); 
    console.log("Raw OpenAI Response for subtasks:", rawData);

    // Definieer een type voor de verwachte OpenAI response structuur
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
      // Basisvalidatie
      if (!structuredData?.choices?.[0]?.message?.content) {
        throw new Error("Ongeldige structuur ontvangen van OpenAI API");
      }
    } catch (parseError) {
       console.error("Failed to parse OpenAI JSON response:", parseError, rawData);
       throw new Error("Kon het JSON antwoord van de AI niet parsen.");
    }

    const aiContent = structuredData?.choices?.[0]?.message?.content?.trim();
    if (!aiContent) {
       throw new Error("Geen content gevonden in AI antwoord.");
    }

    let generatedSubtasks: SubtaskSuggestion[];
    try {
      // Parse het *gehele* object dat de AI teruggeeft
      const parsedObject = JSON.parse(aiContent);

      // Haal de 'subtasks' array uit het object
      const subtasksArray = parsedObject.subtasks;

      // Valideer of de 'subtasks' property een geldige array is
      if (!Array.isArray(subtasksArray) || !subtasksArray.every(item => typeof item === 'object' && item !== null && 'title' in item && typeof item.title === 'string')) {
         console.error("AI response object does not contain a valid 'subtasks' array:", subtasksArray);
         throw new Error("AI antwoord bevat geen geldige 'subtasks' array.");
      }
      generatedSubtasks = subtasksArray as SubtaskSuggestion[];

    } catch (parseError) {
       console.error("Failed to parse AI content or extract subtasks array:", parseError, aiContent);
       // Verwijder de fallback logic, die is nu minder relevant door de expliciete JSON object structuur vraag.
       throw new Error("Kon geen valide subtaken array extraheren uit AI antwoord: " + aiContent);
    }

    console.log(`Generated ${generatedSubtasks.length} subtasks.`);
    // --- Einde Werkelijke AI Logica ---

    const responsePayload: FunctionResponse = { subtasks: generatedSubtasks };

    // Correct return statement inside try block
    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-subtasks:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const responsePayload: FunctionResponse = { error: errorMessage };
    // Correct return statement inside catch block
    return new Response(JSON.stringify(responsePayload), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 