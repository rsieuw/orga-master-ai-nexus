# Vertaalscripts voor OrgaMaster AI

Deze map bevat scripts die zijn gebruikt voor het verbeteren en onderhouden van de vertalingen in de OrgaMaster AI applicatie.

## Mapstructuur

- **analysis/**: Scripts voor het analyseren van vertaalbestanden
  - `check_missing_en_keys.js` - Controleert welke sleutels in het Engelse bestand ontbreken in het Nederlandse bestand
  - `check_missing_keys.js` - Controleert welke sleutels in het Nederlandse bestand ontbreken in het Engelse bestand
  - `check_nl_translations_simple.js` - Zoekt naar Engelse tekst in het Nederlandse vertaalbestand
  - `check_nl_translations.js` - Uitgebreide controle van Nederlandse vertalingen
  - `compare_file_sizes.js` - Vergelijkt de grootte en aantal regels van beide vertaalbestanden
  - `find_dupes_nl_toplevel.js` - Zoekt naar dubbele top-level sleutels in het Nederlandse bestand
  - `find_dupes.js` - Zoekt naar dubbele sleutels in vertaalbestanden
  - `find_nl_duplicates.js` - Zoekt naar dubbele secties in het Nederlandse bestand

- **fixes/**: Scripts voor het repareren van problemen in vertaalbestanden
  - `fix_nl_admin_sections.js` - Vertaalt admin-gerelateerde secties
  - `fix_nl_duplicates.js` - Verwijdert dubbele sleutels in het Nederlandse bestand
  - `fix_nl_errors.js` - Vertaalt de errors sectie
  - `fix_nl_remaining_english.js` - Vertaalt resterende Engelse teksten
  - `fix_nl_research_model.js` - Vertaalt research model secties
  - `fix_nl_translations.js` - Algemene vertaalcorrecties

- **utils/**: Hulpscripts voor vertalingen
  - `clean_nl_extra_keys.js` - Verwijdert overtollige sleutels uit het Nederlandse bestand
  - `clean_nl_translation.js` - Schoont het Nederlandse vertaalbestand op
  - `translate_missing_keys.js` - Vertaalt ontbrekende sleutels in het Nederlandse bestand

## Gebruik

De scripts zijn ontworpen om in volgorde te worden uitgevoerd:

1. Eerst de analyse-scripts om problemen te identificeren
2. Dan de fix-scripts om specifieke problemen op te lossen
3. Tot slot de utils-scripts voor opschoning en afronding

Alle scripts gebruiken ES modules en kunnen worden uitgevoerd met `node <scriptnaam>.js`

## Resultaten

Door deze scripts uit te voeren zijn de volgende verbeteringen bereikt:

- Verwijdering van dubbele sleutels en secties
- Vertaling van alle Engelse tekst in het Nederlandse bestand
- Synchronisatie van de structuur tussen Engelse en Nederlandse vertaalbestanden
- Toevoeging van ontbrekende vertalingen
- Opschoning van overtollige sleutels
