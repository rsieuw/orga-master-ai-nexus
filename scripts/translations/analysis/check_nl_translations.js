/**
 * @fileoverview Script to analyze the Dutch translation file for issues like:
 * 1. English text that should be translated to Dutch
 * 2. Duplicated keys at any nesting level
 * 3. Comparison with the English file structure
 */
import fs from 'node:fs';

const NL_PATH = './public/locales/nl/translation.json';
const EN_PATH = './public/locales/en/translation.json';

// Common English words that are likely not proper Dutch
const ENGLISH_INDICATORS = [
  'Interface Language',
  'Layout Preference Saved',
  'Email Notifications',
  'Account updated',
  'could not',
  'saved.',
  'has been',
  'settings',
  'notification',
  'successfully',
  'Please',
  'Select',
  'Choose',
  'Error',
  'Saved',
  'Preference',
  'preference',
  'changed'
];

// Load the translation files
try {
  const nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const enContent = fs.readFileSync(EN_PATH, 'utf8');
  
  const nlJson = JSON.parse(nlContent);
  const enJson = JSON.parse(enContent);
  
  console.log("=== ANALYSIS OF DUTCH TRANSLATION FILE ===\n");
  
  // Collect paths to all string values in both files
  const nlPaths = collectPaths(nlJson);
  const enPaths = collectPaths(enJson);
  
  // Find potential English texts in Dutch file
  console.log("--- POTENTIAL ENGLISH TEXT IN DUTCH TRANSLATION ---");
  let englishTextCount = 0;
  
  nlPaths.forEach(path => {
    const value = getValueAtPath(nlJson, path);
    if (typeof value === 'string' && containsEnglishIndicators(value)) {
      // Check if the same path in English has the same value
      const enValue = getValueAtPath(enJson, path);
      if (value === enValue) {
        console.log(`- Path: ${path}`);
        console.log(`  Value: "${value}"\n`);
        englishTextCount++;
      }
    }
  });
  
  if (englishTextCount === 0) {
    console.log("No clear English text found in Dutch translation.\n");
  } else {
    console.log(`Found ${englishTextCount} potentially untranslated texts.\n`);
  }
  
  // Find paths that exist in Dutch but not in English (possible duplicates)
  console.log("--- PATHS IN DUTCH BUT NOT IN ENGLISH ---");
  const onlyInDutch = nlPaths.filter(path => !enPaths.includes(path));
  
  if (onlyInDutch.length === 0) {
    console.log("No paths found in Dutch that don't exist in English.\n");
  } else {
    console.log(`Found ${onlyInDutch.length} paths in Dutch not in English. Examples:`);
    onlyInDutch.slice(0, 10).forEach(path => {
      const value = getValueAtPath(nlJson, path);
      console.log(`- Path: ${path}`);
      console.log(`  Value: "${value}"\n`);
    });
    if (onlyInDutch.length > 10) {
      console.log(`... and ${onlyInDutch.length - 10} more\n`);
    }
  }
  
  // Find duplicated values in Dutch (possible copy-pasted sections)
  console.log("--- DUPLICATED VALUES IN DUTCH ---");
  const valueCounts = new Map();
  const duplicatedValues = [];
  
  nlPaths.forEach(path => {
    const value = getValueAtPath(nlJson, path);
    if (typeof value === 'string' && value.length > 15) {
      // Only check longer strings to avoid common short phrases
      if (!valueCounts.has(value)) {
        valueCounts.set(value, [path]);
      } else {
        valueCounts.get(value).push(path);
      }
    }
  });
  
  valueCounts.forEach((paths, value) => {
    if (paths.length > 1) {
      duplicatedValues.push({ value, paths });
    }
  });
  
  if (duplicatedValues.length === 0) {
    console.log("No significant duplicated string values found.\n");
  } else {
    console.log(`Found ${duplicatedValues.length} duplicated values. Examples:`);
    duplicatedValues.slice(0, 5).forEach(({ value, paths }) => {
      console.log(`- Value: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
      console.log(`  Found at ${paths.length} locations:`);
      paths.slice(0, 3).forEach(path => console.log(`  - ${path}`));
      if (paths.length > 3) {
        console.log(`  ... and ${paths.length - 3} more`);
      }
      console.log();
    });
    if (duplicatedValues.length > 5) {
      console.log(`... and ${duplicatedValues.length - 5} more duplicated values\n`);
    }
  }
  
  // Find nested duplicate structures (possible duplicated objects)
  console.log("--- SUMMARY ---");
  console.log(`Total paths in Dutch translation: ${nlPaths.length}`);
  console.log(`Total paths in English translation: ${enPaths.length}`);
  console.log(`Difference: ${nlPaths.length - enPaths.length} more paths in Dutch\n`);
  
} catch (error) {
  console.error("Error:", error.message);
}

// Helper functions
function collectPaths(obj, currentPath = '', paths = []) {
  for (const key in obj) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      collectPaths(obj[key], newPath, paths);
    } else {
      paths.push(newPath);
    }
  }
  return paths;
}

function containsEnglishIndicators(text) {
  return ENGLISH_INDICATORS.some(indicator => 
    text.includes(indicator) && text.length > indicator.length + 5);
}

function getValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
} 