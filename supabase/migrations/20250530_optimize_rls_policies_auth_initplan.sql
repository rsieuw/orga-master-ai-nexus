-- Migratie om RLS-policies te optimaliseren door auth.<function>() aan te roepen met (select auth.<function>())
-- Dit voorkomt dat de auth-functies voor elke rij opnieuw worden geëvalueerd, wat de prestaties verbetert
-- Ook worden dubbele permissive policies geconsolideerd

-- Task notes table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_notes') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow insert for own notes" ON "public"."task_notes"';
        EXECUTE 'CREATE POLICY "Allow insert for own notes" ON "public"."task_notes"
                FOR INSERT TO authenticated
                WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow individual read access (of Allow select for own notes)" ON "public"."task_notes"';
        EXECUTE 'CREATE POLICY "Allow individual read access (of Allow select for own notes)" ON "public"."task_notes"
                FOR SELECT TO authenticated
                USING (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow individual update access (of Allow update for own notes)" ON "public"."task_notes"';
        EXECUTE 'CREATE POLICY "Allow individual update access (of Allow update for own notes)" ON "public"."task_notes"
                FOR UPDATE TO authenticated
                USING (user_id = (select auth.uid()))
                WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow individual delete access (of Allow delete for own notes)" ON "public"."task_notes"';
        EXECUTE 'CREATE POLICY "Allow individual delete access (of Allow delete for own notes)" ON "public"."task_notes"
                FOR DELETE TO authenticated
                USING (user_id = (select auth.uid()))';
    END IF;
END $$;

-- Profiles table policies - fix auth.uid() calls en consolideer policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow admins update all, users their own" ON "public"."profiles"';
        EXECUTE 'CREATE POLICY "consolidated_profiles_update_policy" ON "public"."profiles"
                FOR UPDATE TO authenticated
                USING ((select auth.uid()) = id OR 
                    EXISTS (
                        SELECT 1 FROM profiles
                        WHERE profiles.id = (select auth.uid())
                        AND profiles.role = ''admin''
                    ))
                WITH CHECK ((select auth.uid()) = id OR 
                    EXISTS (
                        SELECT 1 FROM profiles
                        WHERE profiles.id = (select auth.uid())
                        AND profiles.role = ''admin''
                    ))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to delete own profile" ON "public"."profiles"';
        EXECUTE 'CREATE POLICY "Allow users to delete own profile" ON "public"."profiles"
                FOR DELETE TO authenticated
                USING (id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to insert their own profile" ON "public"."profiles"';
        EXECUTE 'CREATE POLICY "Allow users to insert their own profile" ON "public"."profiles"
                FOR INSERT TO authenticated
                WITH CHECK (id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles"';
        EXECUTE 'CREATE POLICY "profiles_select_policy" ON "public"."profiles"
                FOR SELECT TO authenticated
                USING (true)';
    END IF;
END $$;

-- Saved research table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_research') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to insert their own saved research" ON "public"."saved_research"';
        EXECUTE 'CREATE POLICY "Allow users to insert their own saved research" ON "public"."saved_research"
                FOR INSERT TO authenticated
                WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to select their own saved research" ON "public"."saved_research"';
        EXECUTE 'CREATE POLICY "Allow users to select their own saved research" ON "public"."saved_research"
                FOR SELECT TO authenticated
                USING (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "allow users to delete their own research" ON "public"."saved_research"';
        EXECUTE 'CREATE POLICY "allow users to delete their own research" ON "public"."saved_research"
                FOR DELETE TO authenticated
                USING (user_id = (select auth.uid()))';
    END IF;
END $$;

-- Role permissions tabel - consolideer policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access" ON "public"."role_permissions"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."role_permissions"';
        
        -- Eén geconsolideerde policy voor alles
        EXECUTE 'CREATE POLICY "consolidated_role_permissions_policy" ON "public"."role_permissions"
                 FOR ALL TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   ) OR (select auth.uid()) IS NOT NULL
                 )';
    END IF;
END $$;

-- Feedback table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated users to insert their own feedback" ON "public"."feedback"';
        EXECUTE 'CREATE POLICY "Allow authenticated users to insert their own feedback" ON "public"."feedback"
                 FOR INSERT TO authenticated
                 WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "feedback_select_policy" ON "public"."feedback"';
        EXECUTE 'CREATE POLICY "feedback_select_policy" ON "public"."feedback"
                 FOR SELECT TO authenticated
                 USING (
                   user_id = (select auth.uid()) OR
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END $$;

-- Customer table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        -- Controleer eerst of de policy bestaat voordat we proberen deze te verwijderen of te updaten
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'customers'
            AND policyname = 'Allow individual user access to their own customer record'
        ) THEN
            EXECUTE 'DROP POLICY IF EXISTS "Allow individual user access to their own customer record" ON "public"."customers"';
            
            -- Controleer welke kolommen beschikbaar zijn
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'customers'
                AND column_name = 'id'
            ) THEN
                EXECUTE 'CREATE POLICY "Allow individual user access to their own customer record" ON "public"."customers"
                         FOR ALL TO authenticated
                         USING (id = (select auth.uid()))';
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'customers'
                AND column_name = 'user_id'
            ) THEN
                EXECUTE 'CREATE POLICY "Allow individual user access to their own customer record" ON "public"."customers"
                         FOR ALL TO authenticated
                         USING (user_id = (select auth.uid()))';
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'customers'
                AND column_name = 'auth_id'
            ) THEN
                EXECUTE 'CREATE POLICY "Allow individual user access to their own customer record" ON "public"."customers"
                         FOR ALL TO authenticated
                         USING (auth_id = (select auth.uid()))';
            END IF;
        END IF;
    END IF;
