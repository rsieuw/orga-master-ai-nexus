/**
 * @fileoverview Script to analyze the Dutch translation file and find duplicate sections.
 * This helps identify and remove redundant structures that make the file larger than it needs to be.
 */
import fs from 'node:fs';

const NL_PATH = './public/locales/nl/translation.json';
const EN_PATH = './public/locales/en/translation.json';

try {
  // Load and parse the translation files
  const nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const nlJson = JSON.parse(nlContent);
  
  // Find duplicate object structures across different paths
  console.log("Analyzing Dutch translation file for duplicated sections...\n");
  
  // First approach: Look for duplicated nested structures directly
  const objectPaths = {};
  collectObjectPaths(nlJson, '', objectPaths);
  
  // Convert objects to strings for comparison
  const objectSignatures = {};
  
  for (const [path, obj] of Object.entries(objectPaths)) {
    // Only consider objects of reasonable size
    if (Object.keys(obj).length > 2) {
      const signature = JSON.stringify(obj);
      
      if (!objectSignatures[signature]) {
        objectSignatures[signature] = [path];
      } else {
        objectSignatures[signature].push(path);
      }
    }
  }
  
  // Find duplicates
  console.log("--- DUPLICATED SECTIONS ---");
  let duplicatesFound = false;
  
  for (const [signature, paths] of Object.entries(objectSignatures)) {
    if (paths.length > 1) {
      duplicatesFound = true;
      const obj = JSON.parse(signature);
      const keys = Object.keys(obj);
      
      console.log(`\nDuplicated object found at ${paths.length} locations:`);
      paths.forEach(path => console.log(`- ${path}`));
      console.log(`Contains ${keys.length} keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
      console.log(`Object structure preview: ${signature.substring(0, 100)}${signature.length > 100 ? '...' : ''}`);
    }
  }
  
  if (!duplicatesFound) {
    console.log("No clear duplicated sections found.");
  }
  
  // Second approach: Look for sections with identical keys
  console.log("\n--- SECTIONS WITH IDENTICAL KEYS ---");
  const topLevelSections = {};
  
  for (const key of Object.keys(nlJson)) {
    if (typeof nlJson[key] === 'object' && nlJson[key] !== null) {
      const nestedKeys = Object.keys(nlJson[key]).sort().join(',');
      
      if (!topLevelSections[nestedKeys]) {
        topLevelSections[nestedKeys] = [key];
      } else {
        topLevelSections[nestedKeys].push(key);
      }
    }
  }
  
  let similarSectionsFound = false;
  
  for (const [keySet, sections] of Object.entries(topLevelSections)) {
    if (sections.length > 1 && keySet.split(',').length > 3) {
      similarSectionsFound = true;
      console.log(`\nSections with identical structure: ${sections.join(', ')}`);
      console.log(`Contains keys: ${keySet}`);
    }
  }
  
  if (!similarSectionsFound) {
    console.log("No sections with identical key structures found.");
  }
  
} catch (error) {
  console.error("Error:", error.message);
}

// Helper function to collect paths to objects in the JSON structure
function collectObjectPaths(obj, currentPath, result) {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  
  // Store this object at current path
  if (currentPath) {
    result[currentPath] = obj;
  }
  
  // Recurse through object properties
  for (const key of Object.keys(obj)) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      collectObjectPaths(obj[key], newPath, result);
    }
  }
} 