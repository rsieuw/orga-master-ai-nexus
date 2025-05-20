/**
 * @fileoverview Script to remove duplicate sections and fix untranslated values in the Dutch translation file
 */
import fs from 'node:fs';

const NL_PATH = './public/locales/nl/translation.json';
const BACKUP_PATH = './public/locales/nl/translation.json.bak2';

try {
  // First, create a backup of the original file
  fs.copyFileSync(NL_PATH, BACKUP_PATH);
  console.log(`Backup created at ${BACKUP_PATH}`);
  
  // Read and parse the Dutch file
  const nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const nlJson = JSON.parse(nlContent);
  
  console.log("\n--- REMOVING DUPLICATE SECTIONS ---");
  
  // Fix 1: Remove duplicate settingsPage.desktopLayout (keep settings.desktopLayout)
  if (nlJson.settingsPage && nlJson.settingsPage.desktopLayout && nlJson.settings && nlJson.settings.desktopLayout) {
    console.log("Removing duplicate settingsPage.desktopLayout (keeping settings.desktopLayout)");
    delete nlJson.settingsPage.desktopLayout;
  } else {
    console.log("settingsPage.desktopLayout not found or already removed");
  }
  
  // Fix 2: Remove duplicate editTaskDialog.toast (keep taskDetail.editTaskDialog.toast)
  if (nlJson.editTaskDialog && nlJson.editTaskDialog.toast && 
      nlJson.taskDetail && nlJson.taskDetail.editTaskDialog && nlJson.taskDetail.editTaskDialog.toast) {
    console.log("Removing duplicate editTaskDialog.toast (keeping taskDetail.editTaskDialog.toast)");
    delete nlJson.editTaskDialog.toast;
  } else {
    console.log("editTaskDialog.toast not found or already removed");
  }
  
  // Fix 3: Remove duplicate adminExternalApiUsagePage.status (keeping adminInternalApiUsagePage.status)
  // But first, let's add Dutch translations for these statuses in the one we're keeping
  if (nlJson.adminInternalApiUsagePage && nlJson.adminInternalApiUsagePage.status) {
    console.log("Translating status values to Dutch in adminInternalApiUsagePage.status");
    nlJson.adminInternalApiUsagePage.status = {
      "success": "Geslaagd",
      "failed": "Mislukt",
      "unknown": "Onbekend"
    };
  } else {
    console.log("adminInternalApiUsagePage.status not found");
  }
  
  if (nlJson.adminExternalApiUsagePage && nlJson.adminExternalApiUsagePage.status) {
    console.log("Removing duplicate adminExternalApiUsagePage.status (keeping adminInternalApiUsagePage.status)");
    delete nlJson.adminExternalApiUsagePage.status;
  } else {
    console.log("adminExternalApiUsagePage.status not found or already removed");
  }
  
  // Look for any other English strings in admin pages
  console.log("\n--- TRANSLATING ADDITIONAL ADMIN PAGE ENGLISH TEXTS ---");
  if (nlJson.adminInternalApiUsagePage) {
    translateObjectValues(nlJson.adminInternalApiUsagePage);
  }
  
  if (nlJson.adminExternalApiUsagePage) {
    translateObjectValues(nlJson.adminExternalApiUsagePage);
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(NL_PATH, JSON.stringify(nlJson, null, 2));
  console.log("\nChanges saved to file.");
  
  // Count lines in the updated file
  const newLineCount = JSON.stringify(nlJson, null, 2).split('\n').length;
  console.log(`\nNew line count: ${newLineCount}`);
  
} catch (error) {
  console.error("Error:", error.message);
}

// Helper function to translate common English values to Dutch
function translateObjectValues(obj) {
  const translations = {
    "Success": "Geslaagd",
    "Failed": "Mislukt",
    "Unknown": "Onbekend",
    "Errors": "Fouten",
    "Function": "Functie",
    "Timestamp": "Tijdstempel",
    "Duration": "Duur",
    "Status": "Status",
    "User": "Gebruiker",
    "Method": "Methode",
    "Path": "Pad",
    "API Usage": "API-gebruik",
    "Internal API Usage": "Intern API-gebruik",
    "External API Usage": "Extern API-gebruik"
  };
  
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // Check if this string needs translation
      if (translations[obj[key]]) {
        console.log(`Translating "${obj[key]}" to "${translations[obj[key]]}"`);
        obj[key] = translations[obj[key]];
      }
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      // Recursive call for nested objects
      translateObjectValues(obj[key]);
    }
  }
} 