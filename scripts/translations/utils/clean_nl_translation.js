/**
 * @fileoverview Script to clean up the Dutch translation file by removing unnecessary keys 
 * and translating error messages from English to Dutch.
 */
import fs from 'node:fs';

const NL_PATH = './public/locales/nl/translation.json';
const EN_PATH = './public/locales/en/translation.json';
const BACKUP_PATH = './public/locales/nl/translation.json.bak3';

// Map of English error messages to Dutch translations
const ERROR_TRANSLATIONS = {
  "Not authorized.": "Niet geautoriseerd.",
  "An internal server error occurred.": "Er is een interne serverfout opgetreden.",
  "Could not retrieve the ID of the saved research.": "Kon de ID van het opgeslagen onderzoek niet ophalen.",
  "No profiles found.": "Geen profielen gevonden.",
  "Internal server error: API configuration missing.": "Interne serverfout: API-configuratie ontbreekt.",
  "Invalid or missing 'input' in request body.": "Ongeldige of ontbrekende 'input' in verzoek.",
  "Invalid request body.": "Ongeldige aanvraag inhoud.",
  "Valid taskId is required in the request body.": "Geldige taak-ID is vereist in het verzoek.",
  "OPENAI_API_KEY environment variable not set.": "OPENAI_API_KEY omgevingsvariabele niet ingesteld.",
  "SUPABASE_URL environment variable not set.": "SUPABASE_URL omgevingsvariabele niet ingesteld.",
  "SUPABASE_ANON_KEY environment variable not set.": "SUPABASE_ANON_KEY omgevingsvariabele niet ingesteld.",
  "Error fetching task.": "Fout bij ophalen taak.",
  "Task not found.": "Taak niet gevonden.",
  "OpenAI API request failed.": "OpenAI API verzoek mislukt.",
  "AI service did not provide a usable answer.": "AI-service heeft geen bruikbaar antwoord gegeven.",
  "Invalid JSON format from AI.": "Ongeldig JSON-formaat van AI.",
  "Could not process the AI service's response.": "Kon de reactie van de AI-service niet verwerken.",
  "Invalid structure received from OpenAI API.": "Ongeldige structuur ontvangen van OpenAI API.",
  "Could not parse the JSON response from the AI.": "Kon de JSON-reactie van de AI niet verwerken.",
  "No content found in AI response.": "Geen inhoud gevonden in AI-antwoord.",
  "AI response does not contain a valid 'subtasks' array.": "AI-antwoord bevat geen geldige 'subtasks' array.",
  "AI response 'subtasks' array items must have 'title' and 'description' strings.": "Items in de 'subtasks' array van AI-antwoord moeten 'title'- en 'description'-strings hebben.",
  "Could not extract a valid subtasks array from AI response.": "Kon geen geldige subtaken-array uit AI-antwoord halen.",
  "Internal server error while generating task details.": "Interne serverfout bij het genereren van taakdetails.",
  "Task ID is missing, cannot perform action.": "Taak-ID ontbreekt, kan actie niet uitvoeren.",
  "Unexpected response from AI.": "Onverwacht antwoord van AI.",
  "Query is required": "Zoekopdracht is verplicht",
  "Mode is required": "Modus is verplicht",
  "taskId is required": "taakId is verplicht",
  "Error fetching task subtasks": "Fout bij ophalen van subtaken",
  "Exception fetching subtasks": "Uitzondering bij het ophalen van subtaken",
  "Received non-JSON response from AI": "Niet-JSON-antwoord ontvangen van AI",
  "Parsed data does not match expected OpenAIChatCompletion structure or choices are missing": "Verwerkte gegevens komen niet overeen met de verwachte OpenAIChatCompletion-structuur of keuzes ontbreken",
  "Payload from AI is not a valid object, ignoring for finalPayload": "Payload van AI is geen geldig object, wordt genegeerd voor eindresultaat",
  "Function execution error": "Fout bij uitvoeren functie",
  "Unknown error": "Onbekende fout",
  "Failed to parse error body": "Kan foutbericht niet verwerken",
  "An unexpected error occurred. Please try again.": "Er is een onverwachte fout opgetreden. Probeer het opnieuw.",
  "Error generating task details.": "Fout bij genereren van taakdetails.",
  "Error generating subtasks.": "Fout bij genereren van subtaken."
};

