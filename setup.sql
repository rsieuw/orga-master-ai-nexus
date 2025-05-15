SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tasks" ("id", "created_at", "user_id", "title", "description", "priority", "status", "deadline", "subtasks", "ai_subtask_generation_count", "last_viewed_at", "category", "emoji") VALUES
	('f1f5a2c0-364c-4d4a-92da-fcf4d76d1fc3', '2025-05-01 08:16:30.619886+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', '3D logo Ashveen aanpassen', 'Pas het bestaande 3D-logo van Ashveen aan volgens de specifieke vereisten.', 'medium', 'in_progress', '2025-05-01 22:00:00+00', '"[]"', 0, NULL, 'Werk/Studie', NULL),
	('f717bdd3-76fd-44c1-8e2a-04df96b7cf03', '2025-05-01 08:24:24.677351+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Website Artifex AI optimaliseren', 'Identificeer verbeterpunten en voer toevoegingen voor de website van Artifex AI.', 'high', 'in_progress', '2025-05-08 22:00:00+00', '"[{\"id\":\"f5cdb7d8-c930-4619-81aa-4f5a8344816f\",\"title\":\"Laatste nieuws / blog sectie toevoegen\",\"taskId\":\"f717bdd3-76fd-44c1-8e2a-04df96b7cf03\",\"completed\":false,\"updatedAt\":\"2025-05-14T10:24:44.696Z\"},{\"id\":\"f4b063e8-438c-4442-8b2f-cfce910fe306\",\"title\":\"Een chatbot dienst toevoegen gekoppeld aan n8n\",\"taskId\":\"f717bdd3-76fd-44c1-8e2a-04df96b7cf03\",\"completed\":false,\"updatedAt\":\"2025-05-14T10:21:58.504Z\"}]"', 0, NULL, 'Werk/Studie', NULL),
	('cb61e99d-eb14-4fa6-9339-783c8d81674b', '2025-05-01 08:12:27.450746+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Kleding leveren', 'Zorg ervoor dat de kleding op tijd wordt geleverd bij Warung Melatie en 360Party.', 'medium', 'in_progress', '2025-05-08 22:00:00+00', '"[{\"id\":\"16551027-c026-42af-a89b-cb82c5f84e03\",\"title\":\"Warung Melatie 3 shirtjes\",\"taskId\":\"cb61e99d-eb14-4fa6-9339-783c8d81674b\",\"completed\":false,\"updatedAt\":\"2025-05-12T08:50:14.332Z\"},{\"id\":\"9b7e0fea-52e6-4f56-bd76-136029f68653\",\"title\":\"360 Party shirtjes\",\"taskId\":\"cb61e99d-eb14-4fa6-9339-783c8d81674b\",\"completed\":true}]"', 0, NULL, 'Werk/Studie', NULL),
	('4efdc05e-471e-4e06-8f64-ea7b4f49fc3b', '2025-05-14 11:02:35.888495+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Digitale trouwkaart voor Shaleen maken', 'Ontwerp en maak een digitale trouwkaart voor Shaleen''s aanstaande huwelijk. Zorg ervoor dat alle details correct zijn en voeg een mooie afbeelding toe.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Familie', '💍'),
	('c3e4ad90-52d7-438c-baab-9c24b011252f', '2025-05-12 16:21:35.372122+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Keshplanner app voltooien', 'Werk aan de laatste functies en test grondig voor lancering. Zorg voor een foutloze gebruikerservaring.', 'medium', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '💻'),
	('4f5f39e0-652d-47b9-9ed0-77470df22caf', '2025-05-13 00:38:44.530219+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'BlogMagic plugin voor WordPress afronden', 'Voltooi de installatie en configuratie van de BlogMagic plugin voor WordPress. Zorg ervoor dat alle functies correct werken en test de plugin grondig.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '🛠️'),
	('0667c54e-ae24-4f20-89f6-b0c18779986f', '2025-05-01 08:29:48.757169+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Temu bestellingen plaatsen', 'Plaats bestellingen voor Temu producten bij leveranciers. Controleer voorraad en leveringstermijnen.', 'low', 'todo', NULL, '"[{\"id\":\"e47e4623-b335-4134-b2e2-ad8b1a36cd1b\",\"title\":\"Acculader bestellen\",\"taskId\":\"0667c54e-ae24-4f20-89f6-b0c18779986f\",\"completed\":false},{\"id\":\"8c54e7ae-316e-4c1f-8d83-c87a15675c81\",\"title\":\"Bankhoes hoekstuk\",\"taskId\":\"0667c54e-ae24-4f20-89f6-b0c18779986f\",\"completed\":false},{\"id\":\"0390a109-da35-4580-ac5f-31e19758a56e\",\"title\":\"Acculader\",\"description\":\"\",\"completed\":false,\"taskId\":\"0667c54e-ae24-4f20-89f6-b0c18779986f\",\"createdAt\":\"2025-05-10T09:39:27.036Z\"},{\"id\":\"6e6b0866-e928-4175-9196-9f38076ac4b3\",\"title\":\"Wc borstel\",\"description\":\"\",\"completed\":false,\"taskId\":\"0667c54e-ae24-4f20-89f6-b0c18779986f\",\"createdAt\":\"2025-05-10T09:39:40.218Z\"}]"', 0, NULL, 'Persoonlijk', NULL),
	('e5862aec-438b-459d-ac2d-ea8b69d1a155', '2025-05-01 21:51:59.511834+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Perplextity Hackaton project opleveren', 'Zorg ervoor dat het Perplexity Hackaton project ''Orgamaster AI'' wordt afgerond en opgeleverd.', 'medium', 'in_progress', '2025-05-27 22:00:00+00', '[{"id": "58074bd8-7611-4e66-8cdb-3a983b824c9b", "title": "Youtube video maken van 3 minuten", "taskId": "e5862aec-438b-459d-ac2d-ea8b69d1a155", "completed": false}, {"id": "003d0a10-06ec-484a-bd8a-fcaa314cf334", "title": "OrgaMaster AI projecten inzenden", "completed": false}, {"id": "0c193e77-0b3a-4e9e-a38d-b474832fa598", "title": "Projectinformatie aanvullen", "taskId": "e5862aec-438b-459d-ac2d-ea8b69d1a155", "completed": false}, {"id": "163afc6c-cc15-4af0-9e4c-7ab0b50f7c7b", "title": "Product website aanmaken", "taskId": "e5862aec-438b-459d-ac2d-ea8b69d1a155", "completed": false}]', 0, NULL, 'Projecten', NULL),
	('f0932771-ba6f-4c65-b732-52aeb74b538e', '2025-05-12 23:59:46.139134+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'QR code printen voor Ma''s parkeergarage', 'Print de QR code uit voor toegang tot Ma''s parkeergarage. Zorg dat de code duidelijk leesbaar is.', 'medium', 'todo', NULL, '"[]"', 0, NULL, 'Familie', '🚗'),
	('dbff2af2-3895-45b2-8069-2ce45d1c1328', '2025-05-09 23:14:06.477753+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'OrgaMaster AI-applicatie uitbreiden', 'Breid de functionaliteiten van de Orgmaster AI-applicatie verder uit.', 'low', 'todo', NULL, '"[{\"id\":\"4f4c5498-cf7a-4721-8047-e8c3d4af7c90\",\"title\":\"Een knop om het lopende onderzoek te annuleren\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T02:52:05.696Z\"},{\"id\":\"86c958a5-31dd-4e18-85a9-ba5cac36e769\",\"title\":\"Google login toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T02:53:43.772Z\"},{\"id\":\"248fabde-e9f3-453b-8eab-1f18cc095496\",\"title\":\"Wit/ licht thema toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T02:58:41.425Z\"},{\"id\":\"9c99ec21-81c0-46e9-b14f-45a462b8aab8\",\"title\":\"Teammogelijkheden: taken delen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:33:31.424Z\"},{\"id\":\"92af1c91-eea9-4ddc-80d8-5a6994421b7e\",\"title\":\"Youtube integratie bij subtaken\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:33:39.325Z\"},{\"id\":\"1c058978-bcd1-4d7d-9e71-a1c37f32d85e\",\"title\":\"Developer Mode toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:50:38.093Z\"},{\"id\":\"7a3c8019-53c4-4959-8063-4210ccb4825d\",\"title\":\"Categorieen toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:50:47.718Z\"},{\"id\":\"5d107d28-c66b-44ec-b8b2-3ce98d7632ec\",\"title\":\"Swipen naar pagina functuinaliteit\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:53:01.709Z\"},{\"id\":\"26b9d267-81d4-4150-b78d-bae1e06e74a7\",\"title\":\"Bestanden of documenten kunnen toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:53:13.215Z\"},{\"id\":\"6e1da23b-3e68-4a4a-b04c-99d42be636d5\",\"title\":\"Widgets voor op mobiel\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:54:20.066Z\"},{\"id\":\"ecc6a90e-9f30-4b40-9c37-3c4937008d38\",\"title\":\"Kalenderweergave\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:55:27.962Z\"},{\"id\":\"133a5879-0513-41a4-9a6e-36b5cde41164\",\"title\":\"Tekst naar spraak\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:56:32.316Z\"},{\"id\":\"947f60fa-51fa-4eef-a544-8ab714407156\",\"title\":\"Afbeelding naar tekst\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T03:56:40.979Z\"},{\"id\":\"b81cfa35-e14b-4371-90e8-bbe811a427aa\",\"title\":\"Meer export mogelijkheden toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-10T12:48:35.698Z\"},{\"id\":\"f7987572-1947-4c53-9428-0f79d84f0ba9\",\"title\":\"Eigen achtergrond / meerdere thema''s\",\"description\":\"\",\"completed\":false,\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"createdAt\":\"2025-05-11T00:01:26.238Z\"},{\"id\":\"87a9a57d-a298-424d-911f-f12b20e42456\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Groet verder personaliseren\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-13T01:18:23.136Z\"},{\"id\":\"ad282a41-3208-4828-b9d9-687ff3414e2c\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Eigen avatar kunnen instellen\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T08:04:52.493Z\"},{\"id\":\"e12c4ef0-4a1e-4662-a5f9-8dfc1dfecf65\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Subtaak > hoofdtaak maken?\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T09:09:29.353Z\"},{\"id\":\"b8ae7ef1-47d4-4e82-b6d3-2a22c4cb6cd1\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Uitbreiding: bulksubtasks verwijderen\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T09:12:24.330Z\"},{\"id\":\"d79515ab-0a25-402a-84af-57693a4b1899\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Uitbreiding: subtaken ook prioriteiten geven\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T09:12:58.798Z\"},{\"id\":\"bcfbc9c5-97db-4b0e-9af2-3661c2701546\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Uitbreiding: subtaken sorten boven naar beneden & andersom\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T09:13:52.055Z\"},{\"id\":\"283dd422-3dac-4a44-a87f-44fa6db0f47b\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Uitbreiding: Onderzoekresultaat streamen\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T09:15:48.465Z\"},{\"id\":\"bd3dd18f-c075-406c-8a6c-5f3a4dceae28\",\"taskId\":\"dbff2af2-3895-45b2-8069-2ce45d1c1328\",\"title\":\"Uitbreiding: icoon voor de gebruiker of profiel foto\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T09:17:14.847Z\"}]"', 0, NULL, 'Projecten', NULL),
	('f3cb7cb8-9015-4cb3-aeab-87fa8d8474ed', '2025-05-13 00:45:09.258109+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Reis naar China plannen', 'Organiseer de reis naar China van 5 juni tot 15 juni. Boek vluchten, accommodatie en maak een activiteitenplanning.', 'low', 'todo', '2025-06-04 22:00:00+00', '"[]"', 0, NULL, 'Projecten', '🗺️'),
	('99232bf6-734e-4f1d-98f2-8d65014bb18b', '2025-05-13 01:03:26.908811+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Offerte- en factuursjabloon ontwerpen', 'Ontwerp een professioneel sjabloon voor offertes en facturen voor Rishi. Zorg ervoor dat het sjabloon aan zijn specifieke behoeften voldoet.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '📝'),
	('45daa4a8-0d1b-4fdd-acee-2fb04ce6f153', '2025-05-12 15:55:58.44482+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Zomerkleding kopen', 'Ga winkelen voor zomerkleding voor mannen, inclusief shirts, shorts en zwemkleding. Zoek naar goede aanbiedingen en pasvormen.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Persoonlijk', '👕'),
	('a54e61ce-2cbd-44f1-b67e-7e5872cdb5d1', '2025-05-13 01:08:37.984915+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'ShopScraper applicatie bouwen', 'Ontwikkel een applicatie die webshops kan scrapen voor productinformatie en prijzen. Zorg voor een gebruiksvriendelijke interface en betrouwbare data-extractie.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '🛠️'),
	('6e5ed291-27e0-4aac-82db-52ea321dcf22', '2025-05-01 06:31:28.0947+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Brandingnaam kledinglijn bedenken', 'Ontwikkel een unieke branding en naam voor de nieuwe kledinglijn.', 'high', 'todo', '2025-05-05 22:00:00+00', '[{"id": "ddf4f7db-eb46-4a85-98b4-c83cf8107db3", "title": "Onderzoek de huidige mode- en kledingtrends", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "79535bf4-0811-4ddb-b9f2-dfdc7b2b7606", "title": "Bepaal de doelgroep voor de kledinglijn", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "7ac52a7b-d8e9-442b-a325-51363846ea33", "title": "Brainstorm over kernwaarden en unieke verkoopargumenten", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "49a30cea-50fd-4cf7-8e90-7c37dc924a7f", "title": "Maak een lijst van mogelijke namen", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "2734cabf-2404-4735-838c-58b217ed41a2", "title": "Controleer de beschikbaarheid van domeinnamen voor de gekozen namen", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "ba7a9be9-4317-4caa-9094-9535f0d467e7", "title": "Controleer de juridische beschikbaarheid van de gekozen naam", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "3a117401-b912-4c47-b2ce-7a9617fd5549", "title": "Ontwikkel een logo en visuele identiteit rondom de naam", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "bab81f5c-5f78-4b9d-adf8-8f73062dc874", "title": "Tao Bao & 1668 webshop onderzoeken", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "2af3cbd8-c4bc-4585-ba19-c48ec1e42601", "title": "Clothing with anime charakters Kon of Bleach, Chopper of One Piece, Happy of FairyTale", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "5f32138a-42e6-48d2-82a8-7dbdda3e9035", "title": "Verken alternatieve namen geïnspireerd door ''Fear of God''", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}, {"id": "0a5deab7-37b0-4203-beb3-49c41b8fdbd6", "title": "Verken de namen Divine Reverence, Sacred Path, Soul Essence, Eternal Grace, Serenity, Enlightenment, Devotion, Providence", "taskId": "6e5ed291-27e0-4aac-82db-52ea321dcf22", "completed": false}]', 0, NULL, 'Projecten', NULL),
	('21bed0d6-d58d-49e4-bf79-4161f73245a1', '2025-05-12 15:56:40.509471+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Tandartsafspraak inplannen', 'Bel de tandartspraktijk om een afspraak te maken voor een controle. Vraag naar beschikbare data en tijden.', 'medium', 'todo', NULL, '"[]"', 0, NULL, 'Gezondheid', '😷'),
	('219c9d02-52b7-463c-83a1-5e06ad793505', '2025-05-01 08:26:19.255242+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'OrgaMaster AI applicatie bouwen', 'Ontwikkel een mobiele app genaamd Orgamaster volgens specificaties.', 'high', 'in_progress', '2025-05-13 22:00:00+00', '"[{\"id\":\"4b0d5368-6892-47b7-a11b-b93d5310abfe\",\"title\":\"Mob: splash & icon aanpassen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"475cd88d-ac1b-447c-9865-cb146c192146\",\"title\":\"Mobiel: zoeken & filters aanpassen (admin pagina)\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"d9ce2346-7309-4275-a8bd-cf6f8f685e57\",\"title\":\"Uitbreiding: API kosten bijhouden\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"9fd73825-3aa1-4ce4-b3fb-aefdbbfa7832\",\"title\":\"Mobiel: icon menu onderaan het scherm, net als andere apps\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"1aa202d6-c48c-4f08-a357-61c8b3c9fc11\",\"title\":\"Nieuw subtaak toevoegen knop op mobiel stijlen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"00035975-ee3c-4dad-9935-3cdd2a77d760\",\"title\":\"Ruimte in de kaarten kunnen minder\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"07a04ecb-156f-4f4a-85b3-a84260609430\",\"title\":\"Zoeken en filter kunnen groter op mobiel\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"fe0ff7d9-2013-4248-bb37-54234ce28d3a\",\"title\":\"Notificaties deadlines: verlopen, vandaag en morgen deadlines notificatie bij menu met aantal\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"eae77d40-5a8b-4eea-864e-076145dc4c41\",\"title\":\"Mobiel: subtaak klikken opent chat\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"cd854849-8590-4699-9479-dd12fa2ff632\",\"title\":\"Admin: permissiestabel omdraaien\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"048d1134-9321-45f5-bf47-06f4b29f1167\",\"title\":\"Bug: scrollbar loopt door mobiele hoofdmenu\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:10:29.808Z\"},{\"id\":\"a316f1ab-5a36-4dd3-8a44-5d73a3f93983\",\"title\":\"Verzendknop in chat venster loopt door tekst heen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"9fb31071-9d8a-48ae-a067-8d3a950592fc\",\"title\":\"Automatisch naar laatste bericht scrollen bij chat\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"48322314-a26d-4a9f-b3ae-b7c7f9dfdd27\",\"title\":\"Swipe is taak doorstrepen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"6a10808d-b210-4b82-8f19-d56dc7253bfe\",\"title\":\"UI: chatinvoer venster aanpassen voor de mobiel\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:10:41.241Z\"},{\"id\":\"fb3c926d-674a-472d-bb83-89c0da6ebb8e\",\"title\":\"Deadline toevoegen bij de kaartenoverzicht\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"87d578d3-1253-45c1-a2ba-bfee5f1b934d\",\"title\":\"Te doen: rood, in behandeling oranje, voltooid groen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"7d57255e-6b46-4b21-af09-f546d9f1fad9\",\"title\":\"UX: wat gebeurt er met voltooide taken? Logica bedenken\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:11:06.633Z\"},{\"id\":\"c307fd28-afa0-4dd4-9634-7e4e73856f04\",\"title\":\"Bevestigingbericht voordat ai subtaken gegenereert wordt\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"c70e3077-0778-409d-9fe7-11adc43bc145\",\"title\":\"Subtaken knoppen verdwijnen automatisch na bepaalde tijd\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"5809b827-54d7-4bc1-b01c-7b7bd5660138\",\"title\":\"Detail: subtaken genereren overlay niet goed\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"c15961d6-1fc2-4beb-9ad7-1a7d91cce53c\",\"title\":\"Detailpagina: edit knop rechtsboven niet op goede locatie > testen lange titels en mobiel\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true,\"updatedAt\":\"2025-05-14T09:08:42.824Z\"},{\"id\":\"f3f572b4-800e-4c1d-83b7-43a7a664f119\",\"title\":\"Homepage: floating nieuw taak knop toevoegen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"9b7087b1-eefe-4063-974b-fed3f9fe12c9\",\"title\":\"Dashboard: tot. aantal taken bij categorieen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"d78f0899-2446-4c6c-89d8-55de7df86056\",\"title\":\"Home: filterknop niet rond\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"0d6b01ba-4e48-43cb-9212-de157202218a\",\"title\":\"Detail: badge achtergrond te donker\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"90fa4ff2-5c5a-453a-84a8-1e78c862da9c\",\"title\":\"Detail: progress bar full width\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"3b929211-2718-4d9f-88f6-ae970ac6527d\",\"title\":\"Admin dashboard stijlen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"2ada8dfb-e528-4a90-b50c-9865d021c696\",\"title\":\"Home: filters onthouden\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"ebb3163f-27cb-4f58-9a06-982e4465fad7\",\"title\":\"Home: kaarten animeren\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"d004a205-f96d-416b-a7b3-8bb925e5054e\",\"title\":\"Detail: subtaak verwijderen bg overlay heeft geen glas effect\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"d918f267-fce4-44c2-acc5-3f23d4d52888\",\"title\":\"Detail: 2 knoppen onderaan groter maken\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"105492c5-dfd3-44c9-a20b-5c5b36bf10e4\",\"title\":\"Diep research perplexity\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"c1ea5c86-3e8f-486a-a2f8-1cf90fe336a6\",\"title\":\"Bij nieuwe taak, scrollen werkt niet op mobiel\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"cb34657a-7ba6-4c54-b01e-f90400c96bb1\",\"title\":\"Taken en berichten kunnen pinnen (favorieten)\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"bfb3be9d-e271-49b6-bd9c-ca9c87f43473\",\"title\":\"Hoofdmenu mobiel > nieuw taak wordt profiel\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"434a4a35-fc6c-4516-bc89-e34d17da611a\",\"title\":\"Uitbreiding: centrale taal systeem\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"9bf95945-d12a-419f-be20-b350da70dcec\",\"title\":\"Uitbreiding: berichten centrum\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"a982ad27-841c-49a3-aeaa-96c4ad6a5603\",\"title\":\"worden de subtaken genereerd ook op basis van chatgesprek?\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"1bf4006c-27c7-44c4-99f8-3d632b922e4c\",\"title\":\"Desktop: klikken hoort niet te doorstrepen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"53ea7c02-7326-4250-a42b-07d2718309f1\",\"title\":\"Vertaling niet goed bij het veranderen van taal (popup)\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"e95c506a-2410-4762-9604-70875927c912\",\"title\":\"UX: Bij inloggen > notificatie overlapt groet titel\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:11:18.154Z\"},{\"id\":\"e78884e2-222a-47fe-9c95-965f58379031\",\"title\":\"Mobiel: taak bewerken modal nog steeds dubbele scroll\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"14516879-9556-438a-bfd8-d9fda50222be\",\"title\":\"Taak bewerken modal: tekst niet vertaald\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"c36de924-2a6b-4592-9982-5754a3e211e4\",\"title\":\"Mobiel: fab mogen hoger\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"67a69c0c-5f24-455b-b67d-d4171c6df5f2\",\"title\":\"BUG: Mobiel: Subtaak > klik > menu > del edit chat check\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:11:26.395Z\"},{\"id\":\"42c72218-eac7-4d13-8773-3f8740ddb94d\",\"title\":\"BUG: mobiel > bij lange takenlijst pagina begint midden op pag.\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:11:46.747Z\"},{\"id\":\"f2ff9e26-c8eb-4d23-a820-9a89dabfeacf\",\"title\":\"Mobiel: badges niet op 1 lijn\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true,\"updatedAt\":\"2025-05-14T09:09:00.798Z\"},{\"id\":\"1d71f973-3f70-4e12-96ae-38fc0b0671ed\",\"title\":\"MVP: Help functie (of ondersteuning?) toevoegen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":false,\"updatedAt\":\"2025-05-14T09:11:57.019Z\"},{\"id\":\"585c3f22-a6ab-404f-b850-8974781ae5d3\",\"title\":\"Mobiel: klikken naar check aanpassen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"511c0009-5b4d-4afd-89a3-dc1fdcddc6f4\",\"title\":\"Chat blijft hangen op sommige vragen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"ff22a918-0138-4446-9dcc-16da57945f00\",\"title\":\"Mobiel fab: duidelijke tekstnamen erbij\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"d8cf7f86-239d-4650-8e8c-5eefe52a86cd\",\"title\":\"Verbetering: Taakdetail inklapbaar\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"c59226ae-eeec-49e5-8aaf-bb9c8cefd2d6\",\"title\":\"Taakdetail: bij het klikken op de checkbox hoort deze niet uitgelicht te worden in het chat\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"69566975-d77c-4d00-b557-d338637c3dd9\",\"title\":\"Doorgestreepte taken kunnen iets donkerder\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"4fe49a55-060b-47e2-94fc-e91bf82556a1\",\"title\":\"Animatie op kaarten plaatsen\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"completed\":true},{\"id\":\"bdc9683b-033f-4c13-92ce-41cb82e3f4f7\",\"title\":\"Detailpagina: taken > doorstrepen van taken op 2 regels niet goed\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:07:42.862Z\"},{\"id\":\"6b4f7457-c740-4f6f-a97c-21ff9e8fb654\",\"title\":\"Uitbreiding: vensterinstellingen opslaan\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:08:17.788Z\"},{\"id\":\"760d67fe-b352-4f3b-84dc-eb2b4b02de3e\",\"title\":\"Admin dashboard: gebruikers overzicht niet vertaald\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:09:03.627Z\"},{\"id\":\"3f92bfed-2651-467b-b025-5297722c5e44\",\"title\":\"Bug: Home kaarten flow is niet goed\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:17:44.767Z\",\"updatedAt\":\"2025-05-13T20:33:08.917Z\"},{\"id\":\"8be82372-966f-486a-8fd9-fccfa05630a5\",\"title\":\"Onderzoeken: sources ipv bronnen text\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:31:43.605Z\"},{\"id\":\"d82bc444-0f92-4e8d-85a4-0cf829931078\",\"title\":\"Voor mobiel subtaken kunnen uitklappen volledig\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:49:47.848Z\"},{\"id\":\"79da8067-7ab5-469c-a875-5d7ac0fd8e8b\",\"title\":\"chat panel notitie knop icoon veranderen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:54:36.442Z\"},{\"id\":\"e924417a-a263-4117-b90b-12f40b0cb6dd\",\"title\":\"Testen: taak via prompt teksten vertalen? na api verbruik details\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T08:55:49.340Z\",\"updatedAt\":\"2025-05-14T11:10:52.139Z\"},{\"id\":\"082969a5-7ea7-46ea-9225-7ca854357b3f\",\"title\":\"Versie beheer van het app bijhouden?\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T22:03:52.838Z\"},{\"id\":\"b5b76f1c-c0be-4dcd-aee3-526a81dcf4d5\",\"title\":\"Contactformulier koppelen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T22:09:52.630Z\"},{\"id\":\"63cf081c-b580-4641-b027-f6349ed22dec\",\"title\":\"Nieuw taak aanmaken tekst in het engels\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-09T22:18:21.388Z\"},{\"id\":\"e73c8bb7-4ff6-4b96-a6c3-891feaaa34a3\",\"title\":\"Bug: bij het laden van pagina onderkant footer verschuift\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T02:53:02.706Z\"},{\"id\":\"d9681137-9dcd-4709-8e1a-55532d3a090e\",\"title\":\"Optioneel: iconen nieuwe taak en subtaken afscheiden\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T03:35:11.487Z\",\"updatedAt\":\"2025-05-14T09:13:21.389Z\"},{\"id\":\"6240c025-45a0-43c6-9da9-68543b7a5e69\",\"title\":\"MVP: Gebruikers rate limit\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T03:47:44.757Z\",\"updatedAt\":\"2025-05-14T09:14:16.742Z\"},{\"id\":\"4edafd55-801e-44dd-a98b-59e7af0baf1b\",\"title\":\"MVP: API verbruik in admin dahsboard\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T03:48:01.634Z\",\"updatedAt\":\"2025-05-14T09:14:22.311Z\"},{\"id\":\"8325348c-a980-464e-b082-366bba0f4002\",\"title\":\"MVP: Beveiliging doorlopen\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T03:48:51.057Z\",\"updatedAt\":\"2025-05-14T09:14:28.023Z\"},{\"id\":\"caea5a49-7fde-461a-b1c2-79d3e646c598\",\"title\":\"Iconen bij titels om taken sneller te herkennen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T04:54:30.911Z\",\"updatedAt\":\"2025-05-13T02:17:00.703Z\"},{\"id\":\"117a3962-f2a2-4033-90bc-e204c096141a\",\"title\":\"Fab knoppen moeten verdwijnen bij text area focus\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T09:40:16.836Z\"},{\"id\":\"7cbe7f17-c04d-4424-8cf0-2789fd501e4c\",\"title\":\"MVP: Splash icoon kleur aanpassen\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T09:45:46.358Z\",\"updatedAt\":\"2025-05-14T09:14:35.615Z\"},{\"id\":\"0cb8e069-1ed7-49fe-80d2-ac1aabfdf693\",\"title\":\"Fab weg bij chat\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T09:49:49.165Z\"},{\"id\":\"1ee941be-a2cd-428a-9654-a98a26ad068a\",\"title\":\"App naam hernoemen naar OrgaMaster voor mobiel\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T09:54:39.364Z\"},{\"id\":\"3356ad0b-9203-4d7b-a34b-911b03e95aee\",\"title\":\"Taak detail minder ruimte om kaart mobiel\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T10:02:05.325Z\"},{\"id\":\"31262ac0-884d-4f61-8e4c-79e0ece126a1\",\"title\":\"Mobiel: checkbox niet op juiste hoogte\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T10:04:05.221Z\"},{\"id\":\"203f8c6f-151d-4f8e-b663-94ebd5c4af12\",\"title\":\"toggle ook bij de subtaken voor de desktop\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T14:25:01.888Z\"},{\"id\":\"a35a36a8-97ce-4186-b53b-9c122f39540a\",\"title\":\"MVP: Taken favoriet kunnen maken / pinnen\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T22:31:30.319Z\",\"updatedAt\":\"2025-05-14T09:14:50.271Z\"},{\"id\":\"e0d9f80d-32de-472c-8ba1-0927c583841d\",\"title\":\"deadlne / kalender anders weergeven op de dashboard\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T22:34:05.638Z\",\"updatedAt\":\"2025-05-14T08:06:51.806Z\"},{\"id\":\"5d6c6a4a-862c-4efe-bedc-bcf317814ed7\",\"title\":\"MVP: Contact (voor bugs) toevoegen op de mobiel\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T22:54:36.899Z\",\"updatedAt\":\"2025-05-14T09:14:56.127Z\"},{\"id\":\"78f398a2-ee04-4468-989f-c0e30ed7dd66\",\"title\":\"Is het systeem prompt bij instellingen actief\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-10T23:56:45.740Z\"},{\"id\":\"12b26e51-53f5-4d22-87bc-dc22edfc899a\",\"title\":\"UI: Mobiel randen van de kaarten goedzetten op mobiel\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T00:11:15.263Z\",\"updatedAt\":\"2025-05-14T09:15:04.663Z\"},{\"id\":\"e7d99b7d-d126-4a56-b554-bfffa4ebda38\",\"title\":\"Testen: Bevestigingsvraag voor chat prompts\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T00:18:23.503Z\",\"updatedAt\":\"2025-05-14T09:16:09.337Z\"},{\"id\":\"e8024930-e196-4b3c-ad74-1ae5eaac1609\",\"title\":\"Admin tab iconen checkdn\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T00:20:35.104Z\"},{\"id\":\"c663ebc0-0d1c-4969-8ee1-e50c91020363\",\"title\":\"Admin beheer tabs net als instellingen op mobiel\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T00:21:03.715Z\"},{\"id\":\"8de60ed2-9a6c-40c4-b4d9-dcc9bf901a47\",\"title\":\"Taakdetail bewerken submenu best klein op mobiel\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T00:21:54.056Z\",\"updatedAt\":\"2025-05-14T09:15:21.341Z\"},{\"id\":\"806b7a6f-0234-4492-a849-6e20d88a1784\",\"title\":\"Procenten weghalen bij de dashboard kaart\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T05:15:42.244Z\",\"updatedAt\":\"2025-05-13T02:17:30.066Z\"},{\"id\":\"4c77cb4b-d516-4de4-b4cd-f164d38585d2\",\"title\":\"Testen: Diep onderzoek en chat testen (modellen aangepast)\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T07:20:09.554Z\",\"updatedAt\":\"2025-05-14T09:16:37.498Z\"},{\"id\":\"a739625f-dffa-4d9d-8f79-55fa1c478ccd\",\"title\":\"Vertalingen modus selecteren nog niet goed (toast)\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T07:23:54.964Z\",\"updatedAt\":\"2025-05-14T08:06:09.323Z\"},{\"id\":\"19ebd5d1-2574-4164-8e40-6a5cbbeee7b4\",\"title\":\"Inklappen subtaken > titel minder ruimte beneden (desktop)\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T07:24:22.980Z\",\"updatedAt\":\"2025-05-14T08:06:06.763Z\"},{\"id\":\"ff462c10-c85a-499f-85a1-e76367f16adf\",\"title\":\"UI: Ruimte boven en benden de taakdetail vensteren verminderen\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T07:54:43.305Z\",\"updatedAt\":\"2025-05-14T09:16:47.058Z\"},{\"id\":\"904f67c7-1558-4da0-9ac8-3fa3639acd85\",\"title\":\"Google login en dan gegevens meenemen\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T08:01:00.714Z\"},{\"id\":\"480e684e-741e-4719-9c59-867d5a4f0266\",\"title\":\"New note tekst vertalen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T08:02:59.585Z\",\"updatedAt\":\"2025-05-13T02:17:53.075Z\"},{\"id\":\"91119227-25f7-4b4e-9c3f-f5942b2c75dc\",\"title\":\"Opslaan van vensterindeling wordt niet opgeslagen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T08:19:16.821Z\",\"updatedAt\":\"2025-05-14T08:05:59.628Z\"},{\"id\":\"7ac3a3b7-6679-438a-a823-f93ad2af1904\",\"title\":\"chatvenster laten animeren dat die uitklapt naar boven bij focus\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T08:27:29.487Z\"},{\"id\":\"7b2ca7ae-a690-4d99-8daa-f2ed5cf24465\",\"title\":\"taakdetail toggle aanpassen (dubbele pijltjes aanwezig)\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T08:55:32.217Z\"},{\"id\":\"57e05dd5-3bc3-4bdc-a06d-864588684218\",\"title\":\"Onderzoek: perplexity sonar toevoegen\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T10:14:35.642Z\",\"updatedAt\":\"2025-05-14T09:17:55.996Z\"},{\"id\":\"b5438cff-4b11-463f-95cb-e57dd1b12a3b\",\"title\":\"Interface aanpassen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T20:59:54.510Z\",\"updatedAt\":\"2025-05-14T08:05:32.974Z\"},{\"id\":\"45cf71d4-1a90-4a5b-a67e-807250af2de1\",\"title\":\"MVP: Kaarten horizontaal sliden op mobiel\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T21:02:49.403Z\",\"updatedAt\":\"2025-05-15T00:48:53.541Z\"},{\"id\":\"5de049aa-efc9-4b6c-af7e-f3c9aedfebe0\",\"title\":\"BUG: Nieuw taak maken is buggy op mobiel\",\"description\":\"\",\"completed\":false,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-11T21:27:22.353Z\",\"updatedAt\":\"2025-05-14T09:18:08.101Z\"},{\"id\":\"fe7f1ce7-ebc4-4f79-9603-b97f998b51f0\",\"title\":\"Toggle knop bij  taakbeschrijving verplaatsen\",\"description\":\"\",\"completed\":true,\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"createdAt\":\"2025-05-12T02:48:18.270Z\",\"updatedAt\":\"2025-05-14T08:05:16.560Z\"},{\"id\":\"6f245596-3ac9-4a35-a831-bd2527a001c0\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"animatie effecten toevoegen op knoppen zie lucide site als je een icon copy\",\"description\":\"\",\"completed\":true,\"createdAt\":\"2025-05-12T08:55:48.793Z\",\"updatedAt\":\"2025-05-13T02:18:38.833Z\"},{\"id\":\"60c8c931-d450-412a-9d50-966c5a0d2a4d\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"MVP: checkbox voor de titel (dashboard) om taak als voltooid te markeren\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-12T09:55:35.629Z\",\"updatedAt\":\"2025-05-14T09:18:17.021Z\"},{\"id\":\"1010bc04-2b11-414b-8e59-7b8f67cc54a7\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"categorie door ai automatisch laten bepalen\",\"description\":\"\",\"completed\":true,\"createdAt\":\"2025-05-12T12:52:06.968Z\",\"updatedAt\":\"2025-05-13T02:18:42.338Z\"},{\"id\":\"c421034a-bf1a-4eb2-bbd6-112bcfee0956\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"nieuw taak toevoegen placeholder bij de 1e rij wanneer er een plek vrij is\",\"description\":\"\",\"completed\":true,\"createdAt\":\"2025-05-13T05:19:20.516Z\",\"updatedAt\":\"2025-05-14T09:18:20.589Z\"},{\"id\":\"1fbaf790-0582-4f2b-a25a-b39d3f0bcd26\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"Venster wijzigen toast berichten aanpassen\",\"description\":\"\",\"completed\":true,\"createdAt\":\"2025-05-13T20:13:33.904Z\",\"updatedAt\":\"2025-05-13T20:34:03.754Z\"},{\"id\":\"845e224c-0695-47d5-92e3-2408334e65e6\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"animatie op de takenkaarten\",\"description\":\"\",\"completed\":true,\"createdAt\":\"2025-05-14T11:01:11.268Z\",\"updatedAt\":\"2025-05-14T22:35:52.333Z\"},{\"id\":\"2e6899e7-9b3c-4454-b0a2-f7d65cb5b195\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"sorteer mogelijkheid voor kaarten\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T11:10:00.469Z\"},{\"id\":\"b38a2ce3-bc23-40aa-acdf-744bed6d4635\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"Paginas voor de mobiel doorlopen\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-14T11:27:18.460Z\"},{\"id\":\"540f280e-9354-4bac-be25-4bc6ae1b7044\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"Betalingsysteem stripe toevoegen\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-15T00:59:01.348Z\"},{\"id\":\"fbbf50bf-f9c3-4882-b778-e322c8eb3397\",\"taskId\":\"219c9d02-52b7-463c-83a1-5e06ad793505\",\"title\":\"Testen: testen opnieuw schrijven en uitvoeren\",\"description\":\"\",\"completed\":false,\"createdAt\":\"2025-05-15T00:59:21.717Z\"}]"', 0, NULL, 'Projecten', NULL),
	('a5fa3c43-16b3-401e-9e01-e606b3558720', '2025-05-13 00:26:19.11149+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Applicatie voor ondernemers ontwikkelen', 'Ontwikkel een gebruiksvriendelijke applicatie waarmee ondernemers hun administratie en boekhouding efficiënt kunnen bijhouden. Zorg voor een overzichtelijke interface en integratie van belangrijke functies.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '💻'),
	('64a6453b-9fa9-4a3e-8924-1f932c4e4c5d', '2025-05-13 01:40:21.382303+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Applicatie voor klanten ontwikkelen', 'Ontwikkel een applicatie voor Siteground-klanten met automatische facturatie en een gebruikersdashboard. Zorg voor een gebruiksvriendelijke interface en veilige betalingsopties.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '💻'),
	('88c0448d-cf62-4ea7-aacc-10b434a1a32a', '2025-05-12 15:57:46.254252+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'Start YouTube kanaal ''What If..''', 'Maak een contentplan, maak een introductievideo en stel opnamedagen in. Onderzoek concurrentie en doelgroep.', 'low', 'todo', NULL, '"[]"', 0, NULL, 'Projecten', '🎬');


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."chat_messages" ("id", "task_id", "user_id", "role", "content", "message_type", "created_at", "is_pinned") VALUES
	('99e906df-06fc-4159-aa79-ee8f7ec5a009', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, ik start een diep onderzoek naar subtaak: "Youtube video maken van 3 minuten" (voor hoofdtaak: "Perplextity Hackaton project opleveren")', 'system', '2025-05-04 05:07:58.036423+00', false),
	('a699863c-66c0-4c00-8b1d-c45fd2afb80a', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', '# Kernconcept Samenvatting

Een YouTube-video van 3 minuten maken voor je Perplexity Hackathon project vereist een gebalanceerde aanpak. Hoewel 3 minuten vaak als ideale lengte wordt gezien, wijst onderzoek uit dat dit eigenlijk aan de lange kant kan zijn voor online content. Videos moeten kort en krachtig zijn, vooral omdat kijkers snel beslissen of ze blijven kijken. Facebook-onderzoek toont aan dat als je de aandacht in de eerste 3 seconden vasthoudt, 65% minstens 10 seconden blijft kijken[1]. Het maken van een effectieve video vereist goede planning, structuur en een sterke opening.

## Mogelijke Uitdagingen of Overwegingen

- Aandachtsspanne van kijkers is beperkt; langere video''s (zoals 3 minuten) worden over het algemeen minder bekeken dan kortere[2]
- De eerste 3 seconden zijn cruciaal - zonder sterke opening haakt je publiek af[1]
- Veel informatie comprimeren in een korte video zonder de kwaliteit te verliezen
- Balans vinden tussen voldoende uitleg over je hackathon-project en het behouden van de aandacht van de kijker
- Zonder duidelijk script of structuur wordt het moeilijk een coherente boodschap over te brengen in beperkte tijd[3]
- Technische aspecten zoals geluidskwaliteit en beeldcompositie kunnen uitdagend zijn zonder juiste apparatuur

## Concrete Eerste Stappen

1. Schrijf een script waarin je je hackathon-project duidelijk uitlegt. Verdeel de informatie in ''hapbare brokjes'' of stappen en beperk je tot maximaal 5 hoofdpunten[1][3]
2. Plan een sterke opening die meteen de aandacht trekt - vermijd lange intro''s met logo''s en muziek. Begin direct met de essentie van je project[1]
3. Maak een storyboard of schets van de belangrijkste visuele elementen die je wilt laten zien (screenshots van je project, demonstraties, eventuele grafieken of diagrammen)
4. Test je script hardop en time het - een script voor 3 minuten video zou ongeveer 450-500 woorden moeten zijn, afhankelijk van je spreeksnelheid
5. Zorg voor goede opname-apparatuur - minimaal een smartphone met stabiele opstelling en goede belichting, en overweeg een externe microfoon voor betere geluidskwaliteit
6. Reserveer voldoende tijd - hoewel het mogelijk is een video in ongeveer een uur op te nemen en te monteren, is 2 uur realistischer voor een kwalitatief goede video[3]

## Relevante Bronnen (Optioneel)

Helaas kan ik geen directe links plaatsen, maar hier zijn enkele nuttige bronnen:

- "Superspoedcursus Videomarketing" van De Videovakvrouw - biedt basis videomarketingtips in drie video''s
- YouTube Creator Academy - gratis online cursussen over het maken van effectieve YouTube-video''s
- "Zo creëer je korte, krachtige video''s" artikel op Frankwatching - biedt praktische tips voor het maken van korte video''s', 'research_result', '2025-05-04 05:08:16.4829+00', false),
	('87bf1200-b810-4370-97cf-a6ecde4dd908', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, we richten ons nu op de subtaak: Youtube video maken van 3 minuten.', 'system', '2025-05-11 11:31:54.56017+00', false),
	('0eaf09d9-7d4f-4380-bbb7-7dfec8667321', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, ik start een diep onderzoek naar: "Perplextity Hackaton project opleveren"', 'system', '2025-05-04 05:07:28.508448+00', false),
	('b30a5f52-94d6-45e2-ae57-87815668d823', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Je hebt subtaak "Youtube video maken van 3 minuten" geselecteerd. Wat wil je hierover weten of bespreken?', 'system', '2025-05-04 05:09:17.99365+00', false),
	('4d7abde7-9494-4cb3-92cf-cb6bdc0b1f20', '6e5ed291-27e0-4aac-82db-52ea321dcf22', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, we richten ons nu op de subtaak: Maak een lijst van mogelijke namen.', 'system', '2025-05-12 16:34:38.252278+00', false),
	('a5f30731-a3e5-4dd4-aaf1-ee965c3aacb9', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', '# Kernconcept Samenvatting

De opdracht "Perplexity Hackathon project opleveren" draait om het afronden en inzenden van je project voor de Perplexity Hackathon. Deze hackathon nodigt deelnemers uit om internet-gebaseerde projecten te creëren die nieuwsgierigheid bevorderen, kennis vergroten of complexe taken helpen beredeneren met behulp van de Perplexity API. Verschillende prijscategorieën zijn beschikbaar, waaronder "Eerste plaats" (met $10.000 USD), "Runner-up", "Meest Leuke/Creatieve Project", "Beste Deep Research Project", "Beste Finance Project" en "Beste Health Project"[1].

## Mogelijke Uitdagingen of Overwegingen

- De deadline van de hackathon is waarschijnlijk zeer binnenkort, aangezien we nu in mei 2025 zijn en er al demo''s zichtbaar zijn van april 2025[4].
- Je project moet voldoende uniek zijn om op te vallen tussen andere inzendingen.
- Technische uitdagingen met de implementatie van de Perplexity API kunnen extra tijd kosten.
- Het project moet goed gedocumenteerd zijn, inclusief een duidelijke uitleg van hoe het werkt en wat het probleem is dat het oplost.
- Juryleden hebben verschillende achtergronden (software-engineering, klantsucces, speciale projecten), dus je project moet vanuit meerdere perspectieven overtuigend zijn[1].

## Concrete Eerste Stappen

1. Controleer de officiële inzendingsvereisten op de Devpost-pagina van de Perplexity Hackathon om zeker te weten wat je allemaal moet aanleveren[1].
2. Maak een korte demo/presentatievideo van je ''Orgamaster AI'' project die in ongeveer 2-3 minuten uitlegt wat het probleem is, hoe jouw oplossing werkt en waarom het innovatief is.
3. Schrijf een duidelijke projectbeschrijving die de volgende elementen bevat: inspiratie, wat het doet, hoe je het hebt gebouwd, uitdagingen waar je tegenaan liep, en wat je hebt geleerd.
4. Test je project grondig op bugs en zorg ervoor dat alle functionaliteiten werken zoals verwacht, vooral de integratie met de Perplexity API.
5. Controleer of je project past binnen één van de prijscategorieën (zoals Deep Research, Finance of Health) en benadruk deze aspecten in je inzending[1].
6. Upload alle vereiste bestanden, code en documentatie naar het inzendingsplatform (waarschijnlijk Devpost) vóór de deadline.

## Relevante Bronnen

Op basis van de zoekresultaten lijken er recente ontwikkelingen te zijn bij Perplexity die relevant kunnen zijn voor je hackathon-project:

- Perplexity''s Deep Research functionaliteit die tientallen zoekopdrachten uitvoert, honderden bronnen leest en door het materiaal redeneert om een uitgebreid rapport te leveren[2].
- Het voorbeeld van de "Reverse Research" tool uit de Perplexity Hackathon die gebruikers helpt ondersteunend bewijs te vinden voor een bepaalde conclusie[4].

Deze functionaliteiten zouden kunnen helpen om de mogelijkheden van je ''Orgamaster AI'' project te versterken of te inspireren voor de laatste verbeteringen voordat je het project afrondt.', 'research_result', '2025-05-04 05:07:47.335039+00', false),
	('2679121f-ca0b-4267-bfc5-f869e9613fa5', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, ik start een diep onderzoek naar: "Perplextity Hackaton project opleveren"', 'system', '2025-05-04 05:21:34.273028+00', false),
	('e65cf21b-ee06-4cb6-8b4a-f9e19fa1becf', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Je hebt subtaak "Youtube video maken van 3 minuten" geselecteerd. Wat wil je hierover weten of bespreken?', 'system', '2025-05-04 05:21:59.253279+00', false),
	('cbcb20e5-549e-4bd0-99bc-08f505e1a43f', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', '## Kernconcept Samenvatting

Het subtask "Youtube video maken van 3 minuten" draait om het produceren van een korte, pakkende video die in maximaal 3 minuten de kernboodschap overbrengt van jouw Perplextity Hackathon project. Dit vereist een strakke focus op de belangrijkste inhoud, een directe opbouw, en aantrekkelijke presentatie om de aandacht van de kijker vast te houden. Videolengte is cruciaal: hoe korter en krachtiger, hoe groter de kans dat de kijker de hele video bekijkt[1][2][4].

## Mogelijke Uitdagingen of Overwegingen

- De aandacht van de kijker direct in de eerste seconden pakken, want de meeste kijkers beslissen in het begin of ze blijven kijken[1].
- Te veel inhoud willen verwerken, waardoor de video onduidelijk of te lang wordt[1][2].
- Een te lange introductie of overbodige informatie gebruiken, wat leidt tot afhaken[1].
- Slechte voorbereiding (geen duidelijk script of storyboard), waardoor de video rommelig overkomt[1].
- Onvoldoende focus op één duidelijk doel of boodschap.
- Technische beperkingen (montage, beeld & geluid) of beperkte ervaring met videobewerking.

## Concrete Eerste Stappen

1. Bepaal het doel van de video en de belangrijkste boodschap die je wilt overbrengen (denk aan: belangrijkste resultaten, uniek concept, of impact van het project).
2. Schrijf een kort, helder script met een krachtige openingszin die meteen de aandacht trekt. Verdeel de inhoud in logische, kleine stappen of brokjes[1].
3. Maak een eenvoudig storyboard of lijst met scènes waarbij je per onderdeel kort noteert wat je laat zien of zegt.
4. Verzamel het benodigde materiaal: visuals, screenshots, korte demo’s of presentatoren. Bepaal waar je gaat filmen of of je screencaptures gebruikt.
5. Neem de video op volgens je script. Houd de vaart erin en probeer overbodige details te vermijden.
6. Monteer de video: knip foutjes eruit, voeg titels of ondertiteling toe, en zorg voor een vlotte overgang tussen de onderdelen.
7. Upload de video naar je YouTube-kanaal en kies een duidelijke, vindbare titel[5].

## Relevante Bronnen (Optioneel)

- [Zo creëer je korte, krachtige video''s van 60 seconden (Frankwatching)](https://www.frankwatching.com/archive/2016/08/25/zo-creeer-je-korte-krachtige-videos-van-60-seconden-5-tips/)
- [Google filmpje maken in 3 minuten - Renegreve.nl](https://www.renegreve.nl/google-filmpje-maken/)

Deze stappen en aandachtspunten helpen je gericht en efficiënt te starten met het maken van een krachtige YouTube-video voor je hackathon project.', 'research_result', '2025-05-04 05:22:10.474876+00', false),
	('d18926fe-5788-438d-bf35-c7769354727b', '219c9d02-52b7-463c-83a1-5e06ad793505', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, we richten ons nu op de subtaak: Uitbreiding subtaak > hoofdtaak maken.', 'system', '2025-05-14 06:45:36.691166+00', false),
	('03110fee-ed4c-40a6-83fd-c05feafe9213', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Je hebt subtaak "Youtube video maken van 3 minuten" geselecteerd. Wat wil je hierover weten of bespreken?', 'system', '2025-05-04 05:07:56.320318+00', false),
	('2ddac0df-ee56-4087-a5af-ec5fe4ff78e3', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', '# Kernconcept Samenvatting

De "Perplexity Hackathon" is een wedstrijd waarbij deelnemers internetgebaseerde projecten ontwikkelen die nieuwsgierigheid bevorderen, kennis zoeken, of complexe taken verwerken. Jouw taak is het afronden en opleveren van het project "Orgamaster AI" voor deze hackathon. De hackathon biedt verschillende prijscategorieën, waaronder een hoofdprijs van $10.000 USD en diverse categorieprijzen van $5.000 USD, plus Perplexity merchandise en erkenning[1].

## Mogelijke Uitdagingen of Overwegingen

- Deadline nakomen: Zorg dat je alle inleveringsvereisten kent en voldoende tijd hebt om het project af te ronden en in te dienen.
- Technische vereisten: Controleer of je project voldoet aan alle technische specificaties en richtlijnen van de hackathon.
- Documentatie: Goede documentatie is essentieel voor de beoordeling, inclusief duidelijke uitleg over hoe je de Perplexity API hebt geïmplementeerd.
- Presentatie: De manier waarop je het project presenteert kan net zo belangrijk zijn als het project zelf.
- Concurrentie: Bedenk hoe je project zich onderscheidt van andere inzendingen, vooral in de categorie waarin je meedoet.

## Concrete Eerste Stappen

1. Controleer de officiële inzendingsvereisten op de Perplexity Hackathon Devpost pagina, inclusief deadlines, benodigde documenten en presentatieformaat[1].
2. Maak een inventarisatie van je huidige projectstatus: wat is af, wat moet nog gedaan worden, en wat zijn de kritieke onderdelen die prioriteit hebben.
3. Zorg ervoor dat je project effectief gebruik maakt van de Perplexity API, met name de Sonar API voor diepgaand onderzoek zoals gedemonstreerd in andere projecten[4].
4. Bereid een overtuigende presentatie voor die de unieke aspecten van je "Orgamaster AI" project benadrukt, inclusief demo''s, use cases en potentiële impact.
5. Test je applicatie grondig om te zorgen dat alles werkt zoals verwacht, en documenteer eventuele bekende problemen of beperkingen.
6. Bereid een korte maar krachtige pitch voor die je project in enkele minuten uitlegt aan de juryleden[1].

## Relevante Bronnen

De Perplexity Hackathon biedt verschillende prijscategorieën waaronder je project zou kunnen vallen, zoals "Most Fun/Creative Project", "Best Deep Research Project", of specifieke categorieën voor financiën of gezondheid[1]. Perplexity''s Deep Research functionaliteit, die tientallen zoekopdrachten uitvoert en honderden bronnen analyseert, kan een goede inspiratiebron zijn voor je project[2]. 

Succesvolle hackathon projecten maken vaak gebruik van de Perplexity API voor maatschappelijk relevante toepassingen, zoals het winnende project "Triage" dat een toolkit voor natuurrampenbeheer ontwikkelde met behulp van Perplexity om kritieke realtime informatie te leveren[3].', 'research_result', '2025-05-04 05:21:51.319626+00', false),
	('23d3f42a-62d3-4428-93ff-31b0efe363bd', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, ik start een diep onderzoek naar subtaak: "Youtube video maken van 3 minuten" (voor hoofdtaak: "Perplextity Hackaton project opleveren")', 'system', '2025-05-04 05:22:01.159353+00', false),
	('8a8cb097-3d4a-46e1-a61b-4f9e9bff3bc9', '219c9d02-52b7-463c-83a1-5e06ad793505', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, we richten ons nu op de subtaak: Kaarten horizontaal sliden.', 'system', '2025-05-14 08:05:25.185402+00', false),
	('bb0cac27-21bb-4efd-a923-871a6ddcaf48', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, we richten ons nu op de subtaak: Product website aanmaken.', 'system', '2025-05-11 11:33:35.836292+00', false),
	('cfca6d96-2377-4e30-a6c3-8908f5f20cdb', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'assistant', 'Oké, we richten ons nu op de subtaak: Product website aanmaken.', 'system', '2025-05-11 11:33:42.100053+00', false);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "stripe_customer_id") VALUES
	('bfde2016-70ff-41aa-9097-17582cc5bd84', 'cus_SFhSsHkhAqumL4');


--
-- Data for Name: external_api_usage_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."feedback" ("id", "created_at", "user_id", "user_email", "subject", "message", "status", "important") VALUES
	('4ec7b4c4-7edb-4652-adf0-9cc849c0dc4b', '2025-05-10 04:13:49.725692+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'rsieuw@gmail.com', 'bug', 'test', 'nieuw', false),
	('845e966f-cffa-4a8e-8786-4e7636d6cddc', '2025-05-10 04:35:34.244214+00', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'rsieuw@gmail.com', 'vraag', 'Dit is een test', 'nieuw', false);


--
-- Data for Name: pinned_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: prices; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "name", "avatar_url", "role", "created_at", "updated_at", "language_preference", "status", "email_notifications_enabled", "ai_mode_preference", "research_model_preference", "layout_preference") VALUES
	('bfde2016-70ff-41aa-9097-17582cc5bd84', 'Rakesh Gratis', NULL, 'free', '2025-05-03 20:29:15.707541+00', '2025-05-03 20:29:15.707541+00', 'nl', 'active', true, 'gpt4o', NULL, '50-50'),
	('d93486bb-395e-4d81-b1f4-828379645fe6', 'Rakesh', NULL, 'admin', '2025-05-01 01:12:54.933603+00', '2025-05-01 01:12:54.933603+00', 'nl', 'active', true, 'default', 'research', '33-67');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."role_permissions" ("role", "enabled_features") VALUES
	('admin', '{deepResearch,exportChat,adminPanel,choose_research_model,chatModes}'),
	('paid', '{deepResearch,exportChat,choose_research_model,chatModes}'),
	('free', '{}');


--
-- Data for Name: saved_research; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."saved_research" ("id", "task_id", "user_id", "research_content", "citations", "created_at", "subtask_title", "prompt") VALUES
	('fea8160a-2b30-4141-919c-1ba580bc1425', '6e5ed291-27e0-4aac-82db-52ea321dcf22', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Kernconcept Samenvatting

Het bedenken van een brandingnaam voor een kledinglijn is een cruciale stap in het opbouwproces van een merk. Een effectieve merknaam is gemakkelijk te onthouden, uniek en moet aansluiten bij je merkidentiteit en doelgroep[1]. De juiste naam kan een significante invloed hebben op het succes van je merk en helpt bij het opbouwen van klantloyaliteit[2].

# Mogelijke Uitdagingen of Overwegingen

- **Juridische beschikbaarheid**: Voordat je definitief voor een naam kiest, is het essentieel om te onderzoeken of deze al bestaat of geregistreerd is door anderen[3][4].
- **Merkassociaties**: Je merknaam moet de juiste associaties oproepen met je producten of diensten. Een naam die niet aansluit bij je merkwaarden kan verwarrend werken[2].
- **Internationaal perspectief**: Als je internationaal wilt gaan, zorg dan dat je naam geen negatieve betekenis heeft in andere talen of culturen.
- **Onderscheidend vermogen**: In de competitieve kledingmarkt moet je naam opvallen en niet verward kunnen worden met concurrenten[2].

# Concrete Eerste Stappen

1. **Definieer je merkidentiteit**: Bepaal je merkmissie, kernwaarden en unieke propositie. Vraag jezelf af: waar wil je dat je merk voor staat? Heb je een verhaal achter je kledinglijn?[1]

2. **Onderzoek je doelgroep**: Verzamel informatie over de demografische kenmerken en voorkeuren van je doelgroep. Dit helpt je om ontwerpkeuzes te maken die aansluiten bij hun behoeften en waarden[1].

3. **Brainstorm potentiële namen**: Maak een shortlist van namen die goed klinken, uniek zijn, en relevant zijn voor je merkidentiteit. Let op dat de naam gemakkelijk te onthouden en uit te spreken is[2].

4. **Test je favoriete namen**: Leg je potentiële merknamen voor aan focusgroepen of via enquêtes om te testen hoe ze overkomen. Onderzoek of mensen de naam positief ervaren, of ze hem makkelijk kunnen onthouden en of hij de juiste associaties oproept[5].

# Relevante Bronnen (Optioneel)

- Gebruik de Naamchecker van het Benelux-Bureau voor de Intellectuele Eigendom om te controleren of je gekozen naam al bestaat[3].
- Overweeg een vooronderzoek naar de beschikbaarheid van je merk voordat je verdergaat met de registratie[4].

Door deze stappen zorgvuldig te doorlopen, vergroot je de kans op een succesvolle en onderscheidende merknaam die bijdraagt aan het succes van je nieuwe kledinglijn.', NULL, '2025-05-03 04:35:21.064129+00', NULL, NULL),
	('65c14237-0fa8-4d86-80fe-6674444d762c', '0667c54e-ae24-4f20-89f6-b0c18779986f', 'd93486bb-395e-4d81-b1f4-828379645fe6', '## Inleiding
Een **bankhoes hoekstuk** is een specifieke soort bankhoes die ontworpen is voor hoekbanken. Dit type hoes is ideaal voor wie zijn interieur wil verfraaien of beschermen tegen stof en allergieën. Het kiezen van de juiste bankhoes kan een uitdaging zijn, vooral vanwege de vele beschikbare opties in vorm, materiaal en kleur. In dit onderzoek zullen we de verschillende aspecten van een bankhoes voor hoekstukken bekijken, inclusief de beschikbaarheid, materiaal, en de voordelen ervan.

## Hoofdinhoud

### Beschikbaarheid en Variatie
Er zijn verschillende webshops die bankhoezen voor hoekbanken aanbieden. Deze hoezen zijn verkrijgbaar in diverse stoffen, kleuren en vormen, wat het gemakkelijk maakt om een model te vinden dat past bij elk interieur. BankhoesDiscounter biedt bijvoorbeeld een uitgebreide collectie met veel keuze in stoffen en kleuren, terwijl Bankhoeswinkel.nl zich specialiseert in hoezen voor specifieke bankmodellen, zoals hoekbanken met een ronde hoek [2][3].

### Materiaal en Eigenschappen
Een populaire optie is de **Milos bankhoes**, die voorgevormd en elastisch is om een perfecte pasvorm te garanderen. Deze hoezen zijn gemaakt van een combinatie van polyester, katoen en spandex, wat ze duurzaam en flexibel maakt. Ze zijn verkrijgbaar in 17 verschillende kleuren, waardoor ze universeel toepasbaar zijn in elke woonomgeving [4].

### Voordelen en Gebruik
Bankhoezen bieden niet alleen bescherming tegen stof en allergieën, maar verfrissen ook het uiterlijk van de bank. Ze zijn vaak eenvoudig aan te brengen en kunnen binnen enkele minuten worden geïnstalleerd. Dit maakt ze een praktische oplossing voor wie snel een verandering in het interieur wil doorvoeren [5].

### Vergelijking van Opties

| **Optie** | **Voordelen** | **Eigenschappen** |
|-----------|---------------|-------------------|
| **Milos Bankhoes** | Perfecte pasvorm, elastisch, duurzaam | Voorgevormd, 17 kleuren, polyester/katoen/spandex |
| **BankhoesDiscounter** | Grote voorraad stoffen en kleuren, voordelig | Verschillende stoffen en vormen, aanpasbaar aan interieur |

## Belangrijkste Vindings en Conclusie
De keuze van een bankhoes voor een hoekstuk hangt sterk af van de specifieke behoeften van de gebruiker, zoals materiaal, kleur en pasvorm. De beschikbaarheid van diverse opties zoals de Milos bankhoes en de collectie van BankhoesDiscounter biedt veel flexibiliteit. Voor wie snel een verandering wil doorvoeren, zijn deze hoezen een goede keuze vanwege hun eenvoudige installatie en beschermende eigenschappen.

## Bronnen
1. [Bankhoezen in alle vormen en maten](https://www.bankhoes-expert.nl/product-categorie/bankhoezen/)
2. [BankhoesDiscounter](https://bankhoesdiscounter.nl/collections/bankhoezen)
3. [Banken met hoek links - Bankhoezenwinkel.nl](https://bankhoezenwinkel.nl/product-categorie/bankhoezen/banken-met-hoek-links-hoezen/)
4. [Bankhoes Milos rond](https://bankhoezenwinkel.nl/product/milos-bankhoes-voor-ronde-hoek/)
5. [Gebruik je bankhoes als een schild tegen stof en allergieën](https://bankhoesdiscounter.nl)', '[{"url": "https://www.bankhoes-expert.nl/product-categorie/bankhoezen/", "title": "Bankhoezen in alle vormen en maten"}, {"url": "https://bankhoesdiscounter.nl/collections/bankhoezen", "title": "BankhoesDiscounter"}, {"url": "https://bankhoezenwinkel.nl/product-categorie/bankhoezen/banken-met-hoek-links-hoezen/", "title": "Banken met hoek links - Bankhoezenwinkel.nl"}, {"url": "https://bankhoezenwinkel.nl/product/milos-bankhoes-voor-ronde-hoek/", "title": "Bankhoes Milos rond"}, {"url": "https://bankhoesdiscounter.nl", "title": "Gebruik je bankhoes als een schild tegen stof en allergieën"}]', '2025-05-11 11:19:05.803496+00', 'Bankhoes hoekstuk', NULL),
	('75477fee-d1eb-4c2a-9047-dece9521da1a', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Een YouTube Video van 3 Minuten Maken

## Overzicht
* Een YouTube video van 3 minuten is een effectieve manier om je boodschap over te brengen zonder de aandacht van kijkers te verliezen. Je kunt kiezen tussen een reguliere video of een YouTube Short in verticaal formaat.
* Benodigdheden: Camera/smartphone, microfoon, videobewerkingssoftware (zoals OFFEO), computer/laptop, stabiele internetverbinding
* Moeilijkheidsgraad: Beginner tot Intermediate
* Veiligheidsmaatregelen: Zorg voor goede belichting en let op auteursrechtelijk beschermde muziek
* Geschatte tijd: 1-2 uur (inclusief opname, bewerking en uploaden)

## Voorwaarden
* Basiskennis van videobewerking
* Een YouTube-account
* Een duidelijk idee of script voor je video
* Opnameapparatuur (smartphone of camera)

## Stap-voor-Stap Instructies

**Stap 1: Plan je video**
* Bepaal het doel van je video (informeren, vermaken, onderwijzen)
* Schrijf een kort script met een duidelijke boodschap
* Verdeel je script in drie delen: intro (30 sec), hoofdinhoud (2 min), afsluiting (30 sec)
* Bereid eventuele visuele elementen voor (afbeeldingen, graphics)

**Stap 2: Bereid je apparatuur voor**
* Controleer of je camera/smartphone voldoende opslag heeft
* Zorg voor goede belichting (natuurlijk licht werkt vaak het beste)
* Test je audio om te zorgen dat je stem duidelijk verstaanbaar is
* Plaats je camera op een stabiel oppervlak of gebruik een statief

**Stap 3: Neem je video op**
* Begin met een sterke opening om de aandacht te trekken[5]
* Spreek duidelijk en met enthousiasme
* Houd je aan je script, maar blijf natuurlijk
* Neem indien nodig meerdere takes op
* **Tip:** Voor YouTube Shorts, neem op in verticaal formaat (9:16 beeldverhouding)[3]

**Stap 4: Bewerk je video**
* Importeer je opnames in je bewerkingssoftware
* Knip onnodige delen weg om binnen de 3 minuten te blijven
* Voeg indien gewenst muziek, tekst of effecten toe
* Zorg ervoor dat de overgangen tussen clips soepel verlopen
* **Let op:** Gebruik alleen rechtenvrije muziek om claims te voorkomen[3]

**Stap 5: Upload je video naar YouTube**
* Open YouTube Studio op je computer
* Klik op de knop ''Maken'' en selecteer ''Video uploaden''
* Sleep je videobestand naar het uploadvenster
* Vul een pakkende titel, beschrijving en relevante tags in
* Kies een aantrekkelijke thumbnail die de inhoud goed weergeeft[5]

**Stap 6: Optimaliseer je video voor weergave**
* Voor reguliere video''s: Kies de juiste categorie en voeg ondertitels toe indien nodig
* Voor YouTube Shorts (verticale video''s tot 3 minuten): 
  * YouTube zal na 15 oktober 2024 automatisch verticale video''s tot 3 minuten herkennen als Shorts[3]
  * Voeg de hashtag #shorts toe aan je titel of beschrijving
  * **Belangrijk:** Het kan enkele uren duren voordat YouTube je video als Short herkent[2]

## Visuele Referenties
* Je video moet een duidelijk begin, midden en einde hebben
* Let op de videokwaliteit - controleer of beelden scherp en goed belicht zijn
* Controleer of tekst in je video goed leesbaar is
* Bij YouTube Shorts: controleer of je video correct wordt weergegeven in verticaal formaat

## Probleemoplossing
* **Probleem:** Video wordt niet als Short herkend
  **Oplossing:** Controleer of je video verticaal is opgenomen en niet langer dan 3 minuten is. Upload via desktop als het via de app niet lukt[2]

* **Probleem:** Auteursrechtclaim op je Short
  **Oplossing:** Shorts langer dan 1 minuut met een actieve Content ID-claim worden geblokkeerd. Verwijder de geclaimde content of dien een geschil in als je denkt dat de claim onterecht is[3]

* **Probleem:** Video is te lang
  **Oplossing:** Knip je video verder in en focus op de kernboodschap

## Tips van Professionals
* Begin je video met een pakkende vraag of een opvallende uitspraak om kijkers direct te boeien[5]
* Vertel een verhaal met een conflict of uitdaging om de aandacht vast te houden[5]
* Eindig met een duidelijke call-to-action, zoals het bekijken van een gerelateerde video[5]
* Upload een aangepaste thumbnail voor je Shorts om op te vallen tussen concurrenten[5]
* Experimenteer met verschillende lengtes om te zien wat het beste werkt voor jouw publiek[5]
* Gebruik de YouTube Studio app om de prestaties van je video''s te volgen[5]

## Bronnen
1. YouTube Support: Over YouTube Shorts van 3 minuten
2. Tutorial: How To Upload 3 Minute YouTube Shorts That Actually Work
3. YouTube Handleiding: Eligibility for three-minute Shorts
4. Tutorial: How to create a video in 3 minutes
5. YouTube Guide: Can YouTube Shorts Be 3 Minutes (PROS & CONS)', '[]', '2025-05-11 11:32:28.418057+00', 'Youtube video maken van 3 minuten', NULL),
	('b2ba62eb-897a-40c4-bc8b-c429641d42e5', '0667c54e-ae24-4f20-89f6-b0c18779986f', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Acculader Bestellen: Een Uitgebreide Gids

Een betrouwbare acculader is essentieel voor het onderhoud van accu''s in voertuigen zoals auto''s, brommers, motoren en boten. In deze gids onderzoeken we de verschillende opties voor het bestellen van een acculader, wat u moet overwegen bij aankoop, en waar u terecht kunt voor de beste deals.

## Soorten Acculaders

Bij het kiezen van een acculader is het belangrijk om te weten welk type het beste past bij uw behoeften. Er zijn verschillende soorten acculaders beschikbaar op de markt:

**Standaard Acculaders**
Deze laders zijn geschikt voor verschillende types accu''s, waaronder 6V, 12V en 24V loodaccu''s (NAT, MF, Ca/Ca, AGM en GEL), evenals 12V lithium-ijzer-fosfaat (LiFePO4), 12V AGM- en EFB-accu''s[4].

**Druppelladers**
Deze laders houden de accu op peil zonder deze te overladen, ideaal voor langdurig onderhoud.

**Acculaders met Booster/Starthulp**
Sommige modellen, zoals de Toolland Acculader 12/24V, bieden niet alleen oplaadmogelijkheden maar ook een booster/starthulpfunctie die handig is bij een lege accu[2].

## Waar Acculaders te Bestellen

Er zijn verschillende betrouwbare webshops waar u een acculader kunt bestellen:

**Acculaders.nl**
Deze gespecialiseerde webshop biedt een breed assortiment acculaders voor brommers, auto''s, motoren en boten. Ze bieden gratis bezorging vanaf 75 euro en de mogelijkheid tot achteraf betalen. Bestellingen geplaatst voor 22:00 uur worden dezelfde dag nog verzonden[1]. Klanten waarderen deze webshop met een 9,6 uit 10 gebaseerd op bijna 6000 reviews[4].

**Bol.com**
Bij Bol.com vindt u een uitgebreide selectie acculaders met het gemak van gratis retourneren en 30 dagen bedenktijd. Bestellingen geplaatst voor 23:59 uur worden de volgende dag geleverd[2].

**Halfords**
Halfords biedt verschillende merken accu- en druppelladers aan, waaronder Absaar, Black & Decker, Bosch, Carpoint, Motor X en Ring[3].

**Heuts.nl**
Deze webshop heeft 31 verschillende acculaders in het assortiment, met prijzen variërend van ongeveer 30 euro tot 360 euro. Ze bieden gratis verzending vanaf 50 euro[5].

## Prijsvergelijking

De prijzen van acculaders variëren aanzienlijk, afhankelijk van het type, de functionaliteit en het merk:

| Webshop | Prijsrange | Verzendkosten | Levertijd |
|---------|------------|---------------|-----------|
| Acculaders.nl | Vanaf €39,95 | Gratis vanaf €75 | Zelfde dag verzonden (bij bestelling voor 22:00) |
| Bol.com | Vanaf €73,95 (Toolland model) | Gratis retourneren | Volgende dag in huis (bij bestelling voor 23:59) |
| Heuts.nl | €29,50 - €361,75 | Gratis vanaf €50 | 1-2 werkdagen of zelfde dag verzonden |

## Aandachtspunten bij Aankoop

Bij het kiezen van een acculader zijn er verschillende factoren om rekening mee te houden:

**Compatibiliteit**
Zorg ervoor dat de acculader geschikt is voor het type accu dat u wilt opladen. Let op het voltage (6V, 12V, 24V) en het type accu (loodaccu, lithium-ion, etc.)[4].

**Extra Functies**
Sommige acculaders bieden extra functionaliteit zoals:
- Thermische overbelastingsbeveiliging
- Ampèremeter
- Interne zekering tegen kortsluiting
- Booster/starthulp[2]

**Veiligheid**
Kies voor acculaders met veiligheidsvoorzieningen zoals overbelastingsbeveiliging en beveiliging tegen kortsluiting[2].

## Conclusie

Het bestellen van een acculader is een eenvoudig proces met veel online opties. Acculaders.nl lijkt een populaire keuze te zijn met hoge klantwaarderingen, maar afhankelijk van uw specifieke behoeften en budget kunnen Bol.com, Halfords of Heuts.nl ook goede alternatieven zijn. Let bij uw aankoop op het type accu waarvoor de lader geschikt is, eventuele extra functies en veiligheidsvoorzieningen, en natuurlijk de prijs-kwaliteitverhouding.

Voor de meeste consumenten is een standaard acculader voldoende, maar als u regelmatig te maken heeft met lege accu''s, kan een model met boosterfunctie een waardevolle investering zijn. Bestellen is bij de meeste webshops eenvoudig, met snelle levering en vaak gratis verzending boven een bepaald bedrag.', '[]', '2025-05-11 11:12:27.987536+00', NULL, 'Backup research_result bericht'),
	('a83ea73d-9df7-43f4-a3ca-5106cf694f0a', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Een product website maken: Creatieve benaderingen voor succes

Een product website creëren is een geweldige manier om je product online te presenteren. Laten we dit uitdagende maar opwindende project vanuit verschillende invalshoeken bekijken.

## Perspectief verschuiving

* Een product website is niet alleen een verkoopkanaal, maar een digitale ervaring die een verhaal vertelt
* Denk verder dan alleen de kenmerken van je product - focus op de transformatie die het in het leven van gebruikers teweegbrengt
* Zie je website niet als een eindproduct, maar als een evoluerend platform dat meegroeit met je klantbehoefte

## Ideeën constellatie

**Canva''s one-pager wonderland**
Een snelle, visueel aantrekkelijke one-page website met Canva bouwen die alles vertelt wat bezoekers moeten weten in één oogopslag. Gebruik hun drag-and-drop tools en prachtige sjablonen om in minuten een professionele site te lanceren[1].

**De AI-gegenereerde productshowcase**
Laat AI een website voor je creëren door simpelweg enkele vragen te beantwoorden. Voeg vervolgens je eigen content toe om het persoonlijk te maken en klaar is je unieke site[4].

**Het minimalistische productpodium**
Een ultrazuivere website die zich alleen richt op je ene product, zonder afleiding. Gebruik platforms zoals Wix, Shopify of Squarespace specifiek voor één-product websites[5].

**De verhaalvertellende webervaring**
Bouw je site rond het verhaal van je product - hoe het ontstond, welk probleem het oplost, en hoe het levens verandert. Maak emotionele connecties in plaats van alleen features te benadrukken.

**De gemeenschapsgerichte productsite**
Creëer niet alleen een website, maar een gemeenschap rond je product met forums, gebruikersreviews en succesverhalen die bezoekers inspireren en betrekken.

**Het digitale productlaboratorium**
Een website waar bezoekers kunnen experimenteren met de features van je product via simulaties, demo''s of interactieve testomgevingen voordat ze kopen.

**De gratis-waarde-voorop aanpak**
Bied substantiële gratis waarde aan bezoekers (tools, gidsen, templates) gerelateerd aan je product, waardoor vertrouwen ontstaat voordat de verkoop plaatsvindt.

**De mobiel-eerst productsite**
Ontwerp specifiek voor de mobiele gebruiker, met vliegensvlugge laadtijden, intuïtieve navigatie en een koopproces dat je met één duim kunt doorlopen.

**Het seizoensgebonden vernieuwingsmodel**
Een websitestructuur die regelmatig verandert om seizoensgebonden thema''s of tijdelijke aanbiedingen te benadrukken, wat terugkerende bezoeken stimuleert.

## Concept uitwerking

**Canva''s one-pager wonderland**
Deze aanpak is perfect voor ondernemers of makers die snel online willen zonder technische kennis. Canva biedt gratis aanpasbare templates die volledig responsief zijn en er professioneel uitzien op elk apparaat. De echte kracht zit in de mogelijkheid om realtime samen te werken met partners, eenvoudig content te slepen en neer te zetten, en zelfs AI-gegenereerde afbeeldingen te gebruiken om je product tot leven te brengen[1]. 

Variaties hierop zouden kunnen zijn:
- Een geanimeerde productpagina met Canva''s animatietools
- Een seizoensgebonden pagina die elk kwartaal een nieuwe look krijgt
- Een portfolio-stijl site die verschillende gebruikstoepassingen van je product laat zien

**De AI-gegenereerde productshowcase**
Met AI-tools zoals die van GoDaddy kun je een website creëren door simpelweg vragen te beantwoorden over je product en bedrijf. Het systeem genereert automatisch een basis die je vervolgens kunt aanpassen. Dit bespaart enorm veel tijd en geeft je een professioneel startpunt[4]. 

De sleutel tot succes is de AI-gegenereerde basis te verrijken met:
- Authentieke verhalen over waarom je dit product maakt
- Echte gebruikersgetuigenissen (geen AI-gegenereerde!)
- Unieke beelden die je product onderscheiden van concurrenten

**Het minimalistische productpodium**
Een één-product website brengt extreme focus - perfect voor een flagship product. Platforms zoals Wix, Shopify en Squarespace hebben specifieke templates hiervoor. Begin met een thema dat je merk perfect representeert, zorg voor eenvoudige navigatie, en maak het aantrekkelijk voor je doelpubliek[5].

Dit model slaagt wanneer je:
- Een glashelder verkoopproces ontwerpt zonder onnodige stappen
- Prachtige productfotografie centraal stelt
- Elk aspect van de site afstemt op één vraag: "Helpt dit mijn bezoeker beslissen om te kopen?"

## Creatieve verbindingen

De kracht zit in onverwachte combinaties. Stel je een website voor die:

- AI-gegenereerde productbeschrijvingen combineert met een minimalistische Canva-template
- Een gemeenschapsplatform integreert binnen een één-product showcase
- Seizoensgebonden vernieuwingen automatiseert via AI-planning

Denk aan je productwebsite als een digitale winkelervaring. Net zoals de beste winkels multisensorische ervaringen bieden, kan je website visuele elementen combineren met interactieve componenten en pakkende verhalen.

## Inspiratie springplank

Prikkelende vragen om verder te denken:
- Hoe zou je website eruitzien als je maar één scherm had om je verhaal te vertellen?
- Welke emotionele reactie wil je oproepen bij bezoekers in de eerste 5 seconden?
- Als je product een persoonlijkheid had, hoe zou je website die dan weerspiegelen?

**Creatieve oefening:** Schets drie volledig verschillende homepage-concepten voor je product - één ultrasimpel, één uitbundig en visueel rijk, en één verhalend. Welke voelt het meest authentiek? Welke elementen uit elk zou je willen behouden?

Onconventionele inspiratiebronnen:
- Bestudeer museumtentoonstellingen voor ideeën over productpresentatie
- Bekijk kinderboeken voor lessen over het vertellen van simpele maar krachtige verhalen
- Analyseer je favoriete restaurantmenu''s voor inzichten over het presenteren van opties

Dutch: Hoe dan ook maakt website.com het mogelijk om razendsnel een professionele site te creëren, zelfs op je smartphone. Je kunt kiezen uit professionele layouts en gratis stockfoto''s om je product optimaal te presenteren[3].

Niet langer ben je afhankelijk van dure webontwikkelaars - met de juiste tools creëer je zelf een website die jouw productvisie perfect tot leven brengt!', '[]', '2025-05-11 11:34:22.715848+00', 'Product website aanmaken', NULL),
	('2c293615-4652-4db8-a9d1-f268f927623d', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Perplexity Hackathon Project Opleveren

## Kernconcept Samenvatting

De Perplexity Hackathon is een wedstrijd waarbij deelnemers internetgebaseerde projecten ontwikkelen die nieuwsgierigheid stimuleren, kennis bevorderen of complexe taken oplossen. Het project "Orgamaster AI" moet worden afgerond en ingediend voor deze hackathon. De hackathon biedt diverse prijzencategorieën waaronder een hoofdprijs van $10.000 USD, naast verschillende Runner Up en categoriale prijzen van elk $5.000 USD[1]. Deelnemers kunnen hun projecten indienen via Devpost.

## Mogelijke Uitdagingen of Overwegingen

- De deadline voor indiening is mogelijk zeer binnenkort, gezien de huidige datum (3 mei 2025) en het feit dat vergelijkbare hackathons vaak strikte tijdslimieten hebben.
- Het project moet aansluiten bij de hackathon-criteria: het moet internetgebaseerd zijn en gericht op kennisbevordering of probleemoplossing.
- De jury bestaat uit softwareontwikkelaars en andere professionals van Perplexity, dus het project moet technisch sterk zijn en een goede indruk maken[1].
- De concurrentie kan hoog zijn, gezien de aantrekkelijke prijzen en de zichtbaarheid die de hackathon biedt.

## Concrete Eerste Stappen

1. Controleer de officiële deadline op de Devpost-pagina van de Perplexity Hackathon en maak een gedetailleerde planning voor de resterende tijd.
2. Zorg dat het project volledig functioneert en test het grondig op bugs of gebruiksproblemen. Een falend project zal geen indruk maken op de jury.
3. Bereid een duidelijke projectbeschrijving voor volgens de richtlijnen van Devpost, inclusief het probleem dat je oplost, de gebruikte technologie en de impact van je oplossing.
4. Maak een overtuigende demonstratievideo die de belangrijkste functies van Orgamaster AI laat zien. Uit het voorbeeld van de Reverse Research tool blijkt dat een duidelijke demonstratie van de functionaliteit belangrijk is[4].
5. Overweeg gebruik te maken van de Perplexity API, specifiek de Sonar API voor Deep Research functionaliteit, aangezien deze krachtige mogelijkheden biedt zoals het doorzoeken van bronnen en het redeneren over complexe vraagstukken[2][4].
6. Bepaal in welke prijscategorie je project het beste past (algemeen, Deep Research, Finance, Health, of Most Fun/Creative) en optimaliseer je inzending daarvoor[1].

## Relevante Bronnen

De officiële Devpost-pagina van de Perplexity Hackathon bevat alle informatie over inzendingscriteria, deadlines en prijzen. Daarnaast kan de Perplexity blog nuttig zijn voor meer informatie over hun technologieën zoals Deep Research voor het verbeteren van je project.

Vergeet niet dat een succesvol hackathon-project niet alleen technisch sterk moet zijn, maar ook een duidelijke demonstratie moet hebben van hoe het waarde toevoegt en aansluit bij de doelstellingen van de hackathon: nieuwsgierigheid stimuleren, kennis bevorderen of complexe taken oplossen.', '["https://perplexityhackathon.devpost.com", "https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research", "https://www.perplexity.ai/hub/blog/perplexity-s-2024-campus-strategist-program", "https://www.youtube.com/watch?v=q_d3M2y_R3g", "https://www.threads.net/@perplexity.ai/post/DDu-gFEzDH5"]', '2025-05-03 06:40:32.851612+00', NULL, NULL),
	('004aff7c-61e9-41a5-85dc-00ea0afcdbf1', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '## Kernconcept Samenvatting

Het opleveren van het Perplexity Hackathon-project "Orgamaster AI" betekent dat je team het project afrondt en gereedmaakt voor officiële inzending bij de Perplexity Hackathon. Dit houdt in dat het project aan alle technische- en presentatie-eisen voldoet, grondig is getest, goed gedocumenteerd is, en volgens de instructies van de hackathon wordt ingediend. Het doel is om een werkend, innovatief AI-project te demonstreren dat past binnen de hackathon-thema''s zoals onderzoek, nieuwsgierigheid en kennisdeling[1].

## Mogelijke Uitdagingen of Overwegingen

- Onvolledige of gebrekkige documentatie waardoor de jury het project niet goed kan beoordelen
- Niet volledig voldoen aan de technische eisen of inzendvereisten van de hackathon
- Gebrek aan gebruikersfeedback of onvoldoende testen van de AI-functies
- Slechte presentatie van het project (demo, pitch, of visuele presentatie)
- Onvoldoende bronvermelding of onderbouwing van gebruikte data en algoritmen
- Deadlines missen vanwege onderschatting van de resterende werkzaamheden

## Concrete Eerste Stappen

1. Zorg dat alle kernfunctionaliteiten van Orgamaster AI volledig werken en test grondig op bugs, edge cases en gebruiksvriendelijkheid.
2. Stel duidelijke documentatie op: beschrijf installatiestappen, gebruikershandleiding, technische uitleg, en vermeld gebruikte bronnen en modellen.
3. Maak een korte demo-video (1-3 minuten) waarin de werking, het doel en de unieke eigenschappen van Orgamaster AI worden getoond.
4. Controleer de hackathon-richtlijnen op Devpost voor verplichte onderdelen (bijv. formulier, video, beschrijving, teamleden) en vul alles correct in voordat je indient[1].
5. Verzamel, indien mogelijk, feedback van proefgebruikers of externe reviewers en verwerk snelle verbeteringen.
6. Zorg dat alle code, assets en bijlagen netjes en gestructureerd in een repository staan, bij voorkeur op een publieke plek zoals GitHub.

## Relevante Bronnen (Optioneel)

- [Perplexity Hackathon op Devpost – Officiële details, eisen en inzending](https://perplexityhackathon.devpost.com)
- [Perplexity Deep Research – Uitleg over innovatieve onderzoeksfeatures](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research)

Met deze stappen werk je gestructureerd toe naar een succesvolle oplevering van je hackathon-project!', '["https://perplexityhackathon.devpost.com", "https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research", "https://www.perplexity.ai/hub/blog/perplexity-s-2024-campus-strategist-program", "https://www.youtube.com/watch?v=q_d3M2y_R3g", "https://www.threads.net/@perplexity.ai/post/DDu-gFEzDH5"]', '2025-05-03 06:46:49.145009+00', NULL, NULL),
	('0834421f-eaf9-4b1d-a40b-e8161a5e53f8', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Kernconcept Samenvatting

Een YouTube-video van 3 minuten maken voor je Perplexity Hackathon project is een effectieve manier om je werk te presenteren. In deze korte maar krachtige video kun je de essentie van je project uitleggen, de belangrijkste functies demonstreren en de waarde ervan laten zien. Met 3 minuten heb je genoeg tijd om een boeiend verhaal te vertellen zonder dat kijkers afhaken, wat perfect is voor een hackathon-presentatie.

# Mogelijke Uitdagingen of Overwegingen

- Het kan moeilijk zijn om alle informatie over je hackathon project in slechts 3 minuten te verwerken - je moet scherpe keuzes maken over wat wel en niet te laten zien.
- De technische kwaliteit van je video (beeld, geluid, belichting) kan invloed hebben op hoe professioneel je project overkomt.
- Zonder goede structuur en planning kan je video rommelig overkomen, waardoor de kernboodschap verloren gaat.
- Je moet beslissen of je een traditionele YouTube-video of een YouTube Short maakt, aangezien Shorts sinds oktober 2024 ook tot 3 minuten lang kunnen zijn[3][5].
- Als je muziek wilt gebruiken, moet je rekening houden met Content ID-claims, vooral als je video langer dan 1 minuut is[3].

# Concrete Eerste Stappen

1. Maak een beknopt script waarin je in 3 minuten de essentie van je Perplexity Hackathon project uitlegt. Verdeel dit in drie delen: een sterke intro/haak (±30 sec), uitleg van het project (±2 min) en een duidelijke conclusie met call-to-action (±30 sec).

2. Plan je opname door te beslissen welke visuele elementen je wilt laten zien: jezelf in beeld, screencasts van je project, slides of een combinatie hiervan. Creëer een eenvoudig storyboard om de flow van je video te visualiseren.

3. Zorg voor een nette achtergrond en goede belichting voor je opname. Voeg diepte toe aan je shots door objecten op de voorgrond en achtergrond te plaatsen en overweeg kleurrijke RGB-verlichting te gebruiken om je video dynamischer te maken[1].

4. Kies de juiste opnamehoek en voeg indien mogelijk camerabewegingen toe voor een dynamischer resultaat. Experimenteer met het filmen vanuit een lagere hoek voor een interessanter perspectief[1].

# Relevante Bronnen (Optioneel)

Het is belangrijk om je video boeiend te maken met visuele technieken zoals interessante camerahoeken, een goed ingerichte achtergrond, voorgrondselementen en dynamische belichting. Deze elementen kunnen je video transformeren van saai naar professioneel en meeslepend, wat cruciaal is om je hackathon project goed te presenteren.

Voor het maken van je video kun je beginnen met een sterke haak in de eerste paar seconden door een vraag te stellen of een prikkelende stelling te maken. Dit trekt de aandacht van de kijker meteen. Vervolgens kun je het "probleem" introduceren dat je project oplost, gevolgd door je oplossing en hoe het werkt. Sluit af met een duidelijke call-to-action voor de volgende stappen.', '["https://www.youtube.com/watch?v=HsepWqt3cAE", "https://www.youtube.com/watch?v=JhUnqA3PP3c", "https://support.google.com/youtube/answer/15424877", "https://www.youtube.com/watch?v=ZLPKmSs05wo", "https://www.youtube.com/watch?v=Cfs9syXzVWk"]', '2025-05-03 06:50:22.329966+00', NULL, NULL),
	('78cd5a45-f97c-4f75-becc-7cf166cded2f', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Kernconcept Samenvatting

Een YouTube-video van 3 minuten maken voor je Perplexity Hackathon project vereist een gebalanceerde aanpak. Hoewel 3 minuten vaak als ideale lengte wordt gezien, wijst onderzoek uit dat dit eigenlijk aan de lange kant kan zijn voor online content. Videos moeten kort en krachtig zijn, vooral omdat kijkers snel beslissen of ze blijven kijken. Facebook-onderzoek toont aan dat als je de aandacht in de eerste 3 seconden vasthoudt, 65% minstens 10 seconden blijft kijken[1]. Het maken van een effectieve video vereist goede planning, structuur en een sterke opening.

## Mogelijke Uitdagingen of Overwegingen

- Aandachtsspanne van kijkers is beperkt; langere video''s (zoals 3 minuten) worden over het algemeen minder bekeken dan kortere[2]
- De eerste 3 seconden zijn cruciaal - zonder sterke opening haakt je publiek af[1]
- Veel informatie comprimeren in een korte video zonder de kwaliteit te verliezen
- Balans vinden tussen voldoende uitleg over je hackathon-project en het behouden van de aandacht van de kijker
- Zonder duidelijk script of structuur wordt het moeilijk een coherente boodschap over te brengen in beperkte tijd[3]
- Technische aspecten zoals geluidskwaliteit en beeldcompositie kunnen uitdagend zijn zonder juiste apparatuur

## Concrete Eerste Stappen

1. Schrijf een script waarin je je hackathon-project duidelijk uitlegt. Verdeel de informatie in ''hapbare brokjes'' of stappen en beperk je tot maximaal 5 hoofdpunten[1][3]
2. Plan een sterke opening die meteen de aandacht trekt - vermijd lange intro''s met logo''s en muziek. Begin direct met de essentie van je project[1]
3. Maak een storyboard of schets van de belangrijkste visuele elementen die je wilt laten zien (screenshots van je project, demonstraties, eventuele grafieken of diagrammen)
4. Test je script hardop en time het - een script voor 3 minuten video zou ongeveer 450-500 woorden moeten zijn, afhankelijk van je spreeksnelheid
5. Zorg voor goede opname-apparatuur - minimaal een smartphone met stabiele opstelling en goede belichting, en overweeg een externe microfoon voor betere geluidskwaliteit
6. Reserveer voldoende tijd - hoewel het mogelijk is een video in ongeveer een uur op te nemen en te monteren, is 2 uur realistischer voor een kwalitatief goede video[3]

## Relevante Bronnen (Optioneel)

Helaas kan ik geen directe links plaatsen, maar hier zijn enkele nuttige bronnen:

- "Superspoedcursus Videomarketing" van De Videovakvrouw - biedt basis videomarketingtips in drie video''s
- YouTube Creator Academy - gratis online cursussen over het maken van effectieve YouTube-video''s
- "Zo creëer je korte, krachtige video''s" artikel op Frankwatching - biedt praktische tips voor het maken van korte video''s', NULL, '2025-05-04 05:11:53.384058+00', NULL, NULL),
	('05eb7692-8aa7-4340-b220-aed6ad292cc1', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '## Kernconcept Samenvatting

Het subtask "Youtube video maken van 3 minuten" draait om het produceren van een korte, pakkende video die in maximaal 3 minuten de kernboodschap overbrengt van jouw Perplextity Hackathon project. Dit vereist een strakke focus op de belangrijkste inhoud, een directe opbouw, en aantrekkelijke presentatie om de aandacht van de kijker vast te houden. Videolengte is cruciaal: hoe korter en krachtiger, hoe groter de kans dat de kijker de hele video bekijkt[1][2][4].

## Mogelijke Uitdagingen of Overwegingen

- De aandacht van de kijker direct in de eerste seconden pakken, want de meeste kijkers beslissen in het begin of ze blijven kijken[1].
- Te veel inhoud willen verwerken, waardoor de video onduidelijk of te lang wordt[1][2].
- Een te lange introductie of overbodige informatie gebruiken, wat leidt tot afhaken[1].
- Slechte voorbereiding (geen duidelijk script of storyboard), waardoor de video rommelig overkomt[1].
- Onvoldoende focus op één duidelijk doel of boodschap.
- Technische beperkingen (montage, beeld & geluid) of beperkte ervaring met videobewerking.

## Concrete Eerste Stappen

1. Bepaal het doel van de video en de belangrijkste boodschap die je wilt overbrengen (denk aan: belangrijkste resultaten, uniek concept, of impact van het project).
2. Schrijf een kort, helder script met een krachtige openingszin die meteen de aandacht trekt. Verdeel de inhoud in logische, kleine stappen of brokjes[1].
3. Maak een eenvoudig storyboard of lijst met scènes waarbij je per onderdeel kort noteert wat je laat zien of zegt.
4. Verzamel het benodigde materiaal: visuals, screenshots, korte demo’s of presentatoren. Bepaal waar je gaat filmen of of je screencaptures gebruikt.
5. Neem de video op volgens je script. Houd de vaart erin en probeer overbodige details te vermijden.
6. Monteer de video: knip foutjes eruit, voeg titels of ondertiteling toe, en zorg voor een vlotte overgang tussen de onderdelen.
7. Upload de video naar je YouTube-kanaal en kies een duidelijke, vindbare titel[5].

## Relevante Bronnen (Optioneel)

- [Zo creëer je korte, krachtige video''s van 60 seconden (Frankwatching)](https://www.frankwatching.com/archive/2016/08/25/zo-creeer-je-korte-krachtige-videos-van-60-seconden-5-tips/)
- [Google filmpje maken in 3 minuten - Renegreve.nl](https://www.renegreve.nl/google-filmpje-maken/)

Deze stappen en aandachtspunten helpen je gericht en efficiënt te starten met het maken van een krachtige YouTube-video voor je hackathon project.', NULL, '2025-05-04 05:40:43.507641+00', NULL, NULL),
	('220c879c-a6f7-4666-a4c8-31ec5639c6f4', '6e5ed291-27e0-4aac-82db-52ea321dcf22', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# Kernconcept Samenvatting

"Fear of God" is een populair streetwear merk opgericht door Jerry Lorenzo met een sterke religieuze ondertoon. De merknaam speelt met twee betekenissen van "fear of God": enerzijds de eerbied en ontzag voor God (reverence), anderzijds de letterlijke angst voor God wanneer je Hem niet kent[2][4]. Het merk heeft een grote impact gehad in de streetwear wereld, met herkenbare producten zoals hoodies met het woord "ESSENTIALS" erop[2]. Als je een alternatieve naam wilt bedenken voor je eigen kledinglijn die geïnspireerd is door Fear of God, kun je voortbouwen op soortgelijke religieuze of spirituele concepten met diepere betekenissen.

# Mogelijke Uitdagingen of Overwegingen

- Juridische bescherming: Vermijd namen die te dicht bij bestaande merknamen liggen om juridische problemen te voorkomen
- Culturele gevoeligheid: Religieuze verwijzingen kunnen verschillende reacties oproepen bij verschillende doelgroepen
- Merkidentiteit: De naam moet passen bij de stijl, doelgroep en waarden van je kledinglijn
- Internationaliteit: Overweeg hoe de naam zal overkomen in verschillende talen en culturen
- Herkenbaarheid: De naam moet gemakkelijk te onthouden en uit te spreken zijn
- Authenticiteit: De naam moet oprecht aanvoelen en niet geforceerd

# Concrete Eerste Stappen

1. Analyseer de essentie van "Fear of God": Bestudeer wat het merk zo succesvol maakt - is het de religieuze ondertoon, de dualiteit in betekenis, of de eenvoud van de naam?

2. Brainstorm rondom spirituele concepten: Maak een lijst van woorden en frases die verband houden met spiritualiteit, ontzag, eerbied, of andere religieuze concepten die je aanspreken. Voorbeelden kunnen zijn: "Divine Reverence", "Sacred Path", "Soul Essence", "Eternal Grace".

3. Onderzoek culturele en religieuze referenties: Zoek naar interessante concepten uit verschillende geloofsovertuigingen of filosofieën die een vergelijkbare diepgang hebben. Bijvoorbeeld concepten als "Serenity", "Enlightenment", "Devotion", "Providence".

4. Test potentiële namen: Verzamel feedback over je favoriete namen van potentiële klanten of mensen uit je doelgroep. Vraag naar hun eerste indruk en associaties bij elke naam.

5. Controleer beschikbaarheid: Onderzoek of de namen die je overweegt beschikbaar zijn als domeinnaam en op sociale mediaplatforms, en of er al handelsmerken voor bestaan.

6. Ontwikkel een visuele identiteit: Zodra je een naam hebt gekozen, begin met het ontwerpen van een logo en visuele stijl die de essentie van de naam versterkt, net zoals "ESSENTIALS" werkt voor Fear of God.

# Relevante Bronnen

Omdat Jerry Lorenzo''s Fear of God sterk geïnspireerd is door zijn religieuze overtuigingen, kun je dieper ingaan op de filosofie en aesthetiek achter het merk om je eigen unieke interpretatie te creëren die respectvol is maar toch onderscheidend.', '["https://fearofgod.com", "https://snobhop.substack.com/p/fear-of-god-how-jerry-lorenzo-transformed", "https://nl.wikipedia.org/wiki/Fear_of_God", "https://en.wikipedia.org/wiki/Fear_of_God", "https://www.adidas.nl/blog/967644-adidaslogos-het-verhaal-erachter-en-de-betekenis"]', '2025-05-07 11:11:05.423502+00', 'Verken alternatieve namen geïnspireerd door ''Fear of God''', NULL),
	('4da72705-bfb4-436a-a307-56d3b647bb74', '0667c54e-ae24-4f20-89f6-b0c18779986f', 'd93486bb-395e-4d81-b1f4-828379645fe6', '# WC Borstel: Alles wat je moet weten over toiletborstels

Een toiletborstel, of in het Nederlands ook wel bekend als ''wc-borstel'', is een onmisbaar accessoire in elke badkamer of toiletruimte. Hoewel het niet het meest glamoureuze item in huis is, vervult het een essentiële functie voor de hygiëne en het onderhoud van je toilet. In dit artikel duiken we dieper in de wereld van wc-borstels, hun verschillende soorten, functies en aankoopmogelijkheden.

## Wat is een WC-borstel?

Een wc-borstel is een schoonmaakhulpmiddel specifiek ontworpen voor het reinigen van het toilet. De term ''wc-borstel'' is een samenstelling van ''wc'' (watercloset) en ''borstel''[1]. In het Nederlands wordt het woord geschreven als ''wc-borstel'' en uitgesproken als /ʋeːˈseːˌbɔr.stəl/[1].

Het is een mannelijk zelfstandig naamwoord met als meervoudsvorm ''wc-borstels''[1]. Deze borstels hebben als primaire functie om het toilet schoon te houden na gebruik, waardoor hygiëne wordt gewaarborgd en ongewenste sporen worden verwijderd[5].

## Soorten WC-borstels

De markt biedt tegenwoordig een grote verscheidenheid aan toiletborstels. Hier zijn enkele populaire varianten:

### Op basis van montage
* **Staande modellen**: Deze staan op de vloer naast het toilet
* **Hangende modellen**: Deze worden aan de muur bevestigd, wat ruimte bespaart en schoonmaken vergemakkelijkt[2][5]

### Op basis van materiaal
* **Kunststof borstels**: Betaalbaar en in veel verschillende kleuren verkrijgbaar
* **Siliconen borstels**: Flexibel en hygiënischer dan traditionele borstels, omdat ze minder water en vuil vasthouden[2]
* **Borstels met stalen kop**: Duurzamer en effectiever bij hardnekkige vlekken[2]

### Op basis van design
* **Ronde modellen**: Klassiek en tijdloos
* **Vierkante modellen**: Modern en strak
* **Designer modellen**: Sommige merken bieden zelfs humoristische of artistieke ontwerpen, zoals borstels met de beeltenis van bekende personen[3][5]

## Waar op te letten bij de aanschaf

Bij het kiezen van een wc-borstel zijn er verschillende aspecten om rekening mee te houden:

### Functionaliteit
Een goede toiletborstel moet effectief zijn in het reinigen van het toilet, inclusief moeilijk bereikbare plekken zoals onder de rand. Sommige modellen komen met extra functionaliteiten zoals een reservekop of een speciaal montagesysteem[2].

### Hygiëne
Moderne wc-borstels zijn ontworpen met hygiëne als prioriteit. Siliconen borstels zijn bijvoorbeeld makkelijker schoon te houden dan traditionele borstels met haren[2].

### Esthetiek
Hoewel functionaliteit belangrijk is, speelt het uiterlijk ook een rol aangezien de wc-borstel vaak zichtbaar is in de badkamer of toiletruimte. Er zijn verschillende stijlen en afwerkingen beschikbaar, van mat zwart tot goud, om bij je interieur te passen[5].

### Prijs
Toiletborstels zijn verkrijgbaar in verschillende prijsklassen. Eenvoudige modellen zijn al te vinden voor ongeveer 13 euro, terwijl luxere varianten met speciale functies of designs duurder kunnen zijn[2].

## Waar te koop?

WC-borstels zijn vrijwel overal te koop waar badkameraccessoires worden verkocht:

* **Online winkels**: Platforms zoals Bol.com bieden een breed assortiment aan toiletborstels met verschillende prijzen en bezorgopties[2]
* **Speciaalzaken**: Winkels zoals Sanitairwinkel hebben een uitgebreide collectie wc-borstels in verschillende stijlen en materialen[5]
* **Internationale webshops**: Sites zoals AliExpress bieden ook unieke en soms humoristische ontwerpen die niet altijd lokaal verkrijgbaar zijn[3]

## Onderhoud van je WC-borstel

Een vaak vergeten aspect is het onderhoud van de toiletborstel zelf. Voor optimale hygiëne is het belangrijk om:

* De borstel regelmatig te reinigen met een desinfecterend middel
* De houder schoon te houden en eventueel opgehoopt water weg te gooien
* De borstel te vervangen wanneer deze versleten is of niet meer effectief schoonmaakt

## Conclusie

Hoewel een wc-borstel misschien niet het meest opwindende item in je badkamer is, is het wel een essentieel hulpmiddel voor de hygiëne. Met de huidige verscheidenheid aan designs, materialen en montageopties kan een toiletborstel zelfs een stijlvolle toevoeging aan je interieur zijn. Of je nu kiest voor een eenvoudig model of een designerstuk, een goede wc-borstel draagt bij aan een schone en frisse toiletruimte.

## Bronnen

1. Wiktionary - wc-borstel definitie
2. Bol.com - Toiletborstels pagina
3. AliExpress - Speciale toiletborstel designs
4. Shutterstock - Wc Borstel afbeeldingen
5. Sanitairwinkel - WC-borstels collectie', '[]', '2025-05-11 11:17:33.396454+00', 'Wc borstel', NULL),
	('c4bc1af0-2ff9-4041-84c8-c8fa41a5d26e', 'e5862aec-438b-459d-ac2d-ea8b69d1a155', 'd93486bb-395e-4d81-b1f4-828379645fe6', '**Perplextity Hackathon Project Opleveren**

## Inleiding

De Perplextity Hackathon is een wereldwijd evenement waarbij ontwikkelaars worden uitgedaagd om innovatieve projecten te bouwen met de Perplextity Sonar API, een geavanceerde AI-antwoordmachine die real-time internetzoekopdrachten en betrouwbare bronvermelding biedt. Het opleveren van een hackathonproject is een cruciaal moment voor deelnemers: hier tonen zij hun technische creativiteit, probleemoplossend vermogen en het vermogen om werkende prototypes te presenteren. Dit onderwerp is relevant voor ontwikkelaars, studenten, tech startups en iedereen die geïnteresseerd is in AI-gedreven innovatie binnen een competitieve context. In dit overzicht worden de belangrijkste vereisten, aandachtspunten en best practices voor het succesvol opleveren van een Perplextity Hackathon-project besproken.

## Eisen aan de Oplevering

**Projectvereisten**

- Het project moet gebouwd of significant geüpdatet zijn tijdens de hackathonperiode.
- Het project moet draaien op het platform waarvoor het bedoeld is en zoals gespecificeerd in de indieningseisen[2].
- Eventuele integratie van externe SDK’s, API’s of data moet voldoen aan de licentievoorwaarden van die tools[2].

**Indieningseisen**

- Tekstuele beschrijving met uitleg over de features, functionaliteit en het gebruik van de Perplextity API[1][2].
- URL naar een privé-code repository (bijv. op GitHub) voor beoordeling en testen. De repo moet gedeeld worden met james.liounis@perplexity.ai & testing@devpost.com[1][2].
- Een gedetailleerde `README.md` met installatie- en gebruiksinstructies[1][2].
- Een uitleg over hoe de Perplextity API is ingezet binnen het project[1][2].
- Duidelijke vermelding van de categorie (en eventuele bonuscategorie) waarin het project wordt ingediend[1][2].
- Demonstratievideo van maximaal 3 minuten, geüpload naar YouTube, Vimeo of Facebook Video (openbaar beschikbaar)[1][2].
- Volledig ingevuld Devpost-indieningsformulier[1].

## Praktische Tips voor een Succesvolle Oplevering

- **Structuur README.md:** Zorg voor heldere installatie-instructies, gebruiksvoorbeelden en een toelichting op de architectuur van je project.
- **Demonstratievideo:** Licht in maximaal drie minuten de belangrijkste features toe, laat het werkende prototype zien en focus op de innovatieve inzet van de Perplextity API.
- **API-gebruik:** Beschrijf concreet hoe de Sonar API, Sonar Reasoning, Sonar Reasoning Pro of Sonar Deep Research in je oplossing is geïntegreerd. Benoem bijvoorbeeld hoe je real-time zoekresultaten en bronvermeldingen gebruikt[1][3].
- **Categoriekeuze:** Zorg dat je project duidelijk past binnen de gekozen categorie en licht dit toe in je indiening[1][2].
- **Significante updates:** Indien je een bestaand project indient, geef dan duidelijk aan welke onderdelen tijdens de hackathon zijn vernieuwd of verbeterd[2].

## Voorbeeld: Reverse Research Project

Een interessant voorbeeld van een oplevering is het “Reverse Research”-project, waarbij gebruikers een conclusie invoeren en het systeem met behulp van de Sonar API automatisch argumenten en bronnen opzoekt, zowel ter ondersteuning als ter weerlegging van de stelling. Dit soort toepassingen illustreert de kracht van real-time AI-zoekopdrachten en bronvermelding in praktische scenario’s zoals debatteren of journalistiek schrijven[3].

## Vergelijking: Belangrijkste Oplevercomponenten

| Opleveronderdeel      | Vereist? | Toelichting                                      |
|----------------------|----------|--------------------------------------------------|
| Code repository      | Ja       | Privé repo, gedeeld met jury                     |
| README.md            | Ja       | Gedetailleerd, met uitleg en installatie         |
| Demo-video           | Ja       | Maximaal 3 minuten, openbaar beschikbaar         |
| API-gebruik uitleg   | Ja       | Specifiek en concreet                            |
| Categorie-aanduiding | Ja       | Hoofdcategorie en evt. bonuscategorie            |
| Tekstuele beschrijving| Ja      | Features, functionaliteit, projectdoel           |
| Devpost formulier    | Ja       | Volledig en correct ingevuld                     |

## Belangrijkste Bevindingen & Conclusie

- Het opleveren van een Perplextity Hackathon-project vereist een complete, goed gedocumenteerde en overtuigend gepresenteerde oplossing, waarbij nadruk ligt op het innovatieve gebruik van de Perplextity Sonar API[1][2].
- Een gestructureerde README, een korte maar krachtige demonstratievideo en een heldere uitleg van het API-gebruik zijn essentieel voor een succesvolle beoordeling.
- Zorg dat je project voldoet aan de specifieke eisen rondom authenticatie, platformcompatibiliteit en (indien van toepassing) het gebruik van third-party tools[2].
- De hackathon biedt kansen om nieuwe productcategorieën te verkennen, zoals onderzoeksassistenten, journalistieke tools, of leerplatforms die profiteren van real-time AI-zoekopdrachten[1][3].
- Let op dat alle onderdelen tijdig en volgens de richtlijnen worden aangeleverd.

## Sources

1. [Perplexity Hackathon: Create an internet-enabled project to inspire ...](https://perplexityhackathon.devpost.com)
2. [Rules - Perplexity Hackathon - Devpost](https://perplexityhackathon.devpost.com/rules)
3. [Perplexity Hackathon - Reverse Research - YouTube](https://www.youtube.com/watch?v=q_d3M2y_R3g)
4. [Perplexity''s Fall 2024 Campus Strategist Program - Threads](https://www.threads.net/@perplexity.ai/post/DDu-gFEzDH5)
5. [Perplexity''s Fall 2024 Campus Strategist Program](https://www.perplexity.ai/hub/blog/perplexity-s-2024-campus-strategist-program)', '[{"url": "https://perplexityhackathon.devpost.com", "title": "Perplexity Hackathon: Create an internet-enabled project to inspire ..."}, {"url": "https://perplexityhackathon.devpost.com/rules", "title": "Rules - Perplexity Hackathon - Devpost"}, {"url": "https://www.youtube.com/watch?v=q_d3M2y_R3g", "title": "Perplexity Hackathon - Reverse Research - YouTube"}, {"url": "https://www.threads.net/@perplexity.ai/post/DDu-gFEzDH5", "title": "Perplexity''s Fall 2024 Campus Strategist Program - Threads"}, {"url": "https://www.perplexity.ai/hub/blog/perplexity-s-2024-campus-strategist-program", "title": "Perplexity''s Fall 2024 Campus Strategist Program"}]', '2025-05-11 11:30:05.942092+00', 'Perplextity Hackaton project opleveren', NULL),
	('2e9efea4-13da-47ea-a9cd-e82155b1c305', '6e5ed291-27e0-4aac-82db-52ea321dcf22', 'd93486bb-395e-4d81-b1f4-828379645fe6', '## Kernconcept Samenvatting

Het subtask richt zich op het ontwerpen of verkopen van kleding met populaire anime-karakters zoals Kon (Bleach), Chopper (One Piece) en Happy (FairyTail). Deze karakters zijn herkenbare mascottes binnen hun respectievelijke series en hebben wereldwijd een trouwe fanbase. Door kleding te maken met deze figuren speel je in op de groeiende populariteit van anime-merchandise, vooral onder jongeren die hun fandom willen uiten via mode[1][2]. Dit sluit aan bij de bredere trend waarbij anime en streetwear/fashion steeds meer met elkaar vervlochten raken.

## Mogelijke Uitdagingen of Overwegingen

- Licentie en copyright: Je hebt officiële toestemming nodig om deze karakters commercieel te mogen gebruiken.
- Concurrentie: Er is veel aanbod van anime-merchandise, dus onderscheidend vermogen in design of branding is belangrijk.
- Authenticiteit: Animefans zijn kritisch. Een oprechte en respectvolle benadering van de karakters is essentieel.
- Doelgroepkeuze: Bepaal of je je richt op hardcore fans, casual kijkers of een bredere modebewuste doelgroep.
- Distributie: Online verkoop domineert de markt, maar aanwezigheid op conventies en pop-up events kan extra zichtbaarheid geven[2].
- Prijsstelling: Fans besteden graag geld aan kwaliteit, maar exclusiviteit of gelimiteerde oplages kunnen ook waarde toevoegen[3].

## Concrete Eerste Stappen

1. Onderzoek welke rechten/licenties je nodig hebt om officiële ontwerpen te mogen gebruiken van Kon, Chopper en Happy.
2. Analyseer bestaande anime-merchandising concurrenten en bepaal hoe jouw kledinglijn zich kan onderscheiden qua stijl, kwaliteit of beleving.
3. Schets samen met een designer meerdere kledingontwerpen (hoodies, t-shirts, accessoires) waarin de karakters op een originele manier verwerkt zijn.
4. Benader officiële licentiehouders (zoals Toei Animation, Shueisha) of werk samen met agentschappen gespecialiseerd in anime-licenties.
5. Test de animo onder potentiële klanten (via social media, enquêtes of focusgroepen) en verzamel feedback op designconcepten.
6. Onderzoek distributiekanalen, met speciale focus op online platforms en plekken waar veel animefans zich bevinden (conventies, communities, niche webshops).

## Relevante Bronnen (Optioneel)

- [Anime Merchandising Market Report – Grandview Research](https://www.grandviewresearch.com/industry-analysis/anime-merchandising-market-report)
- [Waarom Anime een Brandinggoudmijn is – Jembe](https://thejembe.com/why-anime-culture-is-a-branding-goldmine/)

Deze stappen helpen je om snel inzicht te krijgen in de mogelijkheden en uitdagingen rondom anime-geïnspireerde kleding, zodat je gericht verder werkt aan de brandingnaam en het concept voor jouw kledinglijn.', '["https://www.grandviewresearch.com/industry-analysis/anime-merchandising-market-report", "https://www.grandviewresearch.com/industry-analysis/us-anime-merchandising-market-report", "https://thejembe.com/why-anime-culture-is-a-branding-goldmine/", "https://www.kbvresearch.com/anime-merchandising-market/", "https://www.persistencemarketresearch.com/market-research/anime-merchandising-market.asp"]', '2025-05-08 13:22:56.886583+00', 'Clothing with anime charakters Kon of Bleach, Chopper of One Piece, Happy of FairyTale', NULL),
	('c8c1c479-e4af-4ef4-b66b-75642422bbcc', '219c9d02-52b7-463c-83a1-5e06ad793505', 'd93486bb-395e-4d81-b1f4-828379645fe6', 'AI-modellen worden steeds vaker ingezet voor uiteenlopende toepassingen, van chatbots tot geavanceerde data-analyse. De kosten van deze modellen variëren sterk, afhankelijk van het type model, de schaal, het gebruik en de commerciële strategie van de aanbieder. Hieronder volgt een overzicht van de belangrijkste factoren, methoden en trends om onderzoek te doen naar de kosten van verschillende AI-modellen.

## Optimal aanpak en methodologie

**Stappen voor kostenonderzoek naar AI-modellen:**

- Bepaal het type AI-model (bijvoorbeeld: taalmodel, beeldherkenning, generatieve AI, enz.)
- Inventariseer de aanbieders en hun prijsmodellen (zoals OpenAI, Google, Meta, enz.)
- Maak onderscheid tussen open source-modellen en betaalde modellen
- Verzamel prijsinformatie op basis van gebruik (per gebruiker, per token, per output, enz.)
- Vergelijk aanvullende kosten zoals implementatie, integratie en benodigde infrastructuur

## Benodigde tools, bronnen en technieken

- Prijsvergelijkingswebsites (zoals Capterra Nederland) waarmee je AI-software kunt filteren op kosten en functionaliteit[1]
- Officiële prijspagina’s en documentatie van AI-aanbieders
- Marktanalyses en rapporten (bijvoorbeeld van Statista) voor up-to-date prijsdata en trends[4]
- Gebruik van cost calculators van cloudproviders (zoals AWS, Google Cloud, Azure) voor eigen hosting en inferentie
- Reviews en ervaringen van zakelijke gebruikers voor inzicht in verborgen of additionele kosten

## Stapsgewijze instructies

1. **Definieer de use case:** Welke AI-functionaliteit heb je nodig? (bv. tekstgeneratie, beeldherkenning, etc.)
2. **Kies relevante aanbieders en modellen:** Maak een shortlist van modellen die voldoen aan je eisen.
3. **Verzamel prijsinformatie:** 
    - Raadpleeg prijslijsten van aanbieders.
    - Gebruik vergelijkingssites voor een overzicht van marktprijzen[1].
    - Zoek naar kosten per output (zoals tokens/paragrafen) als alternatief voor traditionele licentieprijzen[2].
4. **Bereken totale eigendomskosten:** Voeg implementatie-, trainings-, cloud- en onderhoudskosten toe.
5. **Vergelijk functionaliteiten en marges:** Houd rekening met operationele kosten en de impact op de bruto-marge[5].
6. **Evalueer open source-opties:** Bekijk of modellen zoals Llama 3 geschikt zijn; deze zijn vaak gratis beschikbaar, maar vergen meer technische kennis[3].
7. **Documenteer bevindingen:** Zet de resultaten in een overzichtelijke tabel.

## Tijdwinststrategieën & best practices

- Gebruik online prijsvergelijkers en -overzichten voor een snelle eerste selectie[1].
- Maak gebruik van proefversies of gratis credits bij aanbieders om realistische gebruikskosten te simuleren.
- Overweeg off-peak pricing als flexibiliteit in gebruik mogelijk is—dit kan tot 75% goedkoper zijn[2].
- Automatiseer benchmarking door scripts te gebruiken die API-kosten en verbruik monitoren.

## Veelvoorkomende uitdagingen en oplossingen

- **Onvoorspelbare kosten bij veelvuldig gebruik:** Monitor het actuele verbruik via dashboards en stel limieten in.
- **Moeilijke vergelijking van prijsmodellen:** Normaliseer kosten naar eenheidsprijs (bijv. prijs per miljoen tokens of per output)[4].
- **Verborgen kosten en cloudinfrastructuur:** Neem hosting- en implementatiekosten expliciet mee in de vergelijking[5].
- **Licentiebeperkingen bij open source:** Let op commerciële restricties bij open source modellen zoals Llama 3[3].

## Vergelijkende tabel: Prijsmodellen AI-modellen (2025)

| Model / Aanbieder         | Prijsmodel                 | Indicatie kosten            | Bijzonderheden                        |
|---------------------------|----------------------------|-----------------------------|----------------------------------------|
| ChatGPT (OpenAI)          | Per miljoen tokens / API   | $1-$10 per miljoen tokens   | Hoge operationele kosten op schaal[5]  |
| Claude 3.5 (Anthropic)    | Per miljoen tokens / API   | $2-$12 per miljoen tokens   | Tweede duurste model in 2025[4]        |
| Llama 3 (Meta)            | Gratis/open source         | Geen, wel infra-kosten      | Commercieel gebruik soms beperkt[3]    |
| DeepSeek (China)          | Output-based, off-peak     | Tot 75% korting off-peak    | Stimuleert gebruik buiten piektijden[2]|
| AI-CRM (Copy.ai, Hubspot) | Output- of token-based     | $0.02 per output / tokens   | Prijs afgestemd op daadwerkelijk gebruik[2] |
| Microsoft Copilot         | Per gebruiker/licentie     | $30 per maand (indicatie)   | Traditioneel SaaS-model                |

## Relevante experts of bronnen voor verdere verkenning

- Marktanalisten van Statista en Gartner voor trends en benchmarks[4].
- Prijsvergelijkingssites zoals Capterra Nederland[1].
- Publicaties van AI-infrastructuuraanbieders en cloudproviders.
- Community’s rond open source AI-modellen (GitHub, Hugging Face).

## Bronnen

1. [AI-software: vergelijk functies en kosten - Capterra Nederland 2025](https://www.capterra.nl/directory/30938/artificial-intelligence/software)
2. [AI Costs In 2025: A Guide To Pricing + Implementation - CloudZero](https://www.cloudzero.com/blog/ai-costs/)
3. [De 21 beste AI-chatbots in 2025 - Zendesk](https://www.zendesk.nl/service/messaging/chatbot/)
4. [AI model pricing trends 2025 - Statista](https://www.statista.com/statistics/1611560/cost-efficiency-ai-models/)
5. [AI Pricing in 2025: Monetizely''s Strategy for Costing](https://www.getmonetizely.com/blogs/ai-pricing-how-much-does-ai-cost-in-2025)', '["https://www.capterra.nl/directory/30938/artificial-intelligence/software", "https://www.cloudzero.com/blog/ai-costs/", "https://www.zendesk.nl/service/messaging/chatbot/", "https://www.statista.com/statistics/1611560/cost-efficiency-ai-models/", "https://www.getmonetizely.com/blogs/ai-pricing-how-much-does-ai-cost-in-2025"]', '2025-05-11 01:18:08.864571+00', NULL, 'kan je onderzoek doen naar de kosten van de verschillende ai modellen
');


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: task_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."task_notes" ("id", "task_id", "content", "created_at", "user_id") VALUES
	('e1e8dbbb-d105-4a69-ba61-040d6fa7a4db', '6e5ed291-27e0-4aac-82db-52ea321dcf22', 'Divine Reverence", "Sacred Path", "Soul Essence", "Eternal Grace".Serenity", "Enlightenment", "Devotion", "Providence".', '2025-05-07 11:12:51.410233+00', 'd93486bb-395e-4d81-b1f4-828379645fe6');


--
-- Data for Name: theme_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."theme_settings" ("role", "available_themes", "default_theme", "created_at", "updated_at") VALUES
	('admin', '{light,dark,custom-dark}', 'custom-dark', '2025-05-14 21:01:22.968419+00', '2025-05-14 21:01:22.968419+00'),
	('paid', '{light,dark,custom-dark}', 'custom-dark', '2025-05-14 21:01:22.968419+00', '2025-05-14 21:01:22.968419+00'),
	('free', '{custom-dark}', 'custom-dark', '2025-05-14 21:01:22.968419+00', '2025-05-14 21:01:22.968419+00');


--
-- Data for Name: user_api_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- PostgreSQL database dump complete
--

RESET ALL;
