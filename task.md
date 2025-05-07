# Takenlijst: OrgaMaster AI

## Prioriteit 1: Basisfunctionaliteit

- ✅ **[AUTH] Gebruikersauthenticatie Opzetten:**
  - ✅ Implementeer Supabase Auth voor gebruikersregistratie en login (Context, basis functies).
  - ✅ Maak login/registratie formulieren/pagina's (AuthModal, Login.tsx, Register.tsx).
    - ✅ Visuele pariteit tussen Login en Register pagina's (gradient achtergrond, icoon).
    - ✅ Gradient styling voor registratieknop.
    - ✅ Wachtwoord zichtbaarheid toggle in registratieformulier.
  - ✅ Beveilig routes/data zodat alleen ingelogde gebruikers toegang hebben.
  - ✅ Implementeer check voor 'inactive' status bij inloggen (in AuthContext).
- ✅ **[CORE] Taak CRUD Operaties:**
  - ✅ Definieer database schema voor taken (titel, beschrijving, status, prioriteit, deadline, user_id, subtasks).
    - **Opmerking over Deadline:** De `deadline` wordt opgeslagen als een `timestamp with time zone`. Bij het specificeren van een deadline kan optioneel ook een tijdstip worden meegegeven (bv. "2024-08-15 17:00"). Als geen tijdstip wordt opgegeven, kan een standaard tijd (bv. einde van de dag) worden aangenomen.
  - ✅ Implementeer Supabase functies/API-calls voor het aanmaken, lezen, updaten, en verwijderen van taken.
  - ✅ Bouw UI componenten voor het weergeven van takenlijsten.
  - ✅ Bouw UI componenten (bv. een formulier/modal) voor het toevoegen/bewerken van taken.
  - ✅ **[DONE]** Definieer/implementeer de actie voor de "Nieuwe Taak Toevoegen" knop op het lege dashboard (opent nu modal).
- ✅ **[UI] Basis Layout & Navigatie:**
  - ✅ Ontwerp en implementeer de hoofd layout van de applicatie (bv. sidebar, header).
  - ✅ Zet basis navigatie op tussen verschillende secties (bv. Takenlijst, Instellingen).
  - ✅ Refactor Admin secties (Gebruikers, Permissies) naar tabs in Admin Dashboard.

## Prioriteit 2: Kern AI Functies

- ✅ **[AI] Generatie Taak Titel/Beschrijving:**
  - ✅ Integreer met een AI model (via een Supabase Edge Function) voor het genereren van tekst.
  - ✅ Ontwikkel logica in de Edge Function die een initiële input (bv. een korte zin van de gebruiker) ontvangt en een gestructureerde suggestie retourneert voor een `titel` en `beschrijving` van de taak.
  - ✅ Roep de Edge Function aan vanuit de "Genereer Taakdetails" knop in `NewTaskDialog.tsx` en vul de titel/beschrijving velden in met de AI-suggestie.
- ✅ **[AI] Subtaak Generatie:**
  - ✅ Edge Function `generate-subtasks` gemaakt die op basis van `taskId` taakdetails, chat, notities en **opgeslagen onderzoek** ophaalt en subtaken genereert via AI.
  - ✅ Frontend (`ChatPanel.tsx`) triggert deze functie via keywords ("maak/genereer/splits/aanmaken subtaken/taken" in NL/EN).
  - ✅ Gegenereerde subtaken worden toegevoegd aan de taak.
  - ✅ Bevestiging met gegenereerde subtaken wordt getoond in chat (met `<ul><li>` HTML-opmaak via `rehype-raw`).
  - ✅ Prompt aangepast om ook onopgeslagen onderzoek uit *recente* chatgeschiedenis mee te nemen.