// Keys to remove from the Dutch file because they're likely duplicates or obsolete
const SECTIONS_TO_REMOVE = [
  "adminInternalApiUsagePage.noDataAvailable",
  "adminInternalApiUsagePage.noDataDescription",
  "adminInternalApiUsagePage.noAggregationTitle",
  "adminInternalApiUsagePage.noAggregationDescription",
  "settingsPage.toast.researchModelProviderSaved",
  "settingsPage.toast.chatModelProviderSaved",
  "settingsPage.toast.errorSavingChatModel",
  "settings.toast.researchModelProviderSaved",
  "settings.toast.chatModelProviderSaved",
  "settings.toast.errorSavingChatModel"
];

try {
  // First, create a backup of the original file
  fs.copyFileSync(NL_PATH, BACKUP_PATH);
  console.log(`Backup created at ${BACKUP_PATH}`);
  
  // Read and parse both files
  const nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const enContent = fs.readFileSync(EN_PATH, 'utf8');
  
  const nlJson = JSON.parse(nlContent);
  const enJson = JSON.parse(enContent);
  
  console.log("\n--- CLEANING UP DUTCH TRANSLATION FILE ---");
  
  // 1. Translate error messages in the errors section
  if (nlJson.errors) {
    console.log("\n=== TRANSLATING ERROR MESSAGES ===");
    translateObject(nlJson.errors, ERROR_TRANSLATIONS);
  }
  
  // 2. Remove specified sections
  console.log("\n=== REMOVING UNNECESSARY SECTIONS ===");
  for (const path of SECTIONS_TO_REMOVE) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let current = nlJson;
    
    // Navigate to the parent object
    let found = true;
    for (const part of parts) {
      if (current[part] === undefined) {
        found = false;
        break;
      }
      current = current[part];
    }
    
    if (found && current[lastPart] !== undefined) {
      console.log(`Removing ${path}`);
      delete current[lastPart];
    }
  }
  
  // 3. Create a clean version of the Dutch file based on the English file structure
  console.log("\n=== BUILDING CLEANED TRANSLATION FILE ===");
  const cleanedJson = buildCleanTranslation(enJson, nlJson);
  
  // Write the cleaned content back to the Dutch file
  fs.writeFileSync(NL_PATH, JSON.stringify(cleanedJson, null, 2));
  console.log("\nCleaned translation file saved.");
  
  // Count lines in the updated file
  const newLineCount = JSON.stringify(cleanedJson, null, 2).split('\n').length;
  console.log(`\nNew line count: ${newLineCount} (should match English line count more closely)`);
  
} catch (error) {
  console.error("Error:", error.message);
}

// Helper function to translate values in an object based on a translation map
function translateObject(obj, translations) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      if (translations[obj[key]]) {
        console.log(`Translating "${obj[key]}" to "${translations[obj[key]]}"`);
        obj[key] = translations[obj[key]];
      }
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      translateObject(obj[key], translations);
    }
  }
}

// Build a clean translation file using the English structure and Dutch translations
function buildCleanTranslation(enObj, nlObj, path = "") {
  const result = {};
  
  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof enObj[key] === "object" && enObj[key] !== null) {
      // For nested objects, recursively build the structure
      result[key] = buildCleanTranslation(enObj[key], nlObj, currentPath);
    } else {
      // For string values, use Dutch translation if available, otherwise use English
      const dutchValue = getValueAtPath(nlObj, currentPath);
      
      if (dutchValue !== undefined) {
        result[key] = dutchValue;
      } else {
        // If no Dutch translation is available, use English value
        result[key] = enObj[key];
        console.log(`No Dutch translation for "${currentPath}", using English value: "${enObj[key]}"`);
      }
    }
  }
  
  return result;
}

// Helper function to get a value at a specific path in an object
function getValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null || current[part] === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
} 