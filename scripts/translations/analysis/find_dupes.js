/**
 * @fileoverview Script to find duplicate keys in a JSON translation file.
 * It reads the specified JSON file (currently hardcoded to './public/locales/nl/translation.json'),
 * attempts to identify duplicate keys by parsing the content, and also tries to parse the JSON
 * to catch syntax errors, reporting the approximate line number of issues found.
 */
import fs from 'node:fs';

try {
  const jsonPath = './public/locales/nl/translation.json';
  const content = fs.readFileSync(jsonPath, 'utf8');
  
  // Regex to identify duplicate keys (simplified approach, a full parser is more robust)
  const keys = new Map();
  let lineNumber = 1;
  
  // Count lines for each position
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      lineNumber++;
    }
    
    // Search for keys around this position
    if (content[i] === '"' && content[i-1] !== '\\' && i > 0) {
      // Check if this is the start of a key (look ahead for :)
      let j = i + 1;
      while (j < content.length && content[j] !== '"') j++;
      if (j < content.length) {
        // We found a closing quote
        j++;
        // Search for a colon that follows
        while (j < content.length && content[j] !== ':' && content[j] !== '\n') j++;
        if (j < content.length && content[j] === ':') {
          // This is a key
          const key = content.substring(i + 1, j - 1);
          if (keys.has(key)) {
            console.log(`Duplicate key found: "${key}" on line ${lineNumber} (previously found on line ${keys.get(key)})`);
          } else {
            keys.set(key, lineNumber);
          }
        }
      }
    }
  }
  
  // Try to parse to get the exact location of the error
  try {
    JSON.parse(content);
    console.log('JSON is valid, no duplicate keys found by parser (manual check might still be needed for logic errors).');
  } catch (err) {
    console.error('JSON parse error:', err.message);
    
    // Try to determine the exact location of the error
    const match = err.message.match(/position (\d+)/);
    if (match) {
      const errorPosition = parseInt(match[1]);
      lineNumber = 1;
      for (let i = 0; i < errorPosition && i < content.length; i++) {
        if (content[i] === '\n') lineNumber++;
      }
      console.log(`Error likely on line ${lineNumber}`);
      
      // Show context around the error position
      const start = Math.max(0, errorPosition - 50);
      const end = Math.min(content.length, errorPosition + 50);
      console.log('Context around error:');
      console.log(content.substring(start, end));
    }
  }
  
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
} 