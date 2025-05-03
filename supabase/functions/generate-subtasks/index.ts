/// <reference lib="deno.ns" />
/// <reference types="jsr:@supabase/functions-js/edge-runtime" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Niet nodig hier

// --- CORS Headers ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Pas aan voor productie
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
// --- Einde CORS Headers ---

// --- Interfaces ---
interface TaskDetails {
  title: string;
  description?: string;
  priority?: string;
  deadline?: string;
}

interface SubtaskSuggestion {
  title: string;
}

interface FunctionResponse {
  subtasks?: SubtaskSuggestion[];
  error?: string;
}
// --- Einde Interfaces ---

console.log("generate-subtasks function started");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract data from request
    const taskDetails: TaskDetails = await req.json();
    console.log("Received task details:", taskDetails);

    if (!taskDetails.title) {
      throw new Error("Task title is required");
    }

    // 2. Load API Keys
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) throw new Error("OPENAI_API_KEY environment variable not set");

    // --- Werkelijke AI Logica ---
    // Construeer de prompt
    const systemPrompt = `Je bent een AI-assistent gespecialiseerd in het opsplitsen van complexe taken in concrete, behapbare subtaken.

Gegeven een taakbeschrijving, genereer een lijst van logische, actiegerichte subtaken die een gebruiker één voor één kan uitvoeren om de hoofdtaak succesvol te voltooien. Zorg dat elke stap klein, duidelijk en zelfstandig uitvoerbaar is, indien mogelijk in logische volgorde. Houd rekening met prioriteiten en deadlines als die vermeld zijn.

Formatteer de output als een JSON-array van objecten met telkens een "title"-sleutel, bijvoorbeeld:
[{ "title": "Subtaak 1" }, { "title": "Subtaak 2" }]

Geef uitsluitend de JSON-array terug — geen toelichting of extra tekst.
`;

    let userPromptContent = `Taak Titel: ${taskDetails.title}\n`;
    if (taskDetails.description) {
      userPromptContent += `Beschrijving: ${taskDetails.description}\n`;
    }
    if (taskDetails.priority) {
      userPromptContent += `Prioriteit: ${taskDetails.priority}\n`;
    }
    if (taskDetails.deadline) {
      // Controleer of deadline geldig is voordat je formatteert
      try {
        userPromptContent += `Deadline: ${new Date(taskDetails.deadline).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric'})}\n`; 
      } catch (dateError) {
        console.warn("Kon deadline niet parsen voor prompt:", taskDetails.deadline);
      }
    }

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
       // Aangepaste fallback voor het geval de root al de array *is* (onwaarschijnlijk nu, maar voor robuustheid)
       try {
         const fallbackArray = JSON.parse(aiContent);
         if (Array.isArray(fallbackArray) && fallbackArray.every(item => typeof item === 'object' && item !== null && 'title' in item && typeof item.title === 'string')) {
            generatedSubtasks = fallbackArray as SubtaskSuggestion[];
            console.warn("AI response was directly an array, not the expected object. Used direct array.");
         } else {
            throw new Error("Fallback parsing failed or resulted in invalid array format.");
         }
       } catch (fallbackError) {
          console.error("Fallback parsing also failed:", fallbackError);
          throw new Error("Kon geen valide subtaken array extraheren uit AI antwoord: " + aiContent);
       }
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