- ✅ **[AI] "Deep Research" Integratie:**
  - ✅ Bestaande `deep-research` Supabase functie onderzocht en gebruikt nu Perplexity AI.
  - ✅ Integreer deze functie zodat gebruikers AI kunnen vragen om onderzoek te doen gerelateerd aan een specifieke taak (Via knop en chat trigger geïmplementeerd in `ChatPanel.tsx`).
  - ✅ Toon de onderzoeksresultaten in de UI, gekoppeld aan de taak (Getoond in `ChatPanel` met type `research_result`).
  - ✅ "Sla onderzoek op" knop toegevoegd (`save-research` functie).
  - ✅ Opgeslagen onderzoek wordt persistent getoond (`saved_research_display` type) en behouden na wissen geschiedenis.
  - ✅ Verwijderknop toegevoegd voor opgeslagen onderzoek (`delete-research` functie).
  - ✅ Prompt aangepast om meer detail en stappen te vragen; `max_tokens` verhoogd naar 1500.
  - ✅ Implementeer rol-gebaseerde toegang tot deze feature (`role_permissions` (`choose_research_model`), DB functie, `hasPermission` helper, UI aanpassing, admin UI).
  - 🟡 AI volgt opmaakinstructies (genummerde lijst) nog niet perfect.

## Prioriteit 3: Verbeteringen & Extra's

- ✅ **[UI] Chat UI/UX:**
  - ✅ Notities (`task_notes`) worden persistent getoond in chat (`note_saved` type) en behouden na wissen geschiedenis.
  - ✅ Verwijderknop toegevoegd voor notitieberichten (`deleteNote`).
  - ✅ Opgeslagen onderzoek (`saved_research`) wordt persistent getoond (`saved_research_display`).
  - ✅ Verwijderknop toegevoegd voor opgeslagen onderzoek (`deleteResearch`).
  - ✅ Markdown rendering verbeterd (`rehype-raw` voor lijsten, styling koppen `mt-4`).
  - ✅ Styling voor notities (geel) en opgeslagen onderzoek (paars) toegevoegd.
  - ✅ Styling en positionering van icoontjes (Bot, BookOpen, Copy, Trash2, Save) gecorrigeerd.
  - ✅ Chat placeholder tekst aangepast.
  - ✅ Tooltip toegevoegd aan verzendknop chat (inclusief positioneringsfixes).
  - 🟡 **[OPEN]** Consistentie opmaak onderzoeksresultaten (live vs. opgeslagen) verbeterd, maar nog niet perfect (bv. extra secties AI?).
- ✅ **[UI] Gebruikersvriendelijkheid Verbeteringen:**
  - ✅ Optimaliseer knoppen en interacties in takenlijst (Details/Verwijderen knoppen, subtaak status klikbaar, subtaak indicator met tooltip).
  - ✅ Verbeter layout en interactie in taakdetails (Voortgangsbalk, deadline toevoegen, subtaak inspringing, animatie progress bar).
  - ✅ Zoekfunctie toegevoegd aan dashboard.
  - ✅ Filteropties (status, prioriteit) toegevoegd aan dashboard.
  - ✅ Kalender: Huidige dag geaccentueerd.
  - ✅ Kalender: Dagen buiten maand gedimd.
  - ✅ Kalender: Nederlandse locale hersteld.
  - 🟡 Verbeter layout en interactie in chat sidebar (Checkboxes, tekst wrapping, uitlijning). (Basis aanwezig)
  - ✅ Tekst uitlijning subtaken in `TaskDetail.tsx` verbeterd.
- ✅ **[Admin] Gebruikersbeheer UI Verbetering:**
  - ✅ Haal email op via beveiligde Edge Function (`get-all-users`) en toon in tabel.
  - ✅ Toon 'inactive' status in de tabel (gebruiker wordt niet meer gefilterd).
  - ✅ Voeg een "Activeer Gebruiker" actie toe aan het dropdown menu.
  - ✅ Implementeer filter/zoek opties (naam, email, rol, status) voor de gebruikerstabel.
- 🟡 **[Admin] Permissiebeheer UI Verbetering:**
  - ✅ Toon feature `choose_research_model` in admin permissietabel.
  - ✅ **[NIEUW]** Gebruik switches voor aan/uitzetten permissies per rol.
