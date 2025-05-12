import fs from 'fs';

try {
  const jsonPath = './public/locales/nl/translation.json';
  const content = fs.readFileSync(jsonPath, 'utf8');
  
  // Regexp om dubbele sleutels te identificeren
  const keys = new Map();
  let lineNumber = 1;
  
  // Tel regels voor elke positie
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      lineNumber++;
    }
    
    // Zoek naar sleutels rond deze positie
    if (content[i] === '"' && content[i-1] !== '\\' && i > 0) {
      // Controleer of dit het begin van een sleutel is (kijk vooruit naar :)
      let j = i + 1;
      while (j < content.length && content[j] !== '"') j++;
      if (j < content.length) {
        // We hebben een sluitende aanhalingsteken gevonden
        j++;
        // Zoek naar een dubbele punt die volgt
        while (j < content.length && content[j] !== ':' && content[j] !== '\n') j++;
        if (j < content.length && content[j] === ':') {
          // Dit is een sleutel
          const key = content.substring(i + 1, j - 1);
          if (keys.has(key)) {
            console.log(`Dubbele sleutel gevonden: "${key}" op regel ${lineNumber} (eerder gevonden op regel ${keys.get(key)})`);
          } else {
            keys.set(key, lineNumber);
          }
        }
      }
    }
  }
  
  // Probeer te parsen om de exacte locatie van de fout te krijgen
  try {
    JSON.parse(content);
    console.log('JSON is geldig, geen dubbele sleutels gevonden.');
  } catch (err) {
    console.error('JSON parse error:', err.message);
    
    // Probeer de exacte locatie van de fout te bepalen
    const match = err.message.match(/position (\d+)/);
    if (match) {
      const errorPosition = parseInt(match[1]);
      lineNumber = 1;
      for (let i = 0; i < errorPosition && i < content.length; i++) {
        if (content[i] === '\n') lineNumber++;
      }
      console.log(`Fout waarschijnlijk op regel ${lineNumber}`);
      
      // Toon context rond de foutpositie
      const start = Math.max(0, errorPosition - 50);
      const end = Math.min(content.length, errorPosition + 50);
      console.log('Context rond fout:');
      console.log(content.substring(start, end));
    }
  }
  
} catch (error) {
  console.error(`Fout bij lezen bestand: ${error.message}`);
} 