END $$;

-- Subscriptions table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        -- Controleer eerst of de policy bestaat voordat we proberen deze te verwijderen of te updaten
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'subscriptions'
            AND policyname = 'Allow individual user access to their own subscriptions'
        ) THEN
            EXECUTE 'DROP POLICY IF EXISTS "Allow individual user access to their own subscriptions" ON "public"."subscriptions"';
            
            -- Controleer welke kolommen beschikbaar zijn
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'subscriptions'
                AND column_name = 'user_id'
            ) THEN
                EXECUTE 'CREATE POLICY "Allow individual user access to their own subscriptions" ON "public"."subscriptions"
                        FOR ALL TO authenticated
                        USING (user_id = (select auth.uid()))';
            ELSIF EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conrelid = 'public.subscriptions'::regclass::oid 
                AND contype = 'f'
                AND EXISTS (
                    SELECT 1 FROM pg_attribute 
                    WHERE attrelid = 'public.subscriptions'::regclass::oid 
                    AND attnum = ANY(conkey) 
                    AND attname = 'customer_id'
                )
            ) THEN
                -- Aangepaste query voor relaties via customer_id
                EXECUTE '
                CREATE POLICY "Allow individual user access to their own subscriptions" ON "public"."subscriptions"
                FOR ALL TO authenticated
                USING (EXISTS (
                    SELECT 1 FROM public.customers
                    WHERE customers.id = subscriptions.customer_id
                    AND customers.id = (select auth.uid())
                ))';
            END IF;
        END IF;
    END IF;
END $$;

-- Pinned messages table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pinned_messages') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to select their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to insert their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to delete their own pinned messages" ON "public"."pinned_messages"';
        
        -- Geconsolideerde policy voor alle operaties
        EXECUTE 'CREATE POLICY "consolidated_pinned_messages_policy" ON "public"."pinned_messages"
                 FOR ALL TO authenticated
                 USING (user_id = (select auth.uid()))
                 WITH CHECK (user_id = (select auth.uid()))';
    END IF;
END $$;

-- Theme settings table policies - consolideren
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'theme_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only viewable by admins" ON "public"."theme_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only editable by admins" ON "public"."theme_settings"';
        
        -- Geconsolideerde policy voor alle operaties
        EXECUTE 'CREATE POLICY "consolidated_theme_settings_policy" ON "public"."theme_settings"
                 FOR ALL TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END $$;

-- User API logs table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_api_logs') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admins to read user_api_logs" ON "public"."user_api_logs"';
        EXECUTE 'CREATE POLICY "Allow admins to read user_api_logs" ON "public"."user_api_logs"
                 FOR SELECT TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END $$;

-- External API usage logs table policies
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'external_api_usage_logs') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admins to read external_api_usage_logs" ON "public"."external_api_usage_logs"';
        EXECUTE 'CREATE POLICY "Allow admins to read external_api_usage_logs" ON "public"."external_api_usage_logs"
                 FOR SELECT TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END $$;

-- System settings table policies - consolideren
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_view_system_settings" ON "public"."system_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_insert_system_settings" ON "public"."system_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_update_system_settings" ON "public"."system_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_delete_system_settings" ON "public"."system_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow public read for system_settings" ON "public"."system_settings"';
        
        -- Geconsolideerde admin policy voor alle operaties
        EXECUTE 'CREATE POLICY "consolidated_system_settings_admin_policy" ON "public"."system_settings"
                 FOR ALL TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
                  
        -- Publieke leestoegang
        EXECUTE 'CREATE POLICY "system_settings_public_read_policy" ON "public"."system_settings"
                 FOR SELECT TO authenticated
                 USING (true)';
    END IF;
END $$; 