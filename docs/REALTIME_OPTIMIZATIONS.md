# Realtime Optimalisaties

## Overzicht

Dit document beschrijft de optimalisaties die zijn doorgevoerd om het probleem met de hoge database belasting door Realtime queries op te lossen. Het voornaamste probleem was dat de query `realtime.list_changes` 97,6% van de database resource gebruikte.

## Uitgevoerde optimalisaties

### 1. Supabase Client Configuratie

De Supabase client is aangepast in `src/integrations/supabase/client.ts` met optimale realtime-instellingen:

```javascript
export const supabase = createClient<Database>(
  SUPABASE_URL!, 
  SUPABASE_PUBLISHABLE_KEY!,
  {
    realtime: {
      params: {
        eventsPerSecond: 1,
        retryAfterError: 5000,
        heartbeatIntervalMs: 60000,
      }
    }
  }
);
```

Dit beperkt:

- Het aantal events per seconde tot 1
- Vertraagt heraansluitingen na fouten tot 5 seconden
- Vermindert de heartbeat frequentie tot één keer per minuut

### 2. Geoptimaliseerde Realtime Subscriptions

De Realtime subscriptions in `src/contexts/TaskContext.tsx` zijn aangepast met:

- Specifieke filters op `user_id` om alleen relevante wijzigingen te ontvangen
- Lokale state updates voor `UPDATE` events zonder opnieuw alles op te halen
- Alleen volledige refreshes bij `INSERT` en `DELETE` events

```javascript
const subscription = supabase
  .channel(`public:tasks:user_id=eq.${user.id}`)
  .on(
    "postgres_changes",
    { 
      event: "*", 
      schema: "public", 
      table: "tasks",
      filter: `user_id=eq.${user.id}`
    },
    (payload) => {
      // Optimized handling logic
    }
  )
  .subscribe();
```

### 3. Client-side Caching

Er is een caching mechanisme geïmplementeerd in `src/lib/cache-utils.ts`:

- In-memory cache met TTL (time-to-live)
- Voorkomt overbodige queries voor dezelfde data
- Gebruikt voor taken met een TTL van 60 seconden

```javascript
// In fetchTasks
const cachedTasks = await tasksCache.getOrFetch(cacheKey, fetchAndTransformTasks);
```

### 4. Database Optimalisaties

Nieuwe indexen gemaakt in `supabase/migrations/20250522_optimize_realtime_queries.sql`:

- Index op `user_id` kolom
- Index op `updated_at` kolom
- Gecombineerde index op `user_id` en `updated_at`
- Optimale replicatie configuratie met `REPLICA IDENTITY FULL`

## Te verwachten resultaten

Deze optimalisaties zullen:

1. De belasting op de Supabase database aanzienlijk verminderen
2. De responsiviteit van de applicatie verbeteren
3. De stabiliteit vergroten door minder verbindingen en verzoeken
4. Potentieel de kosten verlagen doordat er minder databaseresources worden gebruikt

## Hoe te testen

Na implementatie:

1. Monitor de database-metrieken over 24-48 uur
2. Let op de percentages voor `realtime.list_changes` in de database statistieken
3. Vergelijk de snelheid en prestaties van de applicatie

## Verdere aanbevelingen

Voor nog meer optimalisatie:

- Overweeg polling voor minder tijdkritische gegevens
- Implementeer server-side caching voor veelgebruikte queries
- Segmenteer realtime functionaliteit tot alleen essentiële onderdelen

## Referenties

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
