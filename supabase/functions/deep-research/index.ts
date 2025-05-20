/**
 * @fileoverview Supabase Edge Function for performing deep research and content generation.
 * This function supports multiple modes (research, instruction, creative) and can use
 * different AI model providers (Perplexity, OpenAI).
 * It takes a user query, description, context, language preference, task ID, mode, and model provider
 * as input, and returns a structured research result or generated content.
 */

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import standard libraries if needed (e.g., for CORS)
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Interface for a single choice in the API response.
 */
interface ApiChoice {
  message: { content: string; [key: string]: unknown };
  sources?: unknown[];
}

/**
 * Interface for API usage statistics (e.g., token counts).
 */
interface ApiUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/**
 * Interface for the overall structure of the API response data.
 */
interface ApiRespData {
  choices?: ApiChoice[];
  usage?: ApiUsage;
  model?: string;
  id?: string;
  error?: { message: string; [key: string]: unknown };
}

/**
 * @typedef {Object} RequestBody
 * @property {string} [query="Geen onderzoeksvraag opgegeven"] - The main research query or task.
 * @property {string} [description=""] - Additional specific requirements or description for the task.
 * @property {string} [contextQuery=""] - Contextual information for the main task.
 * @property {'nl' | 'en'} [languagePreference='nl'] - The preferred language for the response.
 * @property {string} [taskId="none"] - The ID of the task associated with this research.
 * @property {'research' | 'instruction' | 'creative'} [mode='research'] - The mode of operation.
 * @property {'perplexity-sonar' | 'openai-gpt4o'} [modelProvider='perplexity-sonar'] - The AI model provider to use.
 * @property {string} [testParam] - Optional parameter for testing purposes.
 */

/**
 * Interface for a citation object.
 */
interface Citation {
  number: number;
  text: string;
  url?: string;
  title?: string;
}

/**
 * Interface for a source object from an external API (e.g., Perplexity).
 */
interface ExternalApiSource {
  title?: string;
  name?: string; // Used as a fallback for title
  url?: string;
  // Allow other, unknown properties without type errors
  [key: string]: unknown;
}

/**
 * Extract citations from a response text.
 * @param {string} responseText - The response text containing citations.
 * @param {ExternalApiSource[] | undefined} sources - The sources array from the API response.
 * @returns {Citation[]} - Array of extracted citations.
 */
