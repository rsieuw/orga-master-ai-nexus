# Supabase Prestatie Optimalisaties

## Samenvatting

We hebben drie belangrijke prestatie-optimalisaties geïmplementeerd:

1. **Realtime Monitoring Systeem** - Een systeem om realtime queries te monitoren en analyseren, waarmee we problematische entiteiten en langzame queries kunnen identificeren.

2. **Metadata Query Optimalisatie** - Gematerialiseerde weergaven voor tabeldefinities en kolomdefinities om de belasting van systeemcatalogi te verminderen en metadata-queries te versnellen.

3. **Algemeen Prestatiemonitoringsysteem** - Een systeem dat query statistieken verzamelt en analyseert om de meest resource-intensieve queries te identificeren en optimaliseren.

Deze optimalisaties hebben als doel:

- De belasting op de database te verminderen
- De responstijd van queries te verbeteren
- Inzicht te geven in het databasegebruik
- Toekomstige optimalisaties te ondersteunen met concrete gegevens

## Beveiligingsverbeteringen (20250535)

Na implementatie van de prestatie-optimalisaties zijn er beveiligingsverbeteringen doorgevoerd om potentiële zwakke plekken in de database te elimineren:

1. **Vastleggen van search_path** - Alle functies zijn bijgewerkt om een expliciete `search_path` parameter te hebben, wat voorkomt dat kwaadwillende gebruikers het schema-zoekpad kunnen manipuleren:
   - `SET search_path = schema_name, pg_temp` toegevoegd aan alle functies
   - Beschermt tegen schema-hijacking aanvallen

2. **Juiste beveiligingscontext** - Functies zijn geconfigureerd met de juiste beveiligingscontext:
   - `SECURITY DEFINER` voor functies die gegevens wijzigen (zoals `log_request`)
   - `SECURITY INVOKER` voor read-only functies (zoals `report_top_queries`)

3. **Verbeterde documentatie** - Alle functies hebben commentaar gekregen dat de beveiligingscontroles uitlegt

Deze verbeteringen zorgen ervoor dat de prestatie-optimalisaties geen nieuwe beveiligingsrisico's introduceren.

---

Dit document bevat informatie over de prestatie-optimalisaties die zijn toegepast op de database.

## Overzicht van het probleem

Uit analyse van de query statistieken bleek dat er diverse prestatieproblemen waren:

1. De `realtime.list_changes` query werd zeer vaak aangeroepen (bijna 4 miljoen keer) met een totale uitvoeringstijd van meer dan 14 seconden.
2. Complexe metadataquery's voor het genereren van tabeldefinities duurden meer dan 1 seconde per stuk.
3. Er was geen systematische aanpak voor het monitoren van databaseprestaties.

## Geïmplementeerde optimalisaties

### 1. Realtime Monitoring (20250532)

Om realtime prestatieproblemen te volgen en op te lossen is een monitoringsysteem opgezet:

- Schema `realtime_monitor` voor het tracken van realtime verzoeken
- Functie `log_request` om realtime querygegevens te registreren
- Rapportagefuncties voor prestatie-analyse
- Opschoning van oude loggegevens

Met dit systeem kunnen we:

- Identificeren welke entiteiten het vaakst worden opgevraagd
- Lange queries opsporen en optimaliseren
- Patronen in realtime gebruik analyseren

### 2. Metadata Query Optimalisatie (20250533)

Voor het verbeteren van queries die database metadata ophalen:

- Gematerialiseerde weergave `api.table_definitions` voor tabeldefinities
- Gematerialiseerde weergave `api.column_definitions` voor kolomdefinities
- Functies voor het vernieuwen van deze weergaves
- Indexen voor snelle zoekacties

Deze optimalisaties zorgen ervoor dat veelgebruikte metadata-informatie vooraf wordt berekend en snel beschikbaar is, in plaats van steeds opnieuw te worden opgehaald via trage queries naar de systeemcatalogi.

### 3. Algemeen Prestatiemonitoringsysteem (20250534)

Voor het algeheel monitoren van databaseprestaties:

- Schema `api_monitoring` met tabel `query_stats`
- Functie `capture_query_stats` voor het verzamelen van query statistieken
- Rapportagefuncties voor het identificeren van zware queries
- Opschoning van oude statistieken

Dit systeem gebruikt de PostgreSQL `pg_stat_statements` extensie om query statistieken te verzamelen en op te slaan voor analyse. Het is compatibel met verschillende PostgreSQL versies door dynamische kolomnaamdetectie.

## Gebruik van de optimalisaties

### Realtime Monitoring

```sql
-- Loggen van een realtime verzoek
SELECT realtime_monitor.log_request(
  'entity_naam',
  duur_in_ms,
  aantal_resultaten,
  heeft_cursor,
  cursor_waarde
);

-- Opvragen van statistieken per entiteit
SELECT * FROM realtime_monitor.get_entity_stats();

-- Rapport van trage realtime verzoeken
SELECT * FROM realtime_monitor.report_slow_requests(5.0); -- drempel van 5ms
```

### Metadata Queries

```sql
-- Opvragen van tabeldefinities
SELECT * FROM api.table_definitions;

-- Opvragen van kolomdefinities
SELECT * FROM api.column_definitions;

-- Vernieuwen van definities (bijv. na DDL wijzigingen)
SELECT api.refresh_all_definitions();
```

### Prestatiemonitoring

```sql
-- Verzamelen van huidige query statistieken
SELECT api_monitoring.capture_query_stats();

-- Rapporteren van top-queries (meest resource-intensief)
SELECT * FROM api_monitoring.report_top_queries();

-- Opschonen van oude statistieken
SELECT api_monitoring.cleanup_old_stats(14); -- behoud 14 dagen aan data
```

## Best practices

1. Plan regelmatige verversing van gematerialiseerde weergaven:
   - Na grote structuurveranderingen in de database
   - Op regelmatige intervallen (bijv. dagelijks in rustige uren)

2. Verzamel prestatiestatistieken op regelmatige basis:
   - Gebruik een cron job voor `api_monitoring.capture_query_stats()`
   - Bekijk regelmatig de top-queries en optimaliseer deze

3. Schoon oude gegevens op om opslagruimte te behouden:
   - `realtime_monitor.cleanup_old_logs()`
   - `api_monitoring.cleanup_old_stats()`

4. Monitor het gebruik van de realtime functionaliteit:
   - Identificeer entiteiten die overmatig worden bevraagd
   - Pas client-side gedrag aan om het aantal verzoeken te verminderen

## Verdere aanbevelingen

1. Overweeg het gebruik van connection pooling om het aantal databaseverbindingen te beperken.
2. Implementeer query-caching op applicatieniveau voor veelgebruikte query's.
3. Optimaliseer grote tabellen door partitionering toe te passen waar zinvol.
4. Voer regelmatig VACUUM en ANALYZE uit om statistieken actueel te houden en opslagruimte te optimaliseren.
5. Zoek naar mogelijkheden om het aantal realtime abonnementen te beperken of rate limiting toe te passen.

## Conclusie

Deze optimalisaties vormen een solide basis voor het monitoren en verbeteren van de databaseprestaties. Door deze tools regelmatig te gebruiken en de verkregen inzichten toe te passen, kan de belasting op de database worden verminderd en de responsiviteit worden verbeterd. 