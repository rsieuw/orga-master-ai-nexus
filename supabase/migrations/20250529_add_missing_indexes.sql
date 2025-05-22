-- Migratie om ontbrekende indexen toe te voegen en databaseprestaties te optimaliseren

-- 1. Ontbrekende indexen voor foreign keys
DO $$ 
BEGIN
    -- external_api_usage_logs.user_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'external_api_usage_logs'
        AND indexname = 'idx_external_api_usage_logs_user_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'external_api_usage_logs'
        ) THEN
            CREATE INDEX idx_external_api_usage_logs_user_id ON public.external_api_usage_logs(user_id);
            RAISE NOTICE 'Created index idx_external_api_usage_logs_user_id';
        END IF;
    END IF;
    
    -- feedback.user_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'feedback'
        AND indexname = 'idx_feedback_user_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'feedback'
        ) THEN
            CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
            RAISE NOTICE 'Created index idx_feedback_user_id';
        END IF;
    END IF;
    
    -- pinned_messages.task_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'pinned_messages'
        AND indexname = 'idx_pinned_messages_task_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'pinned_messages'
        ) THEN
            CREATE INDEX idx_pinned_messages_task_id ON public.pinned_messages(task_id);
            RAISE NOTICE 'Created index idx_pinned_messages_task_id';
        END IF;
    END IF;
    
    -- pinned_messages.user_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'pinned_messages'
        AND indexname = 'idx_pinned_messages_user_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'pinned_messages'
        ) THEN
            CREATE INDEX idx_pinned_messages_user_id ON public.pinned_messages(user_id);
            RAISE NOTICE 'Created index idx_pinned_messages_user_id';
        END IF;
    END IF;
    
    -- prices.product_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'prices'
        AND indexname = 'idx_prices_product_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'prices'
        ) THEN
            CREATE INDEX idx_prices_product_id ON public.prices(product_id);
            RAISE NOTICE 'Created index idx_prices_product_id';
        END IF;
    END IF;
    
    -- subscriptions.price_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'subscriptions'
        AND indexname = 'idx_subscriptions_price_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'subscriptions'
        ) THEN
            CREATE INDEX idx_subscriptions_price_id ON public.subscriptions(price_id);
            RAISE NOTICE 'Created index idx_subscriptions_price_id';
        END IF;
    END IF;
    
    -- subscriptions.user_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'subscriptions'
        AND indexname = 'idx_subscriptions_user_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'subscriptions'
        ) THEN
            CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
            RAISE NOTICE 'Created index idx_subscriptions_user_id';
        END IF;
    END IF;
    
    -- user_api_logs.user_id index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'user_api_logs'
        AND indexname = 'idx_user_api_logs_user_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'user_api_logs'
        ) THEN
            CREATE INDEX idx_user_api_logs_user_id ON public.user_api_logs(user_id);
            RAISE NOTICE 'Created index idx_user_api_logs_user_id';
        END IF;
    END IF;

    -- Note: We behouden idx_tasks_is_favorite en idx_tasks_user_id ondanks dat ze momenteel niet worden 
    -- gebruikt, omdat ze waarschijnlijk nodig zullen zijn voor toekomstige queries.
    -- Als we deze indexen willen verwijderen, kan dat als volgt:
    -- 
    -- DROP INDEX IF EXISTS public.idx_tasks_is_favorite;
    -- DROP INDEX IF EXISTS public.idx_tasks_user_id;
END $$; 