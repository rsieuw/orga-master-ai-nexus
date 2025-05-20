import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');

try {
  // Lees het Nederlandse vertaalbestand als string
  const fileContent = fs.readFileSync(nlTranslationPath, 'utf8');
  
  console.log('Vervang resterende Engelse teksten...');
  
  // Maak een aangepaste versie van het bestand
  let updatedContent = fileContent;
  
  // Specifieke vertalingen en hun Engelse versies
  const replacements = [
    {
      english: '"description": "Default research model set to: {modeLabel}."',
      dutch: '"description": "Standaard onderzoeksmodel ingesteld op: {modeLabel}."'
    },
    {
      english: '"description": "Could not save research model preference."',
      dutch: '"description": "Kon onderzoeksmodel voorkeur niet opslaan."'
    },
    {
      english: '"title": "Notification Preference Saved"',
      dutch: '"title": "Meldingsvoorkeur opgeslagen"'
    },
    {
      english: '"title": "Error Saving Notifications"',
      dutch: '"title": "Fout bij opslaan meldingen"'
    },
    {
      english: '"description": "Could not save layout preference. Please try again."',
      dutch: '"description": "Kon lay-outvoorkeur niet opslaan. Probeer het opnieuw."'
    }
  ];
  
  // Vervang alle voorkomens
  for (const replacement of replacements) {
    const regex = new RegExp(escapeRegExp(replacement.english), 'g');
    const oldContent = updatedContent;
    updatedContent = updatedContent.replace(regex, replacement.dutch);
    
    const count = (oldContent.match(regex) || []).length;
    if (count > 0) {
      console.log(`Vervangen: "${replacement.english}" -> "${replacement.dutch}" (${count} keer)`);
    }
  }
  
  // Schrijf de bijgewerkte inhoud terug naar het bestand
  fs.writeFileSync(nlTranslationPath, updatedContent, 'utf8');
  
  console.log('Resterende Engelse teksten succesvol vervangen!');
  
} catch (error) {
  console.error('Fout bij het verwerken van het vertaalbestand:', error);
}

// Hulpfunctie om speciale tekens in regex te escapen
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
} 