- 🟡 **[TEST] Unit & Integratie Tests:**
  - ✅ Basis testomgeving opgezet met Vitest, React Testing Library en Jest-DOM.
  - ✅ Tests geschreven voor diverse componenten en functies (zie lijst in vorige versie).
  - 🟡 Tests geschreven voor Navbar component (issue met AuthContext mock).
  - 🟡 Meer tests schrijven voor andere componenten, hooks, en API-integraties (incl. Admin tabs, permissies).
- ❌ **[OPS] Logging & Monitoring:**
  - Zet basis logging en monitoring op (bv. met Supabase logs of een externe service).
- 🟡 **[SEC] Beveiligingscheck:**
  - ✅ Meerdere lockfiles opgelost (`deno.lock`, `bun.lockb`).
  - 🟡 `npm audit` toont nog kwetsbaarheden (geaccepteerd risico).
  - ❌ Voer een grondigere beveiligingscheck uit (RLS, input validatie).
- ❌ **[UI] Duidelijkere Koppeling Subtaak <-> Chat:**
  - Verbeter de visuele link tussen geselecteerde subtaken en chatberichten.
- ❌ **[UI] Zoekfunctie Chatgeschiedenis:**
  - Voeg een zoekbalk toe aan het chatpaneel.
- ❌ **[BUG] Hardnekkige Deno Lint Fouten Oplossen:**
  - Onderzoek en los de terugkerende `deno-lint(no-sloppy-imports)` en missende extensie fouten op. Controleer configuraties (Deno, ESLint, Vite, TSConfig).
- ❌ **[UI] Mobiele Weergave/Responsiviteit:**
  - ❌ **[NIEUW]** Verbeter de weergave en bruikbaarheid op mobiele apparaten. **(Prioriteit: Hoog)**
- ❌ **[Admin] API Management:**
  - ❌ **[NIEUW]** Gebruikers API verbruik monitor in admin dashboard.
  - ❌ **[NIEUW]** Gebruikers rate limit instellen (bv. op basis van tokens/calls per periode).

## Prioriteit 4: Toekomstige Ideeën (Optioneel)

- ❌ **[AI] Taak Generatie vanuit Tekst:**
  - Laat AI taken genereren uit ongestructureerde tekst (bv. notities, e-mails).
- ❌ **[AI] Tijd Estimatie Suggesties:**
  - Laat AI een schatting geven van de benodigde tijd voor een taak.
- ❌ **[INTEGRATION] Kalender Integratie & Weergave:**
  - Synchroniseer taken/deadlines met externe kalenders (Google Calendar, Outlook).
  - Voeg een kalenderweergave toe voor taken met deadlines.
- ❌ **[AI] Spraak naar Tekst / Tekst naar Spraak:**
  - Integreer spraakherkenning voor taakinvoer en tekst-naar-spraak voor taakvoorlezing.
- ✅ **[FEATURE] Gesprek Export:** (Geïmplementeerd in ChatPanel)
- ✅ **[FEATURE] Notities bij Gesprekken:** (Geïmplementeerd via task_notes)
- ✅ **[AI] Verbeterde AI Redenering & Web Search:** (Perplexity onderzoek geïntegreerd)
- ❌ **[FEATURE] Daily Knowledge Bot:**
  - ❌ **[NIEUW]** Integreer een bot die dagelijks kennis/tips deelt van Perplexity.
- ❌ **[FEATURE] Bijlagen aan Taken:**
  - Sta toe dat bestanden aan taken worden gekoppeld.
- ❌ **[FEATURE] Beloningsysteem:**
  - Implementeer een systeem om gebruikers te belonen voor voltooide taken.
- ✅ **[FEATURE] Meertaligheid:** (Instelbaar in Settings, frontend validatie voor AI modus)
- ❌ **[UI] Wit Thema:**
  - Implementeer een licht/wit thema als alternatief voor het donkere thema.
- ❌ **[FEATURE] Sub-subtaken:**
  - Sta toe dat subtaken verder worden onderverdeeld in sub-subtaken.
