import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const enTranslationPath = path.join(__dirname, 'public', 'locales', 'en', 'translation.json');
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');

try {
  // Lees beide vertaalbestanden
  const enTranslationData = fs.readFileSync(enTranslationPath, 'utf8');
  const nlTranslationData = fs.readFileSync(nlTranslationPath, 'utf8');
  
  // Bereken de bestandsgrootte
  const enFileSizeBytes = Buffer.byteLength(enTranslationData, 'utf8');
  const nlFileSizeBytes = Buffer.byteLength(nlTranslationData, 'utf8');
  
  // Tel het aantal regels
  const enLines = enTranslationData.split('\n').length;
  const nlLines = nlTranslationData.split('\n').length;
  
  // Analyseer de JSON inhoud
  const enTranslation = JSON.parse(enTranslationData);
  const nlTranslation = JSON.parse(nlTranslationData);
  
  // Functie om het aantal sleutels in een object te tellen (inclusief geneste objecten)
  function countKeys(obj, prefix = '') {
    let count = 0;
    
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Als de waarde een object is, recursief tellen
        count += countKeys(obj[key]);
      } else {
        // Als de waarde geen object is, tellen als sleutel
        count++;
      }
    }
    
    return count;
  }
  
  const enKeyCount = countKeys(enTranslation);
  const nlKeyCount = countKeys(nlTranslation);
  
  // Resultaten tonen
  console.log('Vergelijking van vertaalbestanden:');
  console.log('----------------------------------');
  console.log(`Engels bestand (${path.basename(enTranslationPath)}): ${enFileSizeBytes} bytes, ${enLines} regels, ${enKeyCount} sleutels`);
  console.log(`Nederlands bestand (${path.basename(nlTranslationPath)}): ${nlFileSizeBytes} bytes, ${nlLines} regels, ${nlKeyCount} sleutels`);
  
  // Bereken het verschil
  const sizeDiffBytes = enFileSizeBytes - nlFileSizeBytes;
  const sizeDiffPercentage = (sizeDiffBytes / enFileSizeBytes) * 100;
  const linesDiff = enLines - nlLines;
  const keysDiff = enKeyCount - nlKeyCount;
  
  console.log('\nVerschil:');
  console.log(`Bytes: ${Math.abs(sizeDiffBytes)} (${Math.abs(sizeDiffPercentage).toFixed(2)}%) ${sizeDiffBytes > 0 ? 'kleiner' : 'groter'}`);
  console.log(`Regels: ${Math.abs(linesDiff)} ${linesDiff > 0 ? 'minder' : 'meer'}`);
  console.log(`Sleutels: ${Math.abs(keysDiff)} ${keysDiff > 0 ? 'minder' : 'meer'}`);
  
} catch (error) {
  console.error('Er is een fout opgetreden:', error);
} 