function extractCitations(
  responseText: string,
  sources: ExternalApiSource[] | undefined,
): Citation[] {
  console.log(
    `[deep-research] extractCitations called. responseText length: ${responseText?.length}, sources provided: ${!!sources?.length}`
  );
  const citations: Citation[] = [];

  if (!sources || sources.length === 0) {
    console.log('[deep-research] extractCitations: Using fallback logic (no structured sources).');
    const citationRegex = /\[(\d+)\]/g; // Corrected Regex to find [1], [2], etc.
    let match;
    const foundNumbers = new Set<number>();

    // Optionally log the full responseText if issues persist, but be mindful of log length
    // console.log(`[deep-research] extractCitations Fallback: responseText for regex (first 500 chars): \"${responseText?.substring(0, 500)}\"`);

    while ((match = citationRegex.exec(responseText)) !== null) {
      const number = parseInt(match[1]);
      // console.log(
      //   `[deep-research] extractCitations Fallback: Regex found match: \"${match[0]}\", extracted number: ${number}. Current foundNumbers: ${
      //     JSON.stringify(Array.from(foundNumbers))
      //   }`,
      // );
      if (!foundNumbers.has(number)) {
        citations.push({
          number: number,
          text: `Source ${number}`, // Placeholder text
          // url and title will be undefined here as we only have the number from regex
        });
        foundNumbers.add(number);
        // console.log(
        //   `[deep-research] extractCitations Fallback: Added citation for number ${number}. Citations array now: ${
        //     JSON.stringify(citations)
        //   }`,
        // );
      // } else {
        // console.log(
        //   `[deep-research] extractCitations Fallback: Number ${number} already processed, skipping.`,
        // );
      }
    }
    // if (citations.length === 0 && responseText?.includes('[')) { // Check if regex missed obvious citations
    //   console.log(
    //     '[deep-research] extractCitations Fallback: No citations extracted by regex, despite \"[\" character in responseText. Investigate regex or text.',
    //   );
    // } else if (citations.length === 0) {
    //   console.log(
    //     '[deep-research] extractCitations Fallback: No citations found or extracted by regex.',
    //   );
    // }
    // console.log(
    //   `[deep-research] extractCitations Fallback: Final extracted citations (before sort): ${
    //     JSON.stringify(citations)
    //   }`,
    // );
    return citations.sort((a, b) => a.number - b.number);
  } else {
    console.log('[deep-research] extractCitations: Using structured sources logic.');
    sources.forEach((source: ExternalApiSource, index: number) => {
      // Perplexity API docs suggest sources are 1-indexed in text, matching array index + 1
      const citationNumber = index + 1;
      // console.log(
      //   `[deep-research] extractCitations Structured: Processing source index ${index} (citation number ${citationNumber}). Source data: ${
      //     JSON.stringify(source)
      //   }`,
      // );

      // Ensure the responseText actually contains a citation for this source number
      if (responseText.includes(`[${citationNumber}]`)) {
        citations.push({
          number: citationNumber,
          text: source.title || source.name || `Source ${citationNumber}`, // Use source.name as another fallback
          url: source.url,
          title: source.title || source.name,
        });
        // console.log(
        //   `[deep-research] extractCitations Structured: Added citation for number ${citationNumber} due to its presence in responseText.`,
        // );
      // } else {
        // console.log(
        //   `[deep-research] extractCitations Structured: ResponseText does not include \"[${citationNumber}]\". Skipping source index ${index}.`,
        // );
      }
    });
    // console.log(
    //   `[deep-research] extractCitations Structured: Final extracted citations (before sort): ${
    //     JSON.stringify(citations)
    //   }`,
    // );
    return citations.sort((a, b) => a.number - b.number);
  }
}

