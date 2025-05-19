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
  - ✅ AI volgt opmaakinstructies (genummerde lijst) nog niet perfect.

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
  - ✅ Consistentie opmaak onderzoeksresultaten (live vs. opgeslagen) verbeterd, maar nog niet perfect (bv. extra secties AI?).
- ✅ **[UI] Gebruikersvriendelijkheid Verbeteringen:**
  - ✅ Optimaliseer knoppen en interacties in takenlijst (Details/Verwijderen knoppen, subtaak status klikbaar, subtaak indicator met tooltip).
  - ✅ Verbeter layout en interactie in taakdetails (Voortgangsbalk, deadline toevoegen, subtaak inspringing, animatie progress bar).
  - ✅ Zoekfunctie toegevoegd aan dashboard.
  - ✅ Filteropties (status, prioriteit) toegevoegd aan dashboard.
  - ✅ Kalender: Huidige dag geaccentueerd.
  - ✅ Kalender: Dagen buiten maand gedimd.
  - ✅ Kalender: Nederlandse locale hersteld.
  - ✅ Verbeter layout en interactie in chat sidebar (Checkboxes, tekst wrapping, uitlijning).
  - ✅ Tekst uitlijning subtaken in `TaskDetail.tsx` verbeterd.
- ✅ **[Admin] Gebruikersbeheer UI Verbetering:**
  - ✅ Haal email op via beveiligde Edge Function (`get-all-users`) en toon in tabel.
  - ✅ Toon 'inactive' status in de tabel (gebruiker wordt niet meer gefilterd).
  - ✅ Voeg een "Activeer Gebruiker" actie toe aan het dropdown menu.
  - ✅ Implementeer filter/zoek opties (naam, email, rol, status) voor de gebruikerstabel.
- ✅ **[Admin] Permissiebeheer UI Verbetering:**
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
- ✅ **[UI] Duidelijkere Koppeling Subtaak <-> Chat:**
  - ✅ Verbeter de visuele link tussen geselecteerde subtaken en chatberichten. (Afgerond, gecontroleerd door gebruiker)
- ✅ **[BUG] Hardnekkige Deno Lint Fouten Oplossen:**
  - Onderzoek en los de terugkerende `deno-lint(no-sloppy-imports)` en missende extensie fouten op. Controleer configuraties (Deno, ESLint, Vite, TSConfig).
- ✅ **[UI] Mobiele Weergave/Responsiviteit:**
  - ✅ **[NIEUW]** Verbeter de weergave en bruikbaarheid op mobiele apparaten. **(Prioriteit: Hoog)** (Afgerond, gecontroleerd door gebruiker)
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
  - ✅ Voeg JSDoc toe aan componenten en functies. Breid README.md uit.
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
- ✅ Deno Lint import fouten deels opgelost/onderdrukt, maar blijven hardnekkig (zie taak P3). (Opgelost, bevestigd door gebruiker)
- ✅ **[NIEUW]** Linterfout/waarschuwing `priorityOrder` in `Dashboard.tsx` (nog open). (Opgelost, bevestigd door gebruiker)
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

## Technische Schuld / Known Issues (voorheen TECH_DEBT.md)

### esbuild Kwetsbaarheid (gevonden via npm audit op 2025-07-05)

- **Pakket:** `esbuild` (<=0.24.2)
- **Afhankelijkheid via:** `vite`
- **Ernst:** Moderate
- **Beschrijving:** De kwetsbaarheid stelt potentieel externe websites in staat om verzoeken naar de lokale development server te sturen en de response te lezen. Zie [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) voor details.
- **Voorgestelde Oplossing (door npm audit):** `npm audit fix --force`
- **Waarschuwing:** Het uitvoeren van `npm audit fix --force` zal `vite` updaten naar v6.3.5 (of hoger), wat een **breaking change** is. Dit vereist mogelijk aanpassingen in de codebase.
- **Status:** Uitgesteld - Handmatig aanpakken wanneer het uitkomt om potentiële breaking changes te beheren.

## Mogelijke Verbeterpunten/Aandachtspunten voor TaskDetail.tsx (voorheen TaskDetail_Verbeterpunten.md)

