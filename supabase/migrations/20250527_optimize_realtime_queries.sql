-- Optimaliseer realtime queries door indexen toe te voegen
-- Deze indexen zullen helpen om de belasting op de database te verminderen
-- wanneer realtime.list_changes wordt uitgevoerd

-- Maak een index aan voor de user_id kolom in de tasks tabel
-- Dit verbetert drastisch de query performance voor realtime subscribes die filteren op user_id
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);

-- Functie instellen om de index te gebruiken
COMMENT ON TABLE public.tasks IS 'Taken van gebruikers met indexoptimalisatie voor realtime queries';

-- Optimaliseer de realtime subscriptions door de replication identifier te configureren
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

-- Analyseer de tabellen om query planner statistieken te verbeteren
ANALYZE public.tasks; 