/**
 * Main Deno server function that handles incoming HTTP requests for deep research.
 * - Handles CORS preflight requests.
 * - Parses the request body for parameters.
 * - Validates required parameters (query, taskId).
 * - Checks for and retrieves necessary API keys (Perplexity, OpenAI).
 * - Constructs the appropriate system prompt based on the selected mode and language.
 * - Calls the selected AI model provider's API.
 * - Formats the response, including citations if applicable (for Perplexity).
 * - Returns the research result or an error.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Promise<Response>} A promise that resolves to an HTTP response object.
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Begin simple test log ---
  console.log("[deep-research] Function invoked. Method:", req.method, "URL:", req.url);
  // --- End simple test log ---

  // Client for user-specific logging (using user's auth context)
  const userSpecificSupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? '',
    Deno.env.get("SUPABASE_ANON_KEY") ?? '', 
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
    console.warn("[deep-research] SUPABASE_SERVICE_ROLE_KEY not set. Logging to user_api_logs might be restricted by RLS.");
  }

  let userIdForLogging: string | undefined;
  const functionNameForLogging = 'deep-research';
  let requestBodyForLogging: Record<string, unknown> = {};
  
  let externalApiModelUsed: string | undefined;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let totalTokens: number | undefined;
  let externalApiError: { status?: number; message: string; body?: unknown; provider?: string } | null = null;

  try {
    const { data: { user } } = await userSpecificSupabaseClient.auth.getUser();
    userIdForLogging = user?.id;

    const rawBody = await req.text();
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
    } catch (parseError: unknown) {
      console.error("[deep-research] Error parsing JSON:", parseError);
      // Log failure if possible
      if (userIdForLogging) {
        try {
            // Try to log with admin client if it exists, otherwise user client
            const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient;
            await loggingClient.from('user_api_logs').insert({
                user_id: userIdForLogging,
                function_name: functionNameForLogging,
                metadata: { success: false, error: 'Invalid JSON in request body', rawError: String(parseError) },
            });
        } catch (logErr) {
            console.error("[deep-research] Failed to log JSON parse error to user_api_logs", logErr);
        }
      }
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body", 
          message: parseError instanceof Error ? parseError.message : "JSON parse error"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { 
      query = "Geen onderzoeksvraag opgegeven",
      description = "", 
      contextQuery = "", 
      languagePreference: reqLanguagePreference = "nl", 
      taskId = "none", 
      mode = 'research',
      modelProvider = 'perplexity-sonar'
    } = requestData;
    
    requestBodyForLogging = {
        queryProvided: query !== "Geen onderzoeksvraag opgegeven",
        queryLength: query?.length,
        descriptionProvided: !!description,
        contextQueryProvided: !!contextQuery,
        languagePreference: reqLanguagePreference,
        taskId,
        mode,
        modelProvider
    };
    
    const serviceNameForLogging = modelProvider.startsWith('perplexity') ? 'PerplexityAI' : 'OpenAI';

    if (!query || query === "Geen onderzoeksvraag opgegeven" || !taskId || taskId === "none") {
      console.error("[deep-research] Missing required parameters, query:", query, "taskId:", taskId);
      throw new Error("deepResearch.error.missingQueryOrTaskId"); // Will be caught and logged
    }

    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    
    const usePerplexity = modelProvider === 'perplexity-sonar';
    
    if ((usePerplexity && !perplexityApiKey) || (!usePerplexity && !openAIApiKey)) {
      const errorKey = usePerplexity ? "deepResearch.error.perplexityApiKeyNotSet" : "deepResearch.error.openAIApiKeyNotSet";
      console.error("[deep-research] API key not set:", errorKey);
      throw new Error(errorKey); // Will be caught and logged
    }

    let systemContent = "";
    let apiEndpoint = "";
    let apiKey = "";
    // let apiModel = ""; // Renamed to externalApiModelUsed
    
    if (usePerplexity) {
      apiEndpoint = 'https://api.perplexity.ai/chat/completions';
      apiKey = perplexityApiKey!;
      externalApiModelUsed = "sonar-pro"; // Perplexity model, was "sonar-medium-chat"
    } else {
      apiEndpoint = 'https://api.openai.com/v1/chat/completions';
      apiKey = openAIApiKey!;
      externalApiModelUsed = "gpt-4o-mini"; // OpenAI model
    }

    // Switch for systemContent (condensed, assuming it's defined correctly as per original logic)
    // don't change the systemContent for the instruction mode, it's already correct
    switch (mode) {
      case 'instruction':
        if (reqLanguagePreference === 'nl') {
          systemContent = `Je bent een deskundige instructeur en mentor. Je doel is om complexe onderwerpen en taken op te splitsen in duidelijke, begrijpelijke en uitvoerbare stappen.
Geef gedetailleerde instructies naar aanleiding van de gebruikersvraag, gepresenteerd als een stapsgewijze lijst (bijvoorbeeld genummerd of met bullet points). Elke stap moet helder en beknopt zijn.
Structureer je antwoord logisch. Gebruik waar mogelijk voorbeelden, analogieën of scenario's om het begrip van elke stap te vergroten. Gebruik tabellen om data overzichtelijk te presenteren waar dit relevant is.
Indien van toepassing, wijs op mogelijke valkuilen of geef tips voor succes bij specifieke stappen.
Zorg ervoor dat de instructies direct toepasbaar zijn voor de gebruiker.
Citeer je bronnen duidelijk in de tekst met genummerde verwijzingen tussen vierkante haken (bijv. [1], [2]).
Voeg aan het einde van je antwoord een aparte sectie toe voor de bronvermelding. Gebruik de titel "Bronnen" als een HTML <h2> heading. Direct na deze titel plaats elke bron op een nieuwe regel met een HTML <br /> tag tussen elke bron (behalve na de laatste). Lijst elke bron op met het bijbehorende nummer, de volledige titel van de bron, en een directe, werkende URL naar de bron.
De bronnensectie moet er als volgt uitzien:
<h2>Bronnen</h2>
1. <a href="https://voorbeeld.url/bron1">Titel van Bron 1</a><br />
2. <a href="https://voorbeeld.url/bron2">Titel van Bron 2</a>
Antwoord in het Nederlands.`;
        } else {
          systemContent = `You are an expert instructor and mentor. Your goal is to break down complex topics and tasks into clear, understandable, and actionable steps.
Provide detailed instructions based on the user's query, presented as a step-by-step list (e.g., numbered or using bullet points). Each step should be clear and concise.
Structure your response logically. Where possible, use examples, analogies, or scenarios to enhance understanding of each step. Use tables to present data clearly where relevant.
If applicable, point out potential pitfalls or provide tips for success for specific steps.
Ensure the instructions are directly applicable for the user.
Cite your sources clearly in the text using numbered references in square brackets (e.g., [1], [2]).
At the end of your response, include a separate section for source citation. Use the title "Sources" as an HTML <h2> heading. Immediately after this heading, place each source on a new line with an HTML <br /> tag between each source (except after the last one). List each source with its corresponding number, the full title of the source, and a direct, working URL to the source.
The sources section should look like this:
<h2>Sources</h2>
1. <a href="https://example.url/source1">Title of Source 1</a><br />
2. <a href="https://example.url/source2">Title of Source 2</a>
Respond in English.`;
        }
        break;
      case 'creative':
        if (reqLanguagePreference === 'nl') {
          systemContent = `Je bent een buitengewoon creatieve denker, een bron van inspiratie en innovatie. Je bent bedreven in het genereren van originele ideeën, het bedenken van meeslepende verhalen, het oplossen van problemen met onconventionele methoden en het brainstormen over grensverleggende concepten.
Ga volledig los op de gebruikersvraag. Genereer diverse en fantasierijke ideeën, schrijf boeiende (korte) verhalen, ontwikkel unieke oplossingen of brainstorm zonder beperkingen.
Denk buiten de gebaande paden. Wees origineel, verrassend en inspirerend.
Structureer je output op een manier die de creatieve stroom van ideeën goed weergeeft, eventueel met verschillende opties of invalshoeken. Gebruik tabellen om data overzichtelijk te presenteren waar dit relevant is.
Citeer je bronnen duidelijk in de tekst met genummerde verwijzingen tussen vierkante haken (bijv. [1], [2]).
Voeg aan het einde van je antwoord een aparte sectie toe voor de bronvermelding. Gebruik de titel "Bronnen" als een HTML <h2> heading. Direct na deze titel plaats elke bron op een nieuwe regel met een HTML <br /> tag tussen elke bron (behalve na de laatste). Lijst elke bron op met het bijbehorende nummer, de volledige titel van de bron, en een directe, werkende URL naar de bron.
De bronnensectie moet er als volgt uitzien:
<h2>Bronnen</h2>
1. <a href="https://voorbeeld.url/bron1">Titel van Bron 1</a><br />
2. <a href="https://voorbeeld.url/bron2">Titel van Bron 2</a>
Antwoord in het Nederlands.`;
        } else {
          systemContent = `You are an exceptionally creative thinker, a wellspring of inspiration and innovation. You are adept at generating original ideas, crafting compelling narratives, solving problems with unconventional methods, and brainstorming groundbreaking concepts.
Unleash your full creative potential on the user's query. Generate diverse and imaginative ideas, write engaging (short) stories, develop unique solutions, or brainstorm without limitations.
Think outside the box. Be original, surprising, and inspiring.
Structure your output in a way that effectively conveys the creative flow of ideas, possibly with different options or perspectives. Use tables to present data clearly where relevant.
Cite your sources clearly in the text using numbered references in square brackets (e.g., [1], [2]).
At the end of your response, include a separate section for source citation. Use the title "Sources" as an HTML <h2> heading. Immediately after this heading, place each source on a new line with an HTML <br /> tag between each source (except after the last one). List each source with its corresponding number, the full title of the source, and a direct, working URL to the source.
The sources section should look like this:
<h2>Sources</h2>
1. <a href="https://example.url/source1">Title of Source 1</a><br />
2. <a href="https://example.url/source2">Title of Source 2</a>
Respond in English.`;
        }
        break;
      case 'research':
      default:
        if (reqLanguagePreference === 'nl') {
          systemContent = `Je bent een professionele onderzoeker. Voer grondig onderzoek uit naar de gebruikersquery.
Lever een uitgebreid en goed gestructureerd antwoord in het Nederlands. Gebruik tabellen om data overzichtelijk te presenteren waar dit relevant is.
Citeer je bronnen duidelijk in de tekst met genummerde verwijzingen tussen vierkante haken (bijv. [1], [2]).
Voeg aan het einde van je antwoord een aparte sectie toe voor de bronvermelding. Gebruik de titel "Bronnen" als een HTML <h2> heading. Direct na deze titel plaats elke bron op een nieuwe regel met een HTML <br /> tag tussen elke bron (behalve na de laatste). Lijst elke bron op met het bijbehorende nummer, de volledige titel van de bron, en een directe, werkende URL naar de bron.
De bronnensectie moet er als volgt uitzien:
<h2>Bronnen</h2>
1. <a href="https://voorbeeld.url/bron1">Titel van Bron 1</a><br />
2. <a href="https://voorbeeld.url/bron2">Titel van Bron 2</a>`;
        } else {
          systemContent = `You are a professional researcher. Conduct thorough research based on the user's query.
Provide a comprehensive and well-structured answer in English. Use tables to present data clearly where relevant.
Cite your sources clearly in the text using numbered references in square brackets (e.g., [1], [2]).
At the end of your response, include a separate section for source citation. Use the title "Sources" as an HTML <h2> heading. Immediately after this heading, place each source on a new line with an HTML <br /> tag between each source (except after the last one). List each source with its corresponding number, the full title of the source, and a direct, working URL to the source.
The sources section should look like this:
<h2>Sources</h2><br />
1. <a href="https://example.url/source1">Title of Source 1</a><br />
2. <a href="https://example.url/source2">Title of Source 2</a>`;
        }
        break;
    }

    let combinedQuery = query;
    if (description && description.trim() !== "") {
      if (reqLanguagePreference === 'nl') {
        combinedQuery = `${query} (met betrekking tot de subtaak: ${description})`;
      } else {
        combinedQuery = `${query} (regarding the subtask: ${description})`;
      }
    }

    const messages = [{ role: "system", content: systemContent }, { role: "user", content: combinedQuery }];
    const requestBody = {
      model: externalApiModelUsed,
      messages: messages,
      // Perplexity specific settings if any, or general settings like temperature
      // temperature: 0.7, // Example
    };

    let responseText = '';
    let responseCitations: unknown[] | undefined;
    let responseData: ApiRespData | null = null;


    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: "Failed to parse error response from API" }));
        externalApiError = {
          status: response.status,
          message: `API request failed with status ${response.status}: ${errorBody?.error?.message || JSON.stringify(errorBody)}`,
          body: errorBody,
          provider: serviceNameForLogging
        };
      } else {
        responseData = await response.json() as ApiRespData;
        const choices = responseData?.choices; 
        const firstChoice = choices?.[0];

        if (usePerplexity && firstChoice) {
            responseText = firstChoice.message?.content || '';
            // Transform the sources structure to meet our UI requirements
            // First determine the source object from the API
            const rawSources = firstChoice?.sources;
            
            // Ensure that the sources are transformed to the expected format
            if (Array.isArray(rawSources) && rawSources.length > 0) {
                responseCitations = rawSources.map(source => {
                    // Perplexity sources have different formats, check for common properties
                    if (typeof source === 'object' && source !== null) {
                        // Type assertion to allow property access
                        const sourceObj = source as Record<string, unknown>;
                        return {
                            url: (sourceObj.url as string) || (sourceObj.link as string) || (sourceObj.uri as string) || '#',
                            title: (sourceObj.title as string) || (sourceObj.name as string) || (sourceObj.text as string) || (sourceObj.url as string) || 'Bron'
                        };
                    } else if (typeof source === 'string') {
                        return {
                            url: source,
                            title: source
                        };
                    }
                    // Fallback for unknown source structures
                    return {
                        url: '#',
                        title: 'Bron'
                    };
                });
            } else if (responseText) {
                // If there are no sources, try to extract them from the markdown text
                responseCitations = extractCitations(responseText, undefined);
            }
        } else if (!usePerplexity && firstChoice) {
            responseText = firstChoice.message?.content || '';

            const usage = responseData?.usage;
            promptTokens = usage?.prompt_tokens;
            completionTokens = usage?.completion_tokens;
            totalTokens = usage?.total_tokens;
            externalApiModelUsed = responseData?.model || externalApiModelUsed;
            
            // Process any source citations in the OpenAI response
            // Since OpenAI doesn't have a specified source format,
            // we try to extract sources from the generated text
            if (responseText) {
                // Probeer bronnen uit de tekst te extraheren
                const extractedCitations = extractCitations(responseText, undefined);
                if (extractedCitations.length > 0) {
                    responseCitations = extractedCitations;
                }
            }
        }
        if (!responseText && responseData && !responseData.error) {
            externalApiError = { message: "No content in API response", body: responseData, provider: serviceNameForLogging };
        }
      }
    } catch (e: unknown) {
        console.error(`[deep-research] Fetch to ${serviceNameForLogging} API failed:`, e);
        externalApiError = {
            message: e instanceof Error ? e.message : `Request to ${serviceNameForLogging} failed.`,
            provider: serviceNameForLogging,
            status: (typeof e === 'object' && e !== null && typeof (e as Record<string, unknown>).status === 'number') 
                ? (e as Record<string, unknown>).status as number 
                : undefined
        };
    }

    // Log external API call
    try {
        await userSpecificSupabaseClient.from('external_api_usage_logs').insert({
            user_id: userIdForLogging,
            task_id: taskId,
            service_name: serviceNameForLogging,
            function_name: 'chatCompletions', // Or a more specific name if applicable
            tokens_prompt: promptTokens,
            tokens_completion: completionTokens,
            tokens_total: totalTokens,
            metadata: {
                model: externalApiModelUsed,
                mode,
                languagePreference: reqLanguagePreference,
                success: !externalApiError,
                error: externalApiError ? externalApiError : undefined,
                // response_id: responseData?.id, // If available
            },
        });
    } catch (logError) {
        console.error(`[deep-research] Failed to log to external_api_usage_logs for ${serviceNameForLogging}`, logError);
    }

    if (externalApiError) {
        throw new Error(externalApiError.message); // Will be caught by main try-catch
    }
    if (!responseText && mode !== 'creative') { // Creative mode might have only structured data
        // For research/instruction, text is expected.
        // This condition might need adjustment based on how creative mode returns data.
        throw new Error("deepResearch.error.noContentFromAI");
    }
    
    // Log internal API call SUCCESS
    console.log('[deep-research] Attempting to log SUCCESS to user_api_logs...'); // NIEUWE LOG
    try {
      // Use admin client for user_api_logs if available
      const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient;
      console.log('[deep-research] Using logging client:', supabaseAdminLoggingClient ? 'AdminClient' : 'UserSpecificClient'); // NIEUWE LOG
      const { data: logData, error: logError } = await loggingClient.from('user_api_logs').insert({ // Voeg data en error toe
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { 
          ...requestBodyForLogging, 
          success: true, 
          responseContentLength: responseText.length,
          citationsCount: responseCitations?.length || 0,
          externalApiModelUsed, // Log the actual model used
          promptTokens, 
          completionTokens
        },
      }).select(); // Toevoegen van .select() kan helpen om de uitkomst te zien

      if (logError) { // Check expliciet op logError
        console.error('[deep-research] Error explicitly caught during SUCCESS log insert:', JSON.stringify(logError, null, 2)); // NIEUWE LOG
        // Overweeg hier geen error te throwen om de hoofdfunctie niet te breken
      } else {
        console.log('[deep-research] SUCCESS log insert response data:', JSON.stringify(logData, null, 2)); // NIEUWE LOG
      }
    } catch (logCatchError) { // Hernoem de catch variabele
      console.error('[deep-research] Exception during SUCCESS log to user_api_logs:', JSON.stringify(logCatchError, null, 2)); // Update log
    }
    
    // Clean the query for display purposes before returning
    let displayQuery = query;
    // Regex to match common research-initiating phrases (case-insensitive)
    const queryCleanPattern = /^(Kan je onderzoek doen|doe onderzoek naar|onderzoek naar|doe onderzoek|Verricht onderzoek naar|research|Can you research|Do research on|Research on|Perform research on)\s*:?\s*/i;
    displayQuery = displayQuery.replace(queryCleanPattern, '');

    // Remove leading/trailing single or double quotes that might remain
    displayQuery = displayQuery.replace(/^['"]|['"]$/g, '');

    // Return the formatted research result
    return new Response(
      JSON.stringify({
        researchResult: responseText,
        citations: responseCitations,
        query: displayQuery, // Echo back the original query
        modelUsed: externalApiModelUsed,
        modeUsed: mode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    console.error("[deep-research] Main catch block error:", error);
    const errorKey = error instanceof Error && error.message.startsWith("deepResearch.error.") 
                   ? error.message 
                   : "deepResearch.error.general";
    
    // Log internal API call FAILURE
    console.log('[deep-research] Attempting to log FAILURE to user_api_logs...'); // NIEUWE LOG
    try {
      // Use admin client for user_api_logs if available
      const loggingClient = supabaseAdminLoggingClient || userSpecificSupabaseClient;
      console.log('[deep-research] Using logging client for FAILURE:', supabaseAdminLoggingClient ? 'AdminClient' : 'UserSpecificClient'); // NIEUWE LOG
      const { data: logData, error: logError } = await loggingClient.from('user_api_logs').insert({ // Voeg data en error toe
        user_id: userIdForLogging,
        function_name: functionNameForLogging,
        metadata: { 
          ...requestBodyForLogging, 
          success: false, 
          error: errorKey,
          rawErrorMessage: error instanceof Error ? error.message : String(error),
          externalApiError: externalApiError ? externalApiError : undefined, // Log external error if it occurred
          externalApiModelUsed,
          promptTokens,
          completionTokens
        },
      }).select(); // Toevoegen van .select()

      if (logError) { // Check expliciet op logError
        console.error('[deep-research] Error explicitly caught during FAILURE log insert:', JSON.stringify(logError, null, 2)); // NIEUWE LOG
      } else {
        console.log('[deep-research] FAILURE log insert response data:', JSON.stringify(logData, null, 2)); // NIEUWE LOG
      }
    } catch (logCatchError) { // Hernoem de catch variabele
      console.error('[deep-research] Exception during FAILURE log to user_api_logs:', JSON.stringify(logCatchError, null, 2)); // Update log
    }

    let responseStatus = 500;
    if (externalApiError && 
        Object.prototype.hasOwnProperty.call(externalApiError, 'status') && 
        typeof (externalApiError as { status?: number }).status === 'number') {
      responseStatus = (externalApiError as { status: number }).status;
    }

    return new Response(
      JSON.stringify({ 
        errorKey: errorKey,
        message: error instanceof Error ? error.message : "An unexpected error occurred."
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: responseStatus
      }
    );
  }
});