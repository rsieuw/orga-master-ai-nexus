import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');
const enTranslationPath = path.join(__dirname, 'public', 'locales', 'en', 'translation.json');

// Vertaalmap voor foutmeldingen
const errorTranslations = {
  // Algemene fouten
  "Not authorized.": "Niet geautoriseerd.",
  "An internal server error occurred.": "Er is een interne serverfout opgetreden.",
  "Could not retrieve the ID of the saved research.": "Kon de ID van het opgeslagen onderzoek niet ophalen.",
  "No profiles found.": "Geen profielen gevonden.",
  "Internal server error: API configuration missing.": "Interne serverfout: API-configuratie ontbreekt.",
  "Invalid or missing 'input' in request body.": "Ongeldige of ontbrekende 'input' in aanvraagtekst.",
  "Invalid request body.": "Ongeldige aanvraagtekst.",
  "Valid taskId is required in the request body.": "Geldige taskId is vereist in de aanvraagtekst.",
  "OPENAI_API_KEY environment variable not set.": "OPENAI_API_KEY omgevingsvariabele is niet ingesteld.",
  "SUPABASE_URL environment variable not set.": "SUPABASE_URL omgevingsvariabele is niet ingesteld.",
  "SUPABASE_ANON_KEY environment variable not set.": "SUPABASE_ANON_KEY omgevingsvariabele is niet ingesteld.",
  "Error fetching task.": "Fout bij ophalen van taak.",
  "Task not found.": "Taak niet gevonden.",
  "OpenAI API request failed.": "OpenAI API-aanvraag mislukt.",
  "AI service did not provide a usable answer.": "AI-service gaf geen bruikbaar antwoord.",
  "Invalid JSON format from AI.": "Ongeldig JSON-formaat van AI.",
  "Could not process the AI service's response.": "Kon de reactie van de AI-service niet verwerken.",
  "Invalid structure received from OpenAI API.": "Ongeldige structuur ontvangen van OpenAI API.",
  "Could not parse the JSON response from the AI.": "Kon de JSON-reactie van de AI niet verwerken.",
  "No content found in AI response.": "Geen inhoud gevonden in AI-reactie.",
  "AI response does not contain a valid 'subtasks' array.": "AI-reactie bevat geen geldige 'subtasks' array.",
  "AI response 'subtasks' array items must have 'title' and 'description' strings.": "Items in de 'subtasks' array van de AI-reactie moeten 'title' en 'description' strings bevatten.",
  "Could not extract a valid subtasks array from AI response.": "Kon geen geldige subtasks array uit AI-reactie extraheren.",
  "Internal server error while generating task details.": "Interne serverfout bij het genereren van taakdetails.",
  "Task ID is missing, cannot perform action.": "Taak-ID ontbreekt, kan actie niet uitvoeren.",
  "Unexpected response from AI.": "Onverwachte reactie van AI.",
  "Query is required": "Zoekopdracht is vereist",
  "Mode is required": "Modus is vereist",
  "taskId is required": "taskId is vereist",
  "Error fetching task subtasks": "Fout bij ophalen van subtaken",
  "Exception fetching subtasks": "Uitzondering bij ophalen van subtaken",
  "Received non-JSON response from AI": "Niet-JSON reactie ontvangen van AI",
  "Parsed data does not match expected OpenAIChatCompletion structure or choices are missing": "Verwerkte gegevens komen niet overeen met verwachte OpenAIChatCompletion structuur of keuzes ontbreken",
  "Payload from AI is not a valid object, ignoring for finalPayload": "Payload van AI is geen geldig object, wordt genegeerd voor finalPayload",
  "Function execution error": "Fout bij uitvoeren van functie",
  "Unknown error": "Onbekende fout",
  "Failed to parse error body": "Kon de foutmelding niet verwerken",
  "An unexpected error occurred. Please try again.": "Er is een onverwachte fout opgetreden. Probeer het opnieuw.",
  "Error generating task details.": "Fout bij het genereren van taakdetails.",
  "Error generating subtasks.": "Fout bij het genereren van subtaken.",
  "Internal API Usage Log Details": "Loggegevens intern API-gebruik",
  "Loading logs...": "Logboeken laden...",
  "Error loading logs": "Fout bij laden logboeken",
  "No API Usage Data Available": "Geen API-gebruiksgegevens beschikbaar",
  "There are currently no internal API calls logged in the system. This could be because the application is new or no users have triggered any internal API functions yet.": "Er zijn momenteel geen interne API-aanroepen geregistreerd in het systeem. Dit kan komen doordat de applicatie nieuw is of omdat er nog geen gebruikers interne API-functies hebben gebruikt.",
  "Data Structure Issue": "Probleem met gegevensstructuur",
  "The API returned raw logs but no aggregated data. Please contact the system administrator as there may be an issue with the API endpoint.": "De API heeft ruwe logs geretourneerd maar geen geaggregeerde gegevens. Neem contact op met de systeembeheerder, er kan een probleem zijn met het API-eindpunt."
};

try {
  // Lees de vertaalbestanden
  const nlTranslation = JSON.parse(fs.readFileSync(nlTranslationPath, 'utf8'));
  const enTranslation = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));
  
  // Controleer of er een "errors" sectie is
  if (nlTranslation.errors) {
    console.log('Vertaal errors sectie in het Nederlandse bestand...');
    
    // Functie om recursief door de errors objecten te gaan en te vertalen
    function translateErrors(obj) {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      if (typeof obj === 'string') {
        return errorTranslations[obj] || obj;
      }
      
      const result = Array.isArray(obj) ? [] : {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (typeof obj[key] === 'string') {
            result[key] = errorTranslations[obj[key]] || obj[key];
          } else {
            result[key] = translateErrors(obj[key]);
          }
        }
      }
      
      return result;
    }
    
    // Vertaal de errors sectie
    nlTranslation.errors = translateErrors(nlTranslation.errors);
    
    // Schrijf de bijgewerkte vertaling terug naar het bestand
    fs.writeFileSync(
      nlTranslationPath, 
      JSON.stringify(nlTranslation, null, 2),
      'utf8'
    );
    
    console.log('Errors sectie succesvol vertaald!');
  } else {
    console.log('Geen errors sectie gevonden in het Nederlandse vertaalbestand.');
  }
  
} catch (error) {
  console.error('Fout bij het verwerken van de vertaalbestanden:', error);
} 