- **Complexiteit:** De component `TaskDetail.tsx` is erg groot en beheert veel state en logica. Overwogen kan worden om bepaalde secties verder op te splitsen in kleinere, herbruikbare componenten als dat nog niet maximaal is gedaan (hoewel `SubtaskRow` al een goed voorbeeld is van een dergelijke opsplitsing). Dit kan de leesbaarheid en onderhoudbaarheid ten goede komen.
- **Performance:** Bij zeer lange lijsten met subtaken kan de performance een aandachtspunt zijn. Hoewel dit voor de meeste use-cases waarschijnlijk geen direct probleem is, kan het bij een groot aantal subtaken overwogen worden om technieken zoals lijstvirtualisatie toe te passen om de rendering te optimaliseren.
- **Error Handling Consistentie:** Hoewel er goede error handling aanwezig is voor veel asynchrone operaties (bijvoorbeeld het herstellen van de originele subtaaktitel bij een updatefout), is het raadzaam om te controleren of dit niveau van detail consistent is toegepast op *alle* asynchrone acties binnen de component. Een uniforme aanpak voor gebruikersfeedback bij fouten (bijv. via toasts) kan de gebruikerservaring verbeteren.
- **"Magic Numbers/Strings":** Controleer op het gebruik van "magic numbers" (bijv. `globalThis.innerWidth < 1024` voor de lg breakpoint) of hardgecodeerde strings die beter als constanten gedefinieerd kunnen worden, mogelijk in een apart configuratiebestand of aan het begin van de module. Dit verhoogt de onderhoudbaarheid en maakt aanpassingen eenvoudiger. Voor breakpoints is het gebruik van Tailwind's themaconfiguratie via JavaScript vaak een best practice.
- **Testbaarheid:** Gezien de complexiteit van de component, is het cruciaal om goede unit- en integratietesten te hebben. Het verder opsplitsen van de component in kleinere, meer gefocuste componenten kan ook de testbaarheid verbeteren, omdat elke kleinere component geïsoleerd getest kan worden.
- **Toegankelijkheid (a11y):** Hoewel veel `shadcn/ui` componenten toegankelijkheid in gedachten hebben, is het goed om een handmatige controle of geautomatiseerde tests uit te voeren om te verzekeren dat alle interactieve elementen (zoals dropdowns, dialogen, custom checkboxes) volledig toetsenbord-navigeerbaar zijn en correct worden aangekondigd door schermlezers. Let specifiek op `aria-labels`, `sr-only` teksten en focus management.

## Essentiële Verbeterpunten

Na een grondige analyse van de codebase zijn de volgende verbeteringen essentieel voor de verdere ontwikkeling van het project:

1. **Codebase Optimalisatie:**
   - TaskDetail.tsx is 51KB met 1010 regels - dit bestand moet dringend worden opgesplitst in kleinere, beter beheersbare componenten.
   - Een soortgelijk patroon is te zien bij ChatPanel.tsx (25KB), AdminUsersPage.tsx (25KB) en Dashboard.tsx (19KB).

2. **Test Dekking:**
   - De testdekking is duidelijk onvolledig. Er is een taak als "deels voltooid" gemarkeerd voor tests, maar het aantal testbestanden is beperkt.
   - Een volledige suite van unit en integratietests zou stabiliteit en betrouwbaarheid garanderen.

3. **Beveiligingsverbeteringen:**
   - De Supabase credentials zijn hardgecodeerd in de client.ts - dit moet worden verplaatst naar omgevingsvariabelen.
   - Frontend validatie alleen is niet voldoende - er moet serversijdige validatie worden toegevoegd.
   - Een grondige beveiligingsaudit is nodig, vooral voor RLS (Row Level Security) in Supabase.

4. **Betalingsintegratie afmaken:**
   - De Stripe integratie is deels geïmplementeerd maar niet volledig afgerond.
   - De webhook handler en volledige betalingsstroom moeten worden afgerond.

5. **Performantie Analyse:**
   - Er zijn geen performantie-analyse of optimalisaties gedocumenteerd.
   - Bundle size analyse en code-splitting implementeren voor snellere laadtijden.