- ✅ **[FEATURE] Upgrade Optie:**
  - ✅ **[NIEUW]** Implementeer de mogelijkheid voor gebruikers om te upgraden naar een betaald plan (UI: Prijspagina, knop in profiel).
  - ❌ **[NIEUW]** Backend integratie (Stripe, etc.).
- ❌ **[FEATURE] Emoticons in Chat:**
  - ❌ **[NIEUW]** Voeg ondersteuning toe voor het invoegen en weergeven van emoticons in het chatvenster.
- ❌ **[PERF] Optimalisaties:**
  - Analyseer bundle size en laadtijden. Voer performance profiling uit.
- ❌ **[DOCS] Documentatie:**
  - Voeg JSDoc toe aan componenten en functies. Breid `README.md` uit.
  - ❌ **[NIEUW]** Vul de inhoud van de Support en Documentatie pagina's aan.
  - ❌ **[NIEUW]** Maak een 3-minuten YouTube handleiding/demo video voor de Perplexity Hackathon.
- ❌ **[STATE] State Management Evaluatie:**
  - Evalueer of een specifiekere state management library nodig is naarmate de applicatie groeit.

**Debug/Issues:**

- ✅ Probleem met Supabase CLI link naar verkeerd project opgelost.
- ✅ Problemen met TypeScript types (`supabase gen types`, `Message` interface) opgelost.
- ✅ Fout bij `DELETE_ALL_SUBTASKS` AI actie (ontbrekende taskId) opgelost.
- ✅ Terminal glitches bij deploy commando's.
- ✅ Meerdere lockfiles (`deno.lock`, `bun.lockb`) opgelost.
- ✅ Chatgeschiedenis wissen aangepast om notities en opgeslagen onderzoek te behouden.
- ✅ Registratie/Login UI pariteit issues opgelost.
- ✅ Wachtwoord zichtbaarheid in registratie toegevoegd.
- ✅ Permissies voor Deep Research geïmplementeerd.
- ✅ Admin pagina's gerefactored naar tabs.
- ✅ OpenAI API Key input in Settings verwijderd (was niet functioneel/veilig).
- ✅ React Hook dependency errors grotendeels opgelost (bv. in `AuthContext`, `ChatPanel`, `AdminUsersPage`).
- 🟡 Deno Lint import fouten deels opgelost/onderdrukt, maar blijven hardnekkig (zie taak P3).
- 🟡 **[NIEUW]** Linterfout/waarschuwing `priorityOrder` in `Dashboard.tsx` (nog open).
- ✅ **[NIEUW]** Supabase migratie problemen opgelost (`db push`, `db pull`, `migration repair`).

## Nieuwe Features / Grote Taken

