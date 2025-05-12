import fs from 'fs';

const jsonPath = './public/locales/nl/translation.json';

try {
  const content = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(content);
  console.log('JSON is geldig!');
} catch (error) {
  console.error('JSON is ongeldig:', error.message);
} 