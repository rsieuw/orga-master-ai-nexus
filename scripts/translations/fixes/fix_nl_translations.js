/**
 * @fileoverview Script to replace English phrases in the Dutch translation file with proper Dutch translations.
 */
import fs from 'node:fs';

const NL_PATH = './public/locales/nl/translation.json';
const BACKUP_PATH = './public/locales/nl/translation.json.bak';

// Map of English phrases to Dutch translations
const TRANSLATIONS = {
  "Interface Language": "Interfacetaal",
  "Layout Preference Saved": "Lay-outvoorkeur opgeslagen",
  "Email Notifications": "E-mailmeldingen",
  "Account updated": "Account bijgewerkt",
  "could not save": "kon niet opslaan",
  "has been set to": "is ingesteld op",
  "settings have been saved": "instellingen zijn opgeslagen",
  "Please upgrade": "Upgrade alstublieft",
  "Select model": "Selecteer model",
  "Choose which model": "Kies welk model",
  "language has been set": "taal is ingesteld",
  "Choose the default arrangement for the": "Kies de standaardindeling voor de",
  "Error Saving Layout": "Fout bij Opslaan Lay-out",
  "Research Model Saved": "Onderzoeksmodel Opgeslagen",
  "Error Saving Research Model": "Fout bij Opslaan Onderzoeksmodel",
  "Default research model set to": "Standaard onderzoeksmodel ingesteld op",
  "Could not save research model preference": "Kon onderzoeksmodel voorkeur niet opslaan",
  "Could not save layout preference": "Kon lay-outvoorkeur niet opslaan",
  "Interface Language Changed": "Interfacetaal Gewijzigd"
};

try {
  // First, create a backup of the original file
  fs.copyFileSync(NL_PATH, BACKUP_PATH);
  console.log(`Backup created at ${BACKUP_PATH}`);
  
  // Read the Dutch translation file
  let nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const originalContent = nlContent;
  
  // Replace English phrases with Dutch translations
  console.log("\nReplacing English phrases with Dutch translations...");
  let replacementCount = 0;
  
  for (const [english, dutch] of Object.entries(TRANSLATIONS)) {
    // Count occurrences before replacement
    const regex = new RegExp(`"${escapeRegExp(english)}"`, 'g');
    const matches = nlContent.match(regex);
    const count = matches ? matches.length : 0;
    
    if (count > 0) {
      // Replace the English phrase with the Dutch translation
      nlContent = nlContent.replace(regex, `"${dutch}"`);
      console.log(`- Replaced "${english}" with "${dutch}" (${count} occurrences)`);
      replacementCount += count;
    }
  }
  
  if (replacementCount > 0) {
    // Write the updated content back to the file
    fs.writeFileSync(NL_PATH, nlContent);
    console.log(`\n${replacementCount} replacements made. File saved.`);
  } else {
    console.log("\nNo replacements needed.");
  }
  
  // Count lines before and after
  const linesBefore = originalContent.split('\n').length;
  const linesAfter = nlContent.split('\n').length;
  console.log(`\nLines before: ${linesBefore}`);
  console.log(`Lines after: ${linesAfter}`);
  
} catch (error) {
  console.error("Error:", error.message);
}

// Helper function to escape special characters in regex
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 