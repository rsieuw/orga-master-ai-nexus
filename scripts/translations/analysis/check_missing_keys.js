/**
 * @fileoverview Script to find keys that exist in the Dutch translation file but not in the English file.
 * This helps identify additional content that might need to be removed.
 */
import fs from 'node:fs';

const NL_PATH = './public/locales/nl/translation.json';
const EN_PATH = './public/locales/en/translation.json';

try {
  // Load and parse the translation files
  const nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const enContent = fs.readFileSync(EN_PATH, 'utf8');
  
  const nlJson = JSON.parse(nlContent);
  const enJson = JSON.parse(enContent);
  
  console.log("Finding keys that exist in Dutch file but not in English file...\n");
  
  // Collect all paths in both files
  const nlPaths = collectPaths(nlJson);
  const enPaths = collectPaths(enJson);
  
  // Find paths that exist in Dutch but not in English
  const onlyInDutch = nlPaths.filter(path => !enPaths.includes(path));
  
  if (onlyInDutch.length === 0) {
    console.log("No keys found in Dutch file that don't exist in English file.");
  } else {
    console.log(`Found ${onlyInDutch.length} keys in Dutch file that don't exist in English file:`);
    
    // Group by top-level key to organize output
    const groupedKeys = {};
    onlyInDutch.forEach(path => {
      const topLevel = path.split('.')[0];
      if (!groupedKeys[topLevel]) {
        groupedKeys[topLevel] = [];
      }
      groupedKeys[topLevel].push(path);
    });
    
    for (const [topLevel, paths] of Object.entries(groupedKeys)) {
      console.log(`\n--- In "${topLevel}" section: ${paths.length} keys ---`);
      paths.forEach(path => {
        const value = getValueAtPath(nlJson, path);
        console.log(`- ${path}: "${value}"`);
      });
    }
  }
  
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

function getValueAtPath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  
  return current;
} 