6. **Mobiele Optimalisatie:**
   - Hoewel er mobiele ondersteuning is, is waarschijnlijk meer aandacht nodig voor een volledig responsieve ervaring.

7. **Documentatie:**
   - ✅ JSDoc ontbreekt bij de meeste componenten.
   - Geen gedetailleerde architectuurdocumentatie of handleidingen voor nieuwe ontwikkelaars.

8. **Internationalisatie:**
   - i18n is geïmplementeerd, maar mogelijk niet volledig ingezet over de gehele applicatie.

9. **State Management:**
   - De grote contextbestanden suggereren mogelijk een betere oplossing voor state management zoals Redux of Zustand.

10. **API Beheer:**
    - Er zijn geen limieten of gebruikersmonitoring voor API-verbruik geïmplementeerd.
    - Dit is belangrijk voor het beheersen van kosten van externe AI-diensten.

11. **Error Handling:**
    - Consistente error handling en gebruikersfeedback bij fouten kunnen worden verbeterd.

12. **DevOps Verbetering:**
    - Geen CI/CD pipeline of geautomatiseerde tests zichtbaar.
    - Logging en monitoring moeten worden geïmplementeerd.

13. **Code Duplicatie:**
    - Mogelijke duplicatie in componenten kan worden gerefactord naar herbruikbare elementen.

14. **Deno Lint Fouten:**
    - De hardnekkige Deno lint fouten moeten structureel worden opgelost.

## Taak: Google OAuth-scherm Verbeteren met Custom Domain

**Probleem:**
Het huidige Google OAuth-toestemmingsscherm toont de standaard Supabase project URL (bijv. `wzoeijpdtpysbkmxbcld.supabase.co`), wat minder professioneel oogt.

**Doel:**
De weergave op het Google OAuth-scherm verbeteren zodat het de domeinnaam van de applicatie toont in plaats van de Supabase project URL.

**Actiepunten:**

1.  **Onderzoek Custom Domain voor Supabase:**
    *   Controleer de Supabase documentatie en projectinstellingen voor de mogelijkheden en vereisten voor het instellen van een custom domain (meestal beschikbaar op betaalde abonnementen).
    *   Bepaal de kosten en baten.

2.  **Domeinnaam (indien nodig):**
    *   Indien nog niet aanwezig, registreer een geschikte domeinnaam voor de applicatie (bijv. `jouwappnaam.nl` of `jouwbedrijf.com`).

3.  **Configureer Custom Domain in Supabase:**
    *   Volg de Supabase-instructies om het custom domain (bijv. `auth.jouwappnaam.nl`) te koppelen aan het Supabase-project.
    *   Dit omvat meestal het aanmaken/aanpassen van DNS-records (CNAME of A-records) bij je domeinregistrar.

4.  **Update Google Cloud Console OAuth-instellingen:**
    *   Navigeer naar de Google Cloud Console -> API's & Services -> Credentials.
    *   Selecteer de betreffende OAuth 2.0 Client ID.
    *   Pas de "Authorised JavaScript origins" aan naar het nieuwe custom domain (bijv. `https://auth.jouwappnaam.nl`).
    *   Pas de "Authorised redirect URIs" aan naar de nieuwe callback URL (bijv. `https://auth.jouwappnaam.nl/auth/v1/callback`).

5.  **Update Supabase Client in Frontend:**
    *   Indien nodig, pas de Supabase client initialisatie in de frontend code (`src/integrations/supabase/client.ts`) aan zodat deze de custom domain URL gebruikt voor de `SUPABASE_URL`.

6.  **Testen:**
    *   Test de Google OAuth-inlogflow grondig om te controleren of:
        *   Het OAuth-scherm nu het custom domain correct weergeeft.
        *   De authenticatie en redirect nog steeds correct werken.

**Optioneel (Verificatie door Google):**
*   Afhankelijk van de configuratie en het type applicatie, kan Google aanvullende verificatiestappen vereisen voor je OAuth-toestemmingsscherm, vooral als je een custom domain en logo gebruikt.

**Prioriteit:** Medium (verbetering van gebruikerservaring en professionaliteit)