- 🟡 **[Feature] Betaalde Plannen (Stripe Integratie):**
  - **Database (Supabase):**
    - ✅ Maak tabellen aan: `customers` (linkt Supabase user ID aan Stripe customer ID), `products`, `prices`, `subscriptions`.
    - ❌ Overweeg Stripe Foreign Data Wrapper (FDW) of Webhooks voor synchronisatie.
  - **Backend (Supabase Edge Functions):**
    - **Webhook Handler:** Luister naar Stripe events (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, etc.) en update Supabase DB (klant aanmaken, subscription status bijwerken).
      - **Configuratie Stappen:**
                1. **Supabase Types:** Zorg dat types gegenereerd zijn (`supabase gen types typescript ...`). Controleer pad in `index.ts`.
                2. **Secrets Instellen (Supabase):** Stel `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SIGNING_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in via Project Settings > Secrets. Gebruik **test** keys voor sandbox, **live** keys voor productie.
                3. **Functie Deployen:** `supabase functions deploy stripe-webhooks --project-ref <jouw-project-ref> --no-verify-jwt`.
                4. **Stripe Webhook Endpoint Configureren:**
                    - Maak endpoint aan in Stripe Dashboard (Developers > Webhooks).
                    - Gebruik de **URL** van de gedeployde Supabase functie.
                    - Selecteer relevante events (zie `relevantEvents` in `index.ts`).
                    - Kopieer de **Signing secret** en stel in als `STRIPE_WEBHOOK_SIGNING_SECRET` in Supabase (zie stap 2).
    - ✅ **Checkout Sessie Endpoint:** Functie die een Stripe Checkout sessie aanmaakt (input: user ID, price ID) en gebruiker doorstuurt.
  - **Frontend (React):**
    - ✅ **Upgrade Knop:** Roept Checkout Sessie Endpoint aan (Nu link naar /pricing).
    - ✅ **Account/Instellingen Pagina:** Toon huidige subscription status (uit `subscriptions` tabel); Link naar Stripe Customer Portal. (Basis rolweergave in `Profile.tsx`, link ontbreekt).
    - ✅ **Pricing Pagina:** Basis layout en structuur voor plannen geïmplementeerd.
    - ❌ **Conditionele Features:** Schakel UI/functionaliteit in/uit op basis van actieve subscription.
  - **Stripe Configuratie:**
    - Maak producten en prijzen aan in Stripe Dashboard.
    - Configureer Webhooks (endpoint naar Supabase Edge Function).
    - Configureer Stripe Customer Portal.
    - Beheer API keys (Publishable & Secret).
    - Beveilig webhook endpoint.
    - Gebruik environment variables voor API keys.
    - Implementeer Row Level Security (RLS) op Supabase tabellen.

*Dit is een voorlopig plan gebaseerd op onderzoek. Details kunnen wijzigen tijdens implementatie.*

- ❌ **[Feature] Developer Mode:**
  - **Functionaliteit:** Bied een optionele modus die gebruik maakt van geavanceerdere AI-modellen voor taken zoals onderzoek en tekstgeneratie.
  - **Modellen:** Gebruik [Claude 3.7](https://www.anthropic.com/news/claude-3-5-sonnet) (Sonnet/Opus afhankelijk van beschikbaarheid/kosten) OF [Gemini 2.5 Pro](https://deepmind.google/technologies/gemini/pro/). Keuze mogelijk configureerbaar maken.
  
  - **Nieuwe Overwegingen (Gebaseerd op Discussie 2024-07-24):**
    - **Huidige Setup (voor documentatie):** Creative Mode & Precise Mode draaien op GPT-4o mini.
    - **Voorstel 1 (Aanbevolen Start):** Voeg een krachtiger model toe (bv. GPT-4o volledig, Claude 3 Sonnet/Opus) als premium selectie voor bestaande modi. Dit biedt directe kwaliteitsverbetering.
    - **Voorstel 2 (Volgende Stap):** Introduceer een nieuwe modus, bv. "Analyse & Inzicht Modus", die zich richt op het interpreteren van taakdata (voortgang, trends, knelpunten). Deze modus kan dan ook profiteren van de modelkeuze (GPT-4o mini vs. krachtiger model).
    - **Combinatie:** Uiteindelijk kan de gebruiker mogelijk zowel een Modus (Efficiëntie, Creatief, Analyse) als een Model (Snel/Efficiënt, Geavanceerd/Krachtig) kiezen.

  - **Integratie:**
    - Koppel deze modus/modelkeuze aan een **betaald abonnement** (vereist voltooide Stripe-integratie).
    - Pas bestaande Edge Functions (bv. `generate-chat-response`, `deep-research`) aan om conditioneel het geselecteerde geavanceerde model aan te roepen op basis van de gebruikersrol/abonnement/instelling.
    - Voeg een instelling toe (bv. in `Settings.tsx`) waar betalende gebruikers de modus/model kunnen selecteren/instellen.
    - Overweeg API-sleutelbeheer voor de geselecteerde modellen (bv. via Supabase Vault of environment variables).
  - **UI:**
    - Geef visueel aan wanneer de Developer Mode / geavanceerd model actief is (bv. een badge in de chat of header).
    - Communiceer duidelijk de voordelen (en mogelijk hogere kosten/langere responstijden) van deze modus/model.

*Dit is een voorlopig plan gebaseerd op onderzoek. Details kunnen wijzigen tijdens implementatie.*
