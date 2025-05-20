import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');
const enTranslationPath = path.join(__dirname, 'public', 'locales', 'en', 'translation.json');

// Functie om de sleutel van een object recursief te verwijderen als deze niet in het referentieobject staat
function removeUnusedKeys(source, reference) {
  if (typeof source !== 'object' || source === null || typeof reference !== 'object' || reference === null) {
    return source;
  }
  
  const result = {};
  
  // Loop door alle sleutels in het bronobject
  for (const key in source) {
    // Controleer of de sleutel in het referentieobject staat
    if (key in reference) {
      if (typeof source[key] === 'object' && source[key] !== null &&
          typeof reference[key] === 'object' && reference[key] !== null) {
        // Als beide waarden objecten zijn, pas recursief toe
        result[key] = removeUnusedKeys(source[key], reference[key]);
      } else {
        // Anders behoud de waarde
        result[key] = source[key];
      }
    } else {
      console.log(`Verwijderde sleutel: ${key}`);
    }
  }
  
  return result;
}

try {
  // Lees de vertaalbestanden
  const nlTranslationText = fs.readFileSync(nlTranslationPath, 'utf8');
  const enTranslationText = fs.readFileSync(enTranslationPath, 'utf8');
  
  let nlTranslation;
  let enTranslation;
  
  try {
    nlTranslation = JSON.parse(nlTranslationText);
    enTranslation = JSON.parse(enTranslationText);
  } catch (jsonError) {
    console.error('Fout bij het parsen van JSON bestanden:', jsonError);
    process.exit(1);
  }
  
  // Maak een back-up van het Nederlandse bestand
  const backupPath = `${nlTranslationPath}.bak3`;
  fs.writeFileSync(backupPath, nlTranslationText, 'utf8');
  console.log(`Back-up gemaakt van Nederlands vertaalbestand: ${backupPath}`);
  
  // Verwijder ongebruikte sleutels uit het Nederlandse bestand
  console.log('Verwijderen van overtollige sleutels...');
  const cleanedNlTranslation = removeUnusedKeys(nlTranslation, enTranslation);
  
  // Schrijf het opgeschoonde bestand terug
  fs.writeFileSync(
    nlTranslationPath,
    JSON.stringify(cleanedNlTranslation, null, 2),
    'utf8'
  );
  
  // Vergelijk de groottes van de oude en nieuwe vertaalbestanden
  const oldSize = nlTranslationText.length;
  const newSize = JSON.stringify(cleanedNlTranslation, null, 2).length;
  const reduction = oldSize - newSize;
  
  console.log(`Vertaalbestand opgeschoond!`);
  console.log(`Oude grootte: ${oldSize} bytes`);
  console.log(`Nieuwe grootte: ${newSize} bytes`);
  console.log(`Reductie: ${reduction} bytes (${(reduction / oldSize * 100).toFixed(2)}%)`);
  
} catch (error) {
  console.error('Fout bij het verwerken van vertaalbestanden:', error);
} 