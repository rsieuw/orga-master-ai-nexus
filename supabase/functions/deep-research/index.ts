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
 * @property {string} [query="No research question provided"] - The main research query or task.
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
  url: string;
  title: string;
}

/**
 * Interface for a source object from an external API (e.g., Perplexity).
 */
interface ExternalApiSource {
  title?: string;
  name?: string; // Used as a fallback for title
  url?: string;
  id?: string | number; // Allow id to be string or number
  // Allow other, unknown properties without type errors
  [key: string]: unknown;
}

/**
 * Extract citations from a response text.
 * @param {string} responseText - The response text containing citations.
 * @param {ExternalApiSource[] | undefined} sources - The sources array from the API response.
 * @param {string} languagePreference - The preferred language for the response.
 * @returns {Promise<Citation[]>} - Array of extracted citations.
 */
function extractCitations(
  responseText: string,
  sources: ExternalApiSource[] | undefined,
  languagePreference: 'nl' | 'en' = 'en'
): Promise<Citation[]> {
  let citations: Citation[] = [];
  const sourceText = languagePreference === 'nl' ? 'Bron' : 'Source';

  if (sources && sources.length > 0) {
    // Alleen bronnen met echte URLs toevoegen
    citations = sources
      .map((source: ExternalApiSource, index: number) => {
        const sourceTitle = source.title || source.name || `${sourceText} ${index + 1}`;
        const sourceUrl = source.url || '';
        
        // Alleen bronnen met een echte URL toevoegen
        if (sourceUrl && sourceUrl !== '#') {
          const citation: Citation = {
            number: typeof source.id === 'number' ? source.id : (index + 1),
            text: sourceTitle,
            title: sourceTitle,
            url: sourceUrl
          };
          return citation;
        }
        return null;
      })
      .filter((citation): citation is Citation => citation !== null);
  } else {
    // Bronnen uit de tekst extraheren
    const citationRegex = /\[(\d+)\](?:\s*\(((?:[^()]*|\([^()]*\))*)\))?/g;
    let match;
    const foundNumbers = new Set<number>();

    while ((match = citationRegex.exec(responseText)) !== null) {
      const number = parseInt(match[1]);
      if (!foundNumbers.has(number)) {
        const citationContent = match[2] || '';
        
        // Alleen toevoegen als er een URL in de citatie zit
        const urlMatch = citationContent.match(/https?:\/\/[^\s)"]+/);
        if (urlMatch) {
          const url = urlMatch[0];
          const title = citationContent.replace(url, '').trim() || `${sourceText} ${number}`;
          
          citations.push({
            number: number,
            text: title,
            url: url,
            title: title,
          });
          foundNumbers.add(number);
        }
      }
    }
  }

  // Sorteer de citations op nummer en verwijder duplicaten
  citations = citations
    .sort((a, b) => a.number - b.number)
    .filter((citation, index, self) => 
      index === self.findIndex((c) => c.number === citation.number)
    );

  // Als er geen geldige bronnen zijn, return een lege array
  return Promise.resolve(citations.length > 0 ? citations : []);
}

interface ExternalApiError {
  status?: number;
  message: string;
  body?: unknown;
  provider?: string;
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
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Client for user-specific logging (using user's auth context)
  const userSpecificSupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? '',
    Deno.env.get("SUPABASE_ANON_KEY") ?? '', 
    {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
      auth: { persistSession: false }
    }
  );

  let userIdForLogging: string | undefined;
  
  let externalApiModelUsed: string | undefined;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;
  let totalTokens: number | undefined;
  let externalApiError: ExternalApiError | null = null;

  try {
    const { data: { user } } = await userSpecificSupabaseClient.auth.getUser();
    userIdForLogging = user?.id;

    const rawBody = await req.text();
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
    } catch (parseError: unknown) {
      console.error("[deep-research] Error parsing JSON:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }

    const { 
      query = "No research question provided",
      description = "", 
      _contextQuery = "", 
      languagePreference: reqLanguagePreference = "nl", 
      taskId = "none", 
      mode = 'research',
      modelProvider = 'perplexity-sonar'
    } = requestData;
    
    const serviceNameForLogging = modelProvider.startsWith('perplexity') ? 'PerplexityAI' : 'OpenAI';

    if (!query || query === "No research question provided" || !taskId || taskId === "none") {
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
    
    if (usePerplexity) {
      apiEndpoint = 'https://api.perplexity.ai/chat/completions';
      apiKey = perplexityApiKey!;
      externalApiModelUsed = "sonar-pro"; // Teruggezet van sonar-deep-research
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

BELANGRIJK: Voor elke bron die je gebruikt:
1. Citeer deze in de tekst met genummerde verwijzingen tussen vierkante haken (bijv. [1], [2])
2. Zorg dat elke bron een duidelijke titel en URL heeft
3. Als je informatie uit een specifieke webpagina haalt, gebruik dan de exacte titel en URL van die pagina
4. Vermijd het gebruik van placeholder URLs ('#') - gebruik alleen echte, werkende URLs
5. Als een bron geen URL heeft, geef dan wel een duidelijke titel en beschrijving

Antwoord in het Nederlands.`;
        } else {
          systemContent = `You are an expert instructor and mentor. Your goal is to break down complex topics and tasks into clear, understandable, and actionable steps.
Provide detailed instructions based on the user's query, presented as a step-by-step list (e.g., numbered or using bullet points). Each step should be clear and concise.
Structure your response logically. Where possible, use examples, analogies, or scenarios to enhance understanding of each step. Use tables to present data clearly where relevant.
If applicable, point out potential pitfalls or provide tips for success for specific steps.
Ensure the instructions are directly applicable for the user.

IMPORTANT: For each source you use:
1. Cite it in the text using numbered references in square brackets (e.g., [1], [2])
2. Ensure each source has a clear title and URL
3. When using information from a specific webpage, use the exact title and URL of that page
4. Avoid using placeholder URLs ('#') - only use real, working URLs
5. If a source doesn't have a URL, still provide a clear title and description

Respond in English.`;
        }
        break;
      case 'creative':
        if (reqLanguagePreference === 'nl') {
          systemContent = `Je bent een buitengewoon creatieve denker, een bron van inspiratie en innovatie. Je bent bedreven in het genereren van originele ideeën, het bedenken van meeslepende verhalen, het oplossen van problemen met onconventionele methoden en het brainstormen over grensverleggende concepten.
Ga volledig los op de gebruikersvraag. Genereer diverse en fantasierijke ideeën, schrijf boeiende (korte) verhalen, ontwikkel unieke oplossingen of brainstorm zonder beperkingen.
Denk buiten de gebaande paden. Wees origineel, verrassend en inspirerend.
Structureer je output op een manier die de creatieve stroom van ideeën goed weergeeft, eventueel met verschillende opties of invalshoeken.

BELANGRIJK: Voor elke bron die je gebruikt:
1. Citeer deze in de tekst met genummerde verwijzingen tussen vierkante haken (bijv. [1], [2])
2. Zorg dat elke bron een duidelijke titel en URL heeft
3. Als je informatie uit een specifieke webpagina haalt, gebruik dan de exacte titel en URL van die pagina
4. Vermijd het gebruik van placeholder URLs ('#') - gebruik alleen echte, werkende URLs
5. Als een bron geen URL heeft, geef dan wel een duidelijke titel en beschrijving

Antwoord in het Nederlands.`;
        } else {
          systemContent = `You are an exceptionally creative thinker, a wellspring of inspiration and innovation. You are adept at generating original ideas, crafting compelling narratives, solving problems with unconventional methods, and brainstorming groundbreaking concepts.
Unleash your full creative potential on the user's query. Generate diverse and imaginative ideas, write engaging (short) stories, develop unique solutions, or brainstorm without limitations.
Think outside the box. Be original, surprising, and inspiring.
Structure your output in a way that effectively conveys the creative flow of ideas, possibly with different options or perspectives.

IMPORTANT: For each source you use:
1. Cite it in the text using numbered references in square brackets (e.g., [1], [2])
2. Ensure each source has a clear title and URL
3. When using information from a specific webpage, use the exact title and URL of that page
4. Avoid using placeholder URLs ('#') - only use real, working URLs
5. If a source doesn't have a URL, still provide a clear title and description

Respond in English.`;
        }
        break;
      case 'research':
      default:
        if (reqLanguagePreference === 'nl') {
          systemContent = `Je bent een professionele onderzoeker. Voer grondig onderzoek uit naar de gebruikersquery.
Lever een uitgebreid en goed gestructureerd antwoord in het Nederlands.

BELANGRIJK: Voor elke bron die je gebruikt:
1. Citeer deze in de tekst met genummerde verwijzingen tussen vierkante haken (bijv. [1], [2])
2. Zorg dat elke bron een duidelijke titel en URL heeft
3. Als je informatie uit een specifieke webpagina haalt, gebruik dan de exacte titel en URL van die pagina
4. Vermijd het gebruik van placeholder URLs ('#') - gebruik alleen echte, werkende URLs
5. Als een bron geen URL heeft, geef dan wel een duidelijke titel en beschrijving
6. Zorg dat elke bewering of feit wordt ondersteund door ten minste één bron
7. Gebruik recente en betrouwbare bronnen waar mogelijk

Gebruik tabellen om data overzichtelijk te presenteren waar dit relevant is.`;
        } else {
          systemContent = `You are a professional researcher. Conduct thorough research based on the user's query.
Provide a comprehensive and well-structured answer in English.

IMPORTANT: For each source you use:
1. Cite it in the text using numbered references in square brackets (e.g., [1], [2])
2. Ensure each source has a clear title and URL
3. When using information from a specific webpage, use the exact title and URL of that page
4. Avoid using placeholder URLs ('#') - only use real, working URLs
5. If a source doesn't have a URL, still provide a clear title and description
6. Ensure each claim or fact is supported by at least one source
7. Use recent and reliable sources where possible

Use tables to present data clearly where relevant.`;
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
                responseCitations = await extractCitations(
                  responseText, 
                  rawSources as ExternalApiSource[], 
                  reqLanguagePreference
                );
            } else if (responseText) {
                responseCitations = await extractCitations(responseText, undefined, reqLanguagePreference);
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
                const extractedCitations = await extractCitations(responseText, undefined, reqLanguagePreference);
                if (extractedCitations.length > 0) {
                    responseCitations = extractedCitations;
                }
            }
        } else {
            // Dit zou niet moeten gebeuren als de API call succesvol was en data retourneerde
            // Maar voor de zekerheid, als responseData.choices[0].message.content leeg is
            // of als responseData.choices[0] niet bestaat:
            if (!responseText) { // Controleer of responseText nog steeds leeg is
                console.error('[deep-research] No content in API response or API error not caught earlier.', responseData);
                throw new Error("deepResearch.error.emptyApiResponseContent");
            }
            // Als er hier wel responseText is, maar geen gestructureerde bronnen, probeer te extraheren
            if (responseText && (!responseCitations || responseCitations.length === 0)) {
                responseCitations = await extractCitations(responseText, undefined, reqLanguagePreference);
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
    
    // Clean the query for display purposes before returning
    let displayQuery = query;
    // Regex to match common research-initiating phrases (case-insensitive)
    const queryCleanPattern = /^(Kan je onderzoek doen|doe onderzoek naar|onderzoek naar|doe onderzoek|Verricht onderzoek naar|research|Can you research|Do research on|Research on|Perform research on)\s*:?\s*/i;
    displayQuery = displayQuery.replace(queryCleanPattern, '');

    // Remove leading/trailing single or double quotes that might remain
    displayQuery = displayQuery.replace(/^['"]|['"]$/g, '');
    
    // Als er een description is, voeg deze toe aan de query
    if (description && description.trim() !== "") {
        if (reqLanguagePreference === 'nl') {
            displayQuery = `${displayQuery} (${description})`;
        } else {
            displayQuery = `${displayQuery} (${description})`;
        }
    }

    // Return the formatted research result
    return new Response(
      JSON.stringify({
        researchResult: responseText,
        citations: responseCitations?.length ? responseCitations : undefined,
        query: displayQuery,
        modelUsed: externalApiModelUsed,
        modeUsed: mode,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (e: unknown) {
    let errorKey = "deepResearch.error.general";
    let errorMessage = "An unexpected error occurred.";
    let errorStack = undefined;

    if (e instanceof Error) {
      errorMessage = e.message;
      errorStack = e.stack;
      if (e.message.startsWith("deepResearch.error.")) {
        errorKey = e.message;
      }
      console.error(`[deep-research] Caught Error (${errorKey}):`, errorMessage, errorStack);
    } else if (typeof e === 'string'){
      errorMessage = e;
      console.error('[deep-research] Caught string error:', errorMessage);
    } else if (typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
      errorMessage = (e as { message: string }).message;
      const eWithStack = e as { stack?: unknown };
      errorStack = typeof eWithStack.stack === 'string' ? eWithStack.stack : undefined;
      console.error('[deep-research] Caught object error with message:', errorMessage, errorStack);
    } else {
      console.error('[deep-research] Caught unknown error type:', e);
    }
    
    let detailsForResponse = errorStack || errorMessage;
    const errObj = externalApiError as ExternalApiError | null;
    if (errObj && typeof errObj.message === 'string') {
      detailsForResponse = errObj.message + (errorStack ? ` | Frontend error stack: ${errorStack}` : ` | Frontend error: ${errorMessage}`);
    } else if (externalApiError) {
        detailsForResponse = `External API error (no message property or not a string): ${JSON.stringify(externalApiError)}` + (errorStack ? ` | Frontend error stack: ${errorStack}` : ` | Frontend error: ${errorMessage}`);
    }

    if (!errorKey.startsWith("deepResearch.error.status") && externalApiError) {
        const apiError = externalApiError as ExternalApiError;
        if (apiError.status && typeof apiError.status === 'number') {
            errorKey = `deepResearch.error.status${apiError.status}`;
        }
    }
    
    let responseStatus = 500;
    if (externalApiError) {
        const apiError = externalApiError as ExternalApiError;
        if (apiError.status && typeof apiError.status === 'number') {
            responseStatus = apiError.status;
        }
    }

    return new Response(JSON.stringify({ 
      error: errorKey, 
      details: detailsForResponse
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: responseStatus 
    });
  }
};

Deno.serve(handler);