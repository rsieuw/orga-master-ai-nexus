/**
 * @fileoverview Simple script to find English texts in the Dutch translation file.
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
  'could not save',
  'has been set to',
  'settings have been',
  'Please upgrade',
  'Select model',
  'Choose which model',
  'language has been set',
  'Interface layout'
];

try {
  // Load and parse the translation files
  const nlContent = fs.readFileSync(NL_PATH, 'utf8');
  const enContent = fs.readFileSync(EN_PATH, 'utf8');
  
  console.log("Checking for English phrases in Dutch translation file...\n");
  
  // Simple check for English phrases in the Dutch file
  let foundCount = 0;
  ENGLISH_INDICATORS.forEach(phrase => {
    if (nlContent.includes(`"${phrase}"`)) {
      console.log(`Found "${phrase}" in Dutch translation file`);
      foundCount++;
    }
  });
  
  if (foundCount === 0) {
    console.log("No common English phrases found.");
  } else {
    console.log(`\nFound ${foundCount} English phrases in Dutch translation file.`);
  }
  
  // Count lines to verify file sizes
  const nlLines = nlContent.split('\n').length;
  const enLines = enContent.split('\n').length;
  
  console.log(`\nDutch translation file has ${nlLines} lines`);
  console.log(`English translation file has ${enLines} lines`);
  console.log(`Difference: ${nlLines - enLines} more lines in Dutch file`);
  
  // Look for direct English to Dutch lookups
  console.log("\nChecking for specific untranslated sections...");
  
  // Target common sections that often have untranslated content
  const sections = [
    '"tasks": ',
    '"profile": ',
    '"account": ',
    '"label": ',
    '"description": ',
    '"title": '
  ];
  
  sections.forEach(section => {
    // Extract 20 characters after the section marker for both files
    const nlMatches = findStringContext(nlContent, section, 40);
    const enMatches = findStringContext(enContent, section, 40);
    
    // Check if any exact English matches appear in Dutch file
    const exactMatches = enMatches.filter(enMatch => 
      nlMatches.some(nlMatch => 
        nlMatch === enMatch && 
        enMatch.length > 10 && 
        !isNeutralContent(enMatch)
      )
    );
    
    if (exactMatches.length > 0) {
      console.log(`\nFound ${exactMatches.length} matches for "${section}" where English text appears in Dutch file:`);
      exactMatches.slice(0, 5).forEach(match => {
        console.log(`- "${match}"`);
      });
      if (exactMatches.length > 5) {
        console.log(`(${exactMatches.length - 5} more not shown)`);
      }
    }
  });
  
} catch (error) {
  console.error("Error:", error.message);
}

// Helper functions
function findStringContext(content, searchString, contextLength) {
  const results = [];
  let position = 0;
  
  while (true) {
    position = content.indexOf(searchString, position);
    if (position === -1) break;
    
    // Extract the text after the search string
    const extractedText = content.substring(
      position,
      position + searchString.length + contextLength
    );
    
    results.push(extractedText);
    position += searchString.length;
    
    // Limit to prevent infinite loops or excessive results
    if (results.length > 100) break;
  }
  
  return results;
}

function isNeutralContent(text) {
  // Words or content that can be the same in Dutch and English
  const neutralContent = [
    'email',
    'password',
    'notification',
    'generatingResponse',
    'defaultTaskTitle',
    'interface',
    'AI',
    'updatedAt',
    'label',
    '{{'
  ];
  
  return neutralContent.some(neutral => text.includes(neutral));
} 