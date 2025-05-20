import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES modules hebben __dirname niet, dus we maken het zelf
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paden naar de vertaalbestanden
const nlTranslationPath = path.join(__dirname, 'public', 'locales', 'nl', 'translation.json');

// Vertaalmap voor admin secties
const adminTranslations = {
  // adminInternalApiUsagePage sectie
  "Internal API Usage Log Details": "Loggegevens intern API-gebruik",
  "Loading logs...": "Logboeken laden...",
  "Error loading logs": "Fout bij laden logboeken",
  "No API Usage Data Available": "Geen API-gebruiksgegevens beschikbaar",
  "There are currently no internal API calls logged in the system. This could be because the application is new or no users have triggered any internal API functions yet.": "Er zijn momenteel geen interne API-aanroepen geregistreerd in het systeem. Dit kan komen doordat de applicatie nieuw is of omdat er nog geen gebruikers interne API-functies hebben gebruikt.",
  "Data Structure Issue": "Probleem met gegevensstructuur",
  "The API returned raw logs but no aggregated data. Please contact the system administrator as there may be an issue with the API endpoint.": "De API heeft ruwe logs geretourneerd maar geen geaggregeerde gegevens. Neem contact op met de systeembeheerder, er kan een probleem zijn met het API-eindpunt.",

  // adminExternalApiUsagePage sectie
  "External API Usage": "Extern API-gebruik",
  "Monitor and analyze usage of external APIs.": "Monitor en analyseer gebruik van externe APIs.",
  "Timestamp": "Tijdstempel",
  "User": "Gebruiker",
  "Service": "Service",
  "Function": "Functie",
  "Prompt Tokens": "Prompt Tokens",
  "Completion Tokens": "Completion Tokens",
  "Total Tokens": "Totaal Tokens",
  "Cost": "Kosten",
  "Status": "Status",
  "Details/Error": "Details/Fout",
  "No external API usage logs found.": "Geen externe API-gebruikslogs gevonden.",
  "Loading more entries...": "Meer resultaten laden...",
  "Error Fetching Logs": "Fout bij ophalen logboeken",
  "Error Fetching Users": "Fout bij ophalen gebruikers",
  "An unknown error occurred.": "Er is een onbekende fout opgetreden.",
  "Could not fetch external API logs.": "Kon externe API-logs niet ophalen.",
  "External API Usage Log Details": "Loggegevens extern API-gebruik",
  "View Error": "Toon fout",
  "No Raw API Usage Data Available": "Geen ruwe API-gebruiksgegevens beschikbaar",
  "There are currently no raw external API call logs in the system. This could mean no external services have been called yet.": "Er zijn momenteel geen ruwe externe API-aanroeplogboeken in het systeem. Dit kan betekenen dat er nog geen externe services zijn aangeroepen.",
  "No Aggregated API Usage Data Available": "Geen geaggregeerde API-gebruiksgegevens beschikbaar",
  "Although raw logs might exist, no aggregated data could be generated. This might indicate an issue with the aggregation process or simply no data to aggregate for the selected filters.": "Hoewel er ruwe logboeken kunnen bestaan, konden er geen geaggregeerde gegevens worden gegenereerd. Dit kan wijzen op een probleem met het aggregatieproces of er is eenvoudigweg geen data om te aggregeren voor de geselecteerde filters.",
  "No aggregated data available to display this chart.": "Geen geaggregeerde gegevens beschikbaar om deze grafiek weer te geven.",

  // Enkele chart-gerelateerde items
  "Token Usage Over Time": "Tokenverbruik over tijd",
  "Error loading chart data": "Fout bij laden grafiekgegevens",
  "No token data available to display.": "Geen tokengegevens beschikbaar om weer te geven.",
  "No cost data available to display chart.": "Geen kostengegevens beschikbaar om grafiek weer te geven."
};

try {
  // Lees het Nederlandse vertaalbestand
  const nlTranslation = JSON.parse(fs.readFileSync(nlTranslationPath, 'utf8'));
  
  // Functie om een object recursief te doorzoeken en te vertalen
  function translateSection(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (typeof obj === 'string' && adminTranslations[obj]) {
      return adminTranslations[obj];
    }
    
    const result = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string' && adminTranslations[obj[key]]) {
          result[key] = adminTranslations[obj[key]];
        } else {
          result[key] = translateSection(obj[key]);
        }
      }
    }
    
    return result;
  }
  
  // Focus op specifieke secties
  const sectionsToTranslate = [
    'adminInternalApiUsagePage',
    'adminExternalApiUsagePage',
    'charts'
  ];

  console.log('Vertaal admin secties in het Nederlandse bestand...');
  
  // Vertaal elke sectie
  sectionsToTranslate.forEach(section => {
    if (nlTranslation[section]) {
      nlTranslation[section] = translateSection(nlTranslation[section]);
      console.log(`Sectie '${section}' vertaald.`);
    } else {
      console.log(`Sectie '${section}' niet gevonden.`);
    }
  });
  
  // Schrijf de bijgewerkte vertaling terug naar het bestand
  fs.writeFileSync(
    nlTranslationPath, 
    JSON.stringify(nlTranslation, null, 2),
    'utf8'
  );
  
  console.log('Admin secties succesvol vertaald!');
  
} catch (error) {
  console.error('Fout bij het verwerken van het vertaalbestand:', error);
} 