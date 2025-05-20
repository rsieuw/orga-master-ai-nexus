/**
 * @fileoverview Script to find duplicate top-level keys in a JSON translation file.
 * It reads the specified JSON file (currently hardcoded to './public/locales/nl/translation.json'),
 * identifies duplicate top-level keys, and reports them.
 */
import fs from 'node:fs';

try {
  const jsonPath = './public/locales/nl/translation.json';
  const content = fs.readFileSync(jsonPath, 'utf8');
  
  // Parse JSON to get the top-level keys
  const parsed = JSON.parse(content);
  const topLevelKeys = Object.keys(parsed);
  
  // Check for duplicates
  const seen = new Set();
  const duplicates = [];
  
  topLevelKeys.forEach(key => {
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  });
  
  if (duplicates.length > 0) {
    console.log("Duplicated top-level keys found in", jsonPath + ":");
    duplicates.forEach(key => console.log(`- "${key}"`));
  } else {
    console.log("No duplicated top-level keys found in", jsonPath);
  }
  
  // Compare with English file to find missing translations
  const enPath = './public/locales/en/translation.json';
  const enContent = fs.readFileSync(enPath, 'utf8');
  const enParsed = JSON.parse(enContent);
  const enTopLevelKeys = Object.keys(enParsed);
  
  // Check for keys in English not in Dutch
  const missingInDutch = enTopLevelKeys.filter(key => !topLevelKeys.includes(key));
  if (missingInDutch.length > 0) {
    console.log("\nTop-level keys present in English but missing in Dutch:");
    missingInDutch.forEach(key => console.log(`- "${key}"`));
  }
  
  // Check for keys in Dutch not in English
  const extraInDutch = topLevelKeys.filter(key => !enTopLevelKeys.includes(key));
  if (extraInDutch.length > 0) {
    console.log("\nTop-level keys present in Dutch but missing in English:");
    extraInDutch.forEach(key => console.log(`- "${key}"`));
  }
  
  console.log("\nTotaal aantal top-level keys in Nederlands bestand:", topLevelKeys.length);
  console.log("Totaal aantal top-level keys in Engels bestand:", enTopLevelKeys.length);
  
  // Check for English text in Dutch translations (basic check)
  const englishPhrases = ['Interface Language', 'Layout Preference Saved', 'Email Notifications', 'Account updated'];
  const possibleEnglishInDutch = [];
  
  englishPhrases.forEach(phrase => {
    if (content.includes(`"${phrase}"`)) {
      possibleEnglishInDutch.push(phrase);
    }
  });
  
  if (possibleEnglishInDutch.length > 0) {
    console.log("\nPossible English phrases found in Dutch translations:");
    possibleEnglishInDutch.forEach(phrase => console.log(`- "${phrase}"`));
  }
  
} catch (error) {
  console.error("Error:", error.message);
} 