import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const enTranslationPath = path.join(__dirname, 'public', 'locales', 'en', 'translation.json');
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');

// Functie om te controleren of een sleutel bestaat in een object met geneste objecten
function hasKey(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (let key of keys) {
    if (current === undefined || current === null || !current.hasOwnProperty(key)) {
      return false;
    }
    current = current[key];
  }
  
  return true;
}

// Functie om alle sleutelpaden te verzamelen uit een object (inclusief geneste objecten)
function collectKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Als de waarde een object is, recursief verzamelen
      keys = [...keys, ...collectKeys(obj[key], newKey)];
    } else {
      // Als de waarde geen object is, sleutelpad toevoegen
      keys.push(newKey);
    }
  }
  
  return keys;
}

try {
  console.log('Sleutels zoeken die in het Engels bestand bestaan maar niet in het Nederlands bestand...\n');
  
  // Lees de vertaalbestanden
  const enTranslation = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));
  const nlTranslation = JSON.parse(fs.readFileSync(nlTranslationPath, 'utf8'));
  
  // Verzamel alle sleutels uit het Engelse bestand
  const enKeys = collectKeys(enTranslation);
  
  // Controleer welke Engelse sleutels niet in het Nederlandse bestand staan
  const missingKeys = enKeys.filter(key => !hasKey(nlTranslation, key));
  
  // Resultaten tonen
  if (missingKeys.length > 0) {
    console.log(`Gevonden: ${missingKeys.length} sleutels die in het Engels bestand bestaan maar niet in het Nederlands bestand:\n`);
    missingKeys.forEach(key => console.log(`- ${key}`));
    
    // Organiseer ontbrekende sleutels per sectie
    const missingSections = {};
    missingKeys.forEach(key => {
      const section = key.split('.')[0];
      if (!missingSections[section]) {
        missingSections[section] = [];
      }
      missingSections[section].push(key);
    });
    
    console.log('\nOntbrekende sleutels per sectie:');
    for (const section in missingSections) {
      console.log(`\n${section}: ${missingSections[section].length} sleutels ontbreken`);
    }
  } else {
    console.log('Geen sleutels gevonden die in het Engels bestand bestaan maar niet in het Nederlands bestand.');
  }
  
} catch (error) {
  console.error('Er is een fout opgetreden:', error);
} 