/**
 * @fileoverview Simple script to validate a JSON file.
 * It reads the specified JSON file (currently hardcoded to './public/locales/nl/translation.json')
 * and attempts to parse it. It logs whether the JSON is valid or invalid, along with any error message.
 */
import fs from 'fs';

const jsonPath = './public/locales/nl/translation.json';

try {
  const content = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(content);
  console.log('JSON is valid!');
} catch (error) {
  console.error('JSON is invalid:', error.message);
} 