# Takenlijst: OrgaMaster AI

**Prioriteit 1: Basisfunctionaliteit**

- ✅ **[AUTH] Gebruikersauthenticatie Opzetten:**
  - ✅ Implementeer Supabase Auth voor gebruikersregistratie en login (Context, basis functies).
  - ✅ Maak login/registratie formulieren/pagina's (AuthModal).
  - ✅ Beveilig routes/data zodat alleen ingelogde gebruikers toegang hebben.
- ✅ **[CORE] Taak CRUD Operaties:**
  - ✅ Definieer database schema voor taken (titel, beschrijving, status, prioriteit, deadline, user_id, subtasks).
  - ✅ Implementeer Supabase functies/API-calls voor het aanmaken, lezen, updaten, en verwijderen van taken.
  - ✅ Bouw UI componenten voor het weergeven van takenlijsten.
  - ✅ Bouw UI componenten (bv. een formulier/modal) voor het toevoegen/bewerken van taken.
- ✅ **[UI] Basis Layout & Navigatie:**
  - ✅ Ontwerp en implementeer de hoofd layout van de applicatie (bv. sidebar, header).
  - ✅ Zet basis navigatie op tussen verschillende secties (bv. Takenlijst, Instellingen).

**Prioriteit 2: Kern AI Functies**

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
  - 🟡 AI volgt opmaakinstructies (genummerde lijst) nog niet perfect.

**Prioriteit 3: Verbeteringen & Extra's**

- ✅ **[UI] Chat UI/UX:**
  - ✅ Notities (`task_notes`) worden persistent getoond in chat (`note_saved` type) en behouden na wissen geschiedenis.
  - ✅ Verwijderknop toegevoegd voor notitieberichten (`deleteNote`).
  - ✅ Opgeslagen onderzoek (`saved_research`) wordt persistent getoond (`saved_research_display`).
  - ✅ Verwijderknop toegevoegd voor opgeslagen onderzoek (`deleteResearch`).
  - ✅ Markdown rendering verbeterd (`rehype-raw` voor lijsten, styling koppen `mt-4`).
  - ✅ Styling voor notities (geel) en opgeslagen onderzoek (paars) toegevoegd.
  - ✅ Styling en positionering van icoontjes (Bot, BookOpen, Copy, Trash2, Save) gecorrigeerd.
  - 🟡 **[OPEN]** Consistentie opmaak onderzoeksresultaten (live vs. opgeslagen) verbeterd, maar nog niet perfect (bv. extra secties AI?).
- 🟡 **[UI] Gebruikersvriendelijkheid Verbeteringen:**
  - 🟡 Optimaliseer knoppen en interacties in takenlijst (Details/Verwijderen knoppen, subtaak status klikbaar).
  - 🟡 Verbeter layout en interactie in taakdetails (Voortgangsbalk, deadline toevoegen).
  - 🟡 Verbeter layout en interactie in chat sidebar (Checkboxes, tekst wrapping, uitlijning). (Basis aanwezig)
  - ✅ Tekst uitlijning subtaken in `TaskDetail.tsx` verbeterd.
  - ✅ Notities (`task_notes`) persistent getoond in chat (`note_saved`) en behouden na wissen geschiedenis.
  - ✅ Verwijderknop toegevoegd voor notitieberichten.
  - ✅ Opgeslagen onderzoek persistent getoond (`saved_research_display`).
  - ✅ Verwijderknop toegevoegd voor opgeslagen onderzoek.
  - ✅ Markdown rendering verbeterd (`rehype-raw`, kop styling).
  - ✅ Styling chatberichten (notities, onderzoek) en iconen verbeterd.
- 🟡 **[TEST] Unit & Integratie Tests:**
  - ✅ Basis testomgeving opgezet met Vitest, React Testing Library en Jest-DOM.
  - ✅ Tests geschreven voor TaskCard component.
  - ✅ Tests geschreven voor AuthContext.
  - ✅ Tests geschreven voor Supabase API integratie.
  - ✅ Tests geschreven voor Button component.
  - ✅ Tests geschreven voor Card component.
  - 🟡 Meer tests schrijven voor andere componenten, hooks, en API-integraties.
- ❌ **[OPS] Logging & Monitoring:**
  - Zet basis logging en monitoring op (bv. met Supabase logs of een externe service).
- 🟡 **[SEC] Beveiligingscheck:**
  - ✅ Meerdere lockfiles opgelost (`deno.lock`, `bun.lockb`).
  - 🟡 `npm audit` toont nog kwetsbaarheden (geaccepteerd risico).
  - ❌ Voer een grondigere beveiligingscheck uit.
- ❌ **[UI] API Sleutel Validatie:**
  - Voeg een "Test Verbinding" knop toe in de AI Model Configuratie.
- ❌ **[UI] Duidelijkere Koppeling Subtaak <-> Chat:**
  - Verbeter de visuele link tussen geselecteerde subtaken en chatberichten.
- ❌ **[UI] Zoekfunctie Chatgeschiedenis:**
  - Voeg een zoekbalk toe aan het chatpaneel.

**Prioriteit 4: Toekomstige Ideeën (Optioneel)**

- ❌ **[AI] Taak Generatie vanuit Tekst:**
  - Laat AI taken genereren uit ongestructureerde tekst (bv. notities, e-mails).
- ❌ **[AI] Tijd Estimatie Suggesties:**
  - Laat AI een schatting geven van de benodigde tijd voor een taak.
- ❌ **[INTEGRATION] Kalender Integratie:**
  - Synchroniseer taken/deadlines met externe kalenders (Google Calendar, Outlook).
- ❌ **[AI] Spraak naar Tekst / Tekst naar Spraak:**
  - Integreer spraakherkenning voor taakinvoer en tekst-naar-spraak voor taakvoorlezing.
- ✅ **[FEATURE] Gesprek Export:** (Geïmplementeerd in ChatPanel)
  - Sta gebruikers toe om chatgesprekken te exporteren.
- ✅ **[FEATURE] Notities bij Gesprekken:** (Geïmplementeerd via task_notes)
  - Sta gebruikers toe om notities toe te voegen gekoppeld aan specifieke gesprekken of berichten.
- ✅ **[AI] Verbeterde AI Redenering & Web Search:** (Perplexity onderzoek geïntegreerd)
  - Verbeter de redeneercapaciteiten van de AI en stel deze in staat om het internet te doorzoeken voor actuele informatie.
- ❌ **[FEATURE] Kalenderweergave:**
  - Voeg een kalenderweergave toe voor taken met deadlines.
- ❌ **[FEATURE] Bijlagen aan Taken:**
  - Sta toe dat bestanden aan taken worden gekoppeld.
- ❌ **[FEATURE] Beloningsysteem:**
  - Implementeer een systeem om gebruikers te belonen voor voltooide taken.
- ✅ **[FEATURE] Meertaligheid:** (Basis `languagePreference` doorgegeven aan AI)
  - Voeg ondersteuning toe voor meerdere talen in de UI.
- ❌ **[UI] Wit Thema:**
  - Implementeer een licht/wit thema als alternatief voor het donkere thema.
- ❌ **[FEATURE] Sub-subtaken:**
  - Sta toe dat subtaken verder worden onderverdeeld in sub-subtaken.

**Debug/Issues:**
- ✅ Probleem met Supabase CLI link naar verkeerd project opgelost.
- ✅ Problemen met TypeScript types (`supabase gen types`, `Message` interface) opgelost.
- ✅ Fout bij `DELETE_ALL_SUBTASKS` AI actie (ontbrekende taskId) opgelost.
- ✅ Terminal glitches bij deploy commando's.
- ✅ Meerdere lockfiles (`deno.lock`, `bun.lockb`) opgelost.
- ✅ Chatgeschiedenis wissen aangepast om notities en opgeslagen onderzoek te behouden.
