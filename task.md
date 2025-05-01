# Takenlijst: OrgaMaster AI

**Prioriteit 1: Basisfunctionaliteit**

- 🟡 **[AUTH] Gebruikersauthenticatie Opzetten:**
  - 🟡 Implementeer Supabase Auth voor gebruikersregistratie en login (Context, basis functies).
  - ✅ Maak login/registratie formulieren/pagina's (AuthModal).
  - 🤔 Beveilig routes/data zodat alleen ingelogde gebruikers toegang hebben. (Nog controleren)
- 🟡 **[CORE] Taak CRUD Operaties:**
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
- ❌ **[AI] "Deep Research" Integratie:**
  - Onderzoek de bestaande `deep-research` Supabase functie.
  - Integreer deze functie zodat gebruikers AI kunnen vragen om onderzoek te doen gerelateerd aan een specifieke taak.
  - Toon de onderzoeksresultaten in de UI, gekoppeld aan de taak.

**Prioriteit 3: Verbeteringen & Extra's**

- ❌ **[UI] Filtering & Sortering:**
  - Implementeer UI opties om taken te filteren (op status, prioriteit) en te sorteren (op deadline, aanmaakdatum).
- ❌ **[CORE] Notificaties:**
  - Implementeer e-mail herinneringen voor naderende deadlines via Supabase Edge Function (Resend).
  - Voeg in-app notificaties toe (bv. via een notificatiecentrum).
- 🟡 **[UI] Gebruikersvriendelijkheid Verbeteringen:**
  - 🟡 Optimaliseer knoppen en interacties in takenlijst (Details/Verwijderen knoppen, subtaak status klikbaar).
  - 🟡 Verbeter layout en interactie in taakdetails (Voortgangsbalk, deadline toevoegen).
  - 🟡 Verbeter layout en interactie in chat sidebar (Checkboxes, tekst wrapping, uitlijning). (Basis aanwezig)
- ❌ **[TEST] Unit & Integratie Tests:**
  - Schrijf tests voor kritieke componenten, hooks, en API-integraties.
- ❌ **[OPS] Logging & Monitoring:**
  - Zet basis logging en monitoring op (bv. met Supabase logs of een externe service).
- ❌ **[SEC] Beveiligingscheck:**
  - Voer een grondige beveiligingscheck uit (bv. controle op veelvoorkomende kwetsbaarheden, dependency scanning).
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
- ❌ **[FEATURE] Gesprek Export:**
  - Sta gebruikers toe om chatgesprekken te exporteren.
- ❌ **[FEATURE] Notities bij Gesprekken:**
  - Sta gebruikers toe om notities toe te voegen gekoppeld aan specifieke gesprekken of berichten.
- ❌ **[AI] Verbeterde AI Redenering & Web Search:**
  - Verbeter de redeneercapaciteiten van de AI en stel deze in staat om het internet te doorzoeken voor actuele informatie.
- ❌ **[FEATURE] Kalenderweergave:**
  - Voeg een kalenderweergave toe voor taken met deadlines.
- ❌ **[FEATURE] Bijlagen aan Taken:**
  - Sta toe dat bestanden aan taken worden gekoppeld.
- ❌ **[FEATURE] Beloningsysteem:**
  - Implementeer een systeem om gebruikers te belonen voor voltooide taken.
- ❌ **[FEATURE] Meertaligheid:**
  - Voeg ondersteuning toe voor meerdere talen in de UI.
- ❌ **[UI] Wit Thema:**
  - Implementeer een licht/wit thema als alternatief voor het donkere thema.
- ❌ **[FEATURE] Sub-subtaken:**
  - Sta toe dat subtaken verder worden onderverdeeld in sub-subtaken. 