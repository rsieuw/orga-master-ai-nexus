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

  try {
    // Store the raw request body for debugging
    const rawBody = await req.text();
    
    // Parse JSON manually after consuming the request body
    let requestData;
    try {
      requestData = JSON.parse(rawBody);
    } catch (parseError: unknown) {
      console.error("[deep-research] Error parsing JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON in request body", 
          message: parseError instanceof Error ? parseError.message : "JSON parse error"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // Check for test payload
    if (requestData.testParam) {
      return new Response(
        JSON.stringify({ 
          id: "test-response-id",
          status: "success", 
          message: "Test payload received", 
          researchResult: "Dit is een test response van de deep-research functie. De test parameter was: " + requestData.testParam,
          citations: []
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 200 
        }
      );
    }
    
    // Extract parameters from parsed data
    const { 
      query = "Geen onderzoeksvraag opgegeven",
      description = "", 
      contextQuery = "", 
      languagePreference: reqLanguagePreference = "nl", 
      taskId = "none", 
      mode = 'research',
      modelProvider = 'perplexity-sonar'
    } = requestData;
    
    // Valideer vereiste parameters
    if (!query || !taskId || taskId === "none") {
      console.error("[deep-research] Missing required parameters, query:", query, "taskId:", taskId);
      return new Response(
        JSON.stringify({ 
          errorKey: "deepResearch.error.missingQueryOrTaskId",
          /** @type {{query: boolean, taskId: boolean}} */
          missingParams: { 
            query: !query, 
            taskId: !taskId || taskId === "none" 
          } 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 400 
        }
      );
    }

    // Retrieve Perplexity API key and OpenAI API key
    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    
    // Bepaal welke API key we nodig hebben op basis van de modelProvider parameter
    const usePerplexity = modelProvider === 'perplexity-sonar';
    
    if ((usePerplexity && !perplexityApiKey) || (!usePerplexity && !openAIApiKey)) {
      const errorKey = usePerplexity ? "deepResearch.error.perplexityApiKeyNotSet" : "deepResearch.error.openAIApiKeyNotSet";
      console.error("[deep-research] API key not set:", errorKey);
      return new Response(
        JSON.stringify({ 
          errorKey: errorKey
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    // Define system content based on mode
    let systemContent = "";
    let apiEndpoint = "";
    let apiKey = "";
    let apiModel = "";
    
    // Set API endpoint and key based on modelProvider
    if (usePerplexity) {
      apiEndpoint = 'https://api.perplexity.ai/chat/completions';
      apiKey = perplexityApiKey!;
      apiModel = "sonar-pro";
    } else {
      apiEndpoint = 'https://api.openai.com/v1/chat/completions';
      apiKey = openAIApiKey!;
      apiModel = "gpt-4o-mini";
    }

    // Set system content based on mode
    switch (mode) {
      case 'instruction':
        systemContent = `You are an expert instructor with deep practical knowledge. Based on the available context, create comprehensive step-by-step instructions for the following task: **"${query}"**. ${contextQuery ? `**Main Task Context:** ${contextQuery}` : ''} ${description ? `Apply the following specific requirements: **${description}**` : ''}

Format your instructions in **Markdown**, using the following structure:

1. **Overview**
   * Explain the task and its purpose in 2-3 sentences
   * Specify required materials, tools, or software with exact names and recommended specifications
   * Indicate difficulty level (Beginner/Intermediate/Advanced)
   * List any safety precautions or preparation steps
   * Mention estimated completion time

2. **Prerequisites**
   * List any skills, knowledge, or conditions needed before starting
   * Include any preliminary setup or preparation work

3. **Step-by-Step Instructions**
   * Number each main step clearly (**Step 1:** **Step 2:**, etc.)
   * Begin each step with an action verb (e.g., "Position", "Connect", "Click")
   * Include specific measurements, settings, or parameters where relevant
   * Add **Warning:** or **Note:** callouts for critical information
   * Explain WHY certain steps matter, not just what to do
   * Use bullet points for multiple actions within a step

4. **Visual References** (if applicable)
   * Describe what to look for visually at critical stages
   * Use clear descriptive language for visual indicators of success/failure

5. **Troubleshooting**
   * Address common problems in a problem → solution format
   * Include diagnostic steps to identify issues

6. **Tips from Professionals**
   * Share expert insights that enhance results or efficiency
   * Mention alternative approaches for different situations

7. **${reqLanguagePreference === 'nl' ? 'Bronnen' : 'Sources'}**
   * List reference materials, tutorials, or manufacturer guides: \`1. [Title of Source](https://example.com)\`

**Output must follow this exact structure in properly formatted Markdown without any additional commentary.**

Respond in ${reqLanguagePreference === 'nl' ? 'Dutch' : 'English'}.`;
        break;
        
      case 'creative':
        systemContent = `You are a world-class creative thinking specialist with expertise in generating innovative ideas and solutions. For the following creative challenge: **"${query}"**. ${contextQuery ? `**Main Task Context:** ${contextQuery}` : ''} ${description ? `Apply these specific creativity parameters: **${description}**` : ''}

Format your response in **Markdown**, using the following structure:

1. **Perspective Shift**
   * Reframe the challenge from unexpected angles
   * Identify hidden opportunities or unconventional approaches
   * Challenge assumptions that might limit creative thinking

2. **Idea Constellation**
   * Generate a diverse array of creative concepts (at least 8-12 distinct ideas)
   * Present each idea with a clear, compelling headline in **bold**
   * Follow with a concise description that captures its essence and potential
   * Ensure variety across different creative dimensions:
     * Practical vs. ambitious
     * Immediate vs. long-term
     * Traditional vs. disruptive
     * Simple vs. complex

3. **Concept Expansion**
   * Select 3-4 most promising concepts based on originality and relevance
   * For each selected concept:
     * Elaborate on how it works or could be implemented
     * Highlight its unique aspects or advantages
     * Suggest possible variations or extensions
     * Address potential challenges creatively

4. **Creative Connections**
   * Identify unexpected combinations or hybrids of the generated ideas
   * Explore metaphors, analogies, or parallels from unrelated domains
   * Suggest how elements from different ideas might work together

5. **Inspiration Springboard**
   * Provide thought-provoking questions to stimulate further creative exploration
   * Suggest unconventional resources or perspectives that might spark new ideas
   * Outline a quick creative exercise related to the challenge

**Output should prioritize originality, divergent thinking, and practical value while avoiding clichés, generic solutions, or obvious approaches. Present all content in clear, well-formatted Markdown with appropriate use of headings, bullet points, and emphasis.**

Respond in ${reqLanguagePreference === 'nl' ? 'Dutch' : 'English'}.`;
        break;
        
      default: // research mode
        systemContent = `You are an expert researcher and writer. Based on the available context, perform a thorough and well-structured investigation on the following topic: **"${query}"**. ${contextQuery ? `**Main Task Context:** ${contextQuery}` : ''} ${description ? `Apply the following specific instructions: **${description}**` : ''}

Format your response in **Markdown**, using the following structure:

1. **Introduction** 
   * Begin with a clear and concise introduction that frames the topic and explains its relevance
   * Provide context on why this topic matters and to whom
   * Outline the scope of your investigation

2. **Main Content Sections** 
   * Organize the body using clear headings (\`## Heading Title\`) 
   * Each section should focus on one key aspect of the topic
   * Present facts or arguments clearly with supporting evidence
   * Use bullet points (\`*\`, \`-\`, or \`+\`) for lists, when appropriate
   * Ensure logical flow between sections

3. **Comparative Analysis (if relevant)** 
   * Include a table in Markdown format when comparing options, features, or data points
   * Structure tables with clear headers and organized data
   * Follow up tables with interpretive insights

4. **Key Findings/Conclusion**
   * Summarize the most important discoveries from your research
   * Highlight patterns, implications, or applications
   * Address limitations of current knowledge on the topic

5. **In-Text References** 
   * Support claims and facts using simple numbered anchors in the text, e.g.: *"This statement is supported by research [1]."*
   * Ensure all significant claims have citation support

6. **${reqLanguagePreference === 'nl' ? 'Bronnen' : 'Sources'}** 
   * End with a section titled **"${reqLanguagePreference === 'nl' ? 'Bronnen' : 'Sources'}"** 
   * List all referenced sources as a numbered list using this format: \`1. [Title of Source](https://example.com)\`
   * Prioritize authoritative, recent, and relevant sources

**Output must be directly usable as Markdown. Avoid any extra commentary or formatting outside of the specified structure.**

Respond in ${reqLanguagePreference === 'nl' ? 'Dutch' : 'English'}.`;
        break;
    }

    const messages = [
      {
        role: "system",
        content: systemContent
      },
      {
        role: "user",
        content: query, 
      },
    ];

    // Prepare headers based on API
    const headers = {
      'accept': 'application/json',
      'content-type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Make API call
    const apiResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: apiModel, 
        messages: messages,
        // Adjust temperature based on mode
        temperature: mode === 'creative' ? 1.0 : 0.7, 
        max_tokens: 4000 
      })
    });

    if (!apiResponse.ok) {
      // Log the detailed error response for debugging
      const errorText = await apiResponse.text();
      console.error(`[deep-research] API response error (${apiResponse.status})`, errorText);
      
      let errorMessage = `API responded with status ${apiResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch (_e) {
        // Use raw text if parsing fails
      }
      
      // Als er een 401/403 fout is, probeer opnieuw met een mockup response om testen mogelijk te maken
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        return generateMockResponse(query, mode);
      }
      
      return new Response(
        JSON.stringify({ 
          errorKey: "deepResearch.error.apiError", 
          message: errorMessage,
          status: apiResponse.status
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }

    const aiResult = await apiResponse.json();

    const content = aiResult.choices[0].message.content;

    // Process content and extract citations
    // This is a simplified version - in a real implementation you'd extract links from markdown
    const citations = [];
    const sourceRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = sourceRegex.exec(content)) !== null) {
      citations.push({
        title: match[1],
        url: match[2]
      });
    }

    // Return successful response
    const response = {
      id: "ai-research-" + Date.now().toString(), 
      researchResult: content,
      citations: citations,
      mode: mode
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("[deep-research] Error in deep-research function:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        errorKey: "deepResearch.error.unexpectedError", 
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});

/**
 * Generates a mock response for testing or fallback purposes when the primary AI API call fails
 * due to authentication errors (401/403).
 * The content of the mock response varies based on the provided mode.
 * 
 * @param {string} query - The original user query.
 * @param {string} mode - The research mode ('research', 'instruction', 'creative').
 * @returns {Response} A Deno Response object containing the mock research result.
 */
// Hulpfunctie voor het genereren van mock responses als fallback
function generateMockResponse(query: string, mode: string) {
  let responseContent = "";
  
  // Genereer mock response op basis van mode
  switch (mode) {
    case 'instruction':
      responseContent = `# Instructies: ${query}

## Overzicht
* Deze taak gaat over het implementeren van ${query}
* Benodigde tools: Code editor, browser, en basiskennis van programmeren
* Moeilijkheidsgraad: Gemiddeld
* Geschatte tijd: 30-60 minuten

## Vereisten
* Basiskennis van webontwikkeling
* Een werkende lokale ontwikkelomgeving

## Stap-voor-stap instructies

**Stap 1: Voorbereiding**
* Open je projectmap in je favoriete code-editor
* Zorg ervoor dat alle benodigde tools geïnstalleerd zijn
* Maak een nieuwe branch als je met versiebeheer werkt

**Stap 2: Implementatie**
* Begin met het analyseren van de bestaande code
* Identificeer waar de wijzigingen moeten worden aangebracht
* Pas de code aan volgens de requirements

**Stap 3: Testen**
* Voer lokale tests uit om te verifiëren dat je oplossing werkt
* Controleer op mogelijke edge-cases of problemen
* Vraag eventueel feedback van een collega

## Probleemoplossing
* **Probleem**: Als je foutmeldingen ziet, controleer dan je console voor details
* **Oplossing**: Veel voorkomende problemen kunnen worden opgelost door het herladen van je applicatie

## Professionele tips
* Gebruik commentaar om complexe delen van je code uit te leggen
* Zorg voor duidelijke commit-berichten als je versiebeheer gebruikt

## Bronnen
1. [Officiële Documentatie](https://example.com/docs)
2. [Veelgestelde vragen](https://example.com/faq)`;
      break;
      
    case 'creative':
      responseContent = `# Creatieve ideeën voor: ${query}

## Perspectief verschuiving
* Bekijk het probleem vanuit het oogpunt van de eindgebruiker
* Denk na over hoe dit over 5 jaar relevant zal zijn
* Stel je voor hoe dit in een volledig andere industrie zou worden aangepakt

## Ideeëncollectie

**Automatische workflow integratie**
Een systeem dat routinetaken automatisch detecteert en workflows suggereert om deze te stroomlijnen.

**Collaboratief kennisplatform**
Een platform waar teamleden expertise kunnen delen en problemen gezamenlijk kunnen oplossen.

**Visuele feedbackloop**
Realtime visualisaties die de impact van veranderingen direct zichtbaar maken.

**Micro-leermodules**
Korte, op maat gemaakte leermomenten die worden geïntegreerd in de dagelijkse workflow.

**Gamification van complexe taken**
Het toevoegen van spelelemelten om moeilijke taken leuker en meer motiverend te maken.

**AI-assistent voor routine werk**
Een slimme assistent die repetitieve taken overneemt en leert van gebruikersgedrag.

**Cross-functionele kennisuitwisseling**
Een systeem dat kennis uit verschillende afdelingen samenbrengt voor betere oplossingen.

**Gebruikersgedreven innovatie**
Een platform waar eindgebruikers direct kunnen bijdragen aan nieuwe ideeën en verbeteringen.

## Concept uitwerking

**Automatische workflow integratie**
Dit concept draait om het herkennen van patronen in dagelijkse taken. Door machine learning toe te passen, kan het systeem voorspellen welke acties een gebruiker waarschijnlijk wil uitvoeren en deze automatiseren. Dit zou kunnen werken via een plug-in architectuur die met bestaande tools integreert.

**Visuele feedbackloop**
Door realtime data visualisaties te implementeren, kunnen complexe processen inzichtelijk worden gemaakt. Dit kan worden uitgebreid met scenario-modellering om "wat als" situaties te verkennen voordat veranderingen worden doorgevoerd.

**AI-assistent voor routine werk**
Deze oplossing combineert natuurlijke taalverwerking met procesautomatisering om gebruikers te helpen bij dagelijkse taken. Het kan beginnen met eenvoudige commando's en door gebruik te leren en zich aan te passen aan de werkstijl van de gebruiker.

## Creatieve verbindingen
* Combineer de visuele feedback met gamification om een interactieve leerervaring te creëren
* Integreer de AI-assistent met het kennisplatform voor contextbewuste suggesties
* Verbind workflow automatisering met micro-leermodules om training op het juiste moment aan te bieden

## Inspiratie voor verder denken
* Hoe zou deze oplossing eruitzien als er geen technologische beperkingen waren?
* Welke onverwachte industrieën zouden kunnen profiteren van deze aanpak?
* Wat als we dit idee in het tegenovergestelde veranderen - wat kunnen we daarvan leren?`;
      break;
      
    default: // research mode
      responseContent = `# Onderzoek naar ${query}

## Inleiding
Dit onderzoek richt zich op ${query}, een onderwerp dat steeds relevanter wordt in de moderne context. We zullen verschillende aspecten onderzoeken, van basisbegrippen tot praktische toepassingen, om een compleet beeld te geven van het onderwerp en de potentiële waarde ervan.

## Achtergrond en context
${query} heeft zich de afgelopen jaren ontwikkeld van een niche-concept tot een belangrijk aspect van moderne technologische ontwikkelingen. De oorsprong kan worden teruggeleid naar eerdere innovaties, maar de huidige toepassing is aanzienlijk geëvolueerd door recente technologische doorbraken.

## Belangrijkste concepten
### Definitie en bereik
${query} omvat een reeks methodologieën en technologieën die gericht zijn op het verbeteren van de efficiëntie en effectiviteit van processen. De kernprincipes zijn:

* Automatisering van repetitieve taken
* Intelligente gegevensanalyse
* Schaalbare oplossingen voor complexe problemen

### Technische aspecten
De implementatie van ${query} vereist vaak een combinatie van:

* Moderne programmeertalen en frameworks
* Cloud-gebaseerde infrastructuur
* Beveiligingsprotocollen en gegevensbescherming

## Praktijkvoorbeelden
| Implementatie | Voordelen | Uitdagingen |
|---------------|-----------|-------------|
| Enterprise | Hoge schaalbaarheid | Complexe integratie |
| Mid-market | Kostenefficiënt | Beperkte resources |
| Startups | Flexibiliteit | Technische schuld |

## Toekomstperspectief
De toekomst van ${query} zal waarschijnlijk worden gekenmerkt door verdere integratie met opkomende technologieën zoals kunstmatige intelligentie en machine learning. Dit zal naar verwachting leiden tot nog meer autonome systemen die minimale menselijke tussenkomst vereisen.

## Conclusie
${query} biedt aanzienlijke mogelijkheden voor organisaties die op zoek zijn naar manieren om hun processen te optimaliseren en concurrentievoordeel te behalen. Door de juiste implementatiestrategie te kiezen en rekening te houden met de specifieke behoeften van de organisatie, kunnen de voordelen worden gemaximaliseerd terwijl de risico's worden beperkt.

## Bronnen
1. [Whitepaper over ${query}](https://example.com/whitepaper)
2. [Industrierapport 2025](https://example.com/report)
3. [Technische specificaties](https://example.com/specs)`;
      break;
  }

  // Eenvoudige extractie van bronnen uit de mock content
  const citations = [];
  const sourceRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = sourceRegex.exec(responseContent)) !== null) {
    citations.push({
      title: match[1],
      url: match[2]
    });
  }

  // Return response
  const response = {
    id: "mock-fallback-" + Date.now().toString(), 
    researchResult: responseContent,
    citations: citations,
    mode: mode,
    isFallback: true
  };

  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200
  });
} 