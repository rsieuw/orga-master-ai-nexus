-- Optimaliseer realtime queries door indexen toe te voegen
-- Deze indexen zullen helpen om de belasting op de database te verminderen
-- wanneer realtime.list_changes wordt uitgevoerd

DO $$ 
BEGIN
    -- Controleer of de tasks tabel bestaat en maak deze aan indien nodig
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        CREATE TABLE IF NOT EXISTS public.tasks (
            id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
            created_at timestamp with time zone DEFAULT now() NOT NULL,
            user_id uuid NOT NULL,
            title text NOT NULL,
            description text,
            status text DEFAULT 'todo'::text NOT NULL,
            priority text DEFAULT 'medium'::text,
            due_date timestamp with time zone,
            completed_at timestamp with time zone,
            category text,
            tags text[],
            subtasks jsonb,
            is_favorite boolean DEFAULT false
        );
    END IF;

    -- Maak een index aan voor de user_id kolom in de tasks tabel als deze kolom bestaat
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'user_id'
    ) THEN
        -- Maak de index alleen aan als deze nog niet bestaat
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND tablename = 'tasks' 
            AND indexname = 'idx_tasks_user_id'
        ) THEN
            CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
            
            -- Functie instellen om de index te gebruiken
            COMMENT ON TABLE public.tasks IS 'Taken van gebruikers met indexoptimalisatie voor realtime queries';
            
            -- Optimaliseer de realtime subscriptions door de replication identifier te configureren
            ALTER TABLE public.tasks REPLICA IDENTITY FULL;
            
            -- Analyseer de tabellen om query planner statistieken te verbeteren
            ANALYZE public.tasks;
        END IF;
    END IF;
END $$; 