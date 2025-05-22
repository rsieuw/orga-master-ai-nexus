-- Fix voor de waarschuwing over meerdere permissive policies voor system_settings
-- We consolideren de bestaande policies tot één beleid voor SELECT en één voor andere operaties

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        -- Verwijder de bestaande policies die we eerder hebben gemaakt
        EXECUTE 'DROP POLICY IF EXISTS "consolidated_system_settings_admin_policy" ON "public"."system_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "system_settings_public_read_policy" ON "public"."system_settings"';
        
        -- Maak één geconsolideerde policy voor SELECT die zowel normale gebruikers als admins dekt
        EXECUTE 'CREATE POLICY "system_settings_consolidated_select_policy" ON "public"."system_settings"
                 FOR SELECT TO authenticated
                 USING (true)';
        
        -- Maak een aparte policy voor andere operaties (INSERT, UPDATE, DELETE) alleen voor admins
        EXECUTE 'CREATE POLICY "system_settings_admin_write_policy" ON "public"."system_settings"
                 FOR ALL TO authenticated
                 USING (
                     EXISTS (
                         SELECT 1 FROM profiles
                         WHERE profiles.id = (select auth.uid())
                         AND profiles.role = ''admin''
                     )
                 )
                 WITH CHECK (
                     EXISTS (
                         SELECT 1 FROM profiles
                         WHERE profiles.id = (select auth.uid())
                         AND profiles.role = ''admin''
                     )
                 )';
    END IF;
END $$; 