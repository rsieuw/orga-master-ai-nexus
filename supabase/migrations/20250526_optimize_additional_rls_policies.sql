-- Description: Optimaliseer Row Level Security policies door auth.<function>() aanroepen te vervangen met (select auth.<function>())
-- Gerelateerd aan Supabase linter waarschuwing auth_rls_initplan

-- task_notes tabellen
DROP POLICY IF EXISTS "Allow insert for own notes" ON "public"."task_notes";
CREATE POLICY "Allow insert for own notes" ON "public"."task_notes"
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual read access (of Allow select for own notes)" ON "public"."task_notes";
CREATE POLICY "Allow individual read access (of Allow select for own notes)" ON "public"."task_notes"
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual update access (of Allow update for own notes)" ON "public"."task_notes";
CREATE POLICY "Allow individual update access (of Allow update for own notes)" ON "public"."task_notes"
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual delete access (of Allow delete for own notes)" ON "public"."task_notes";
CREATE POLICY "Allow individual delete access (of Allow delete for own notes)" ON "public"."task_notes"
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

-- profiles tabellen
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
CREATE POLICY "Users can update their own profile" ON "public"."profiles"
FOR UPDATE TO authenticated
USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow users to delete own profile" ON "public"."profiles";
CREATE POLICY "Allow users to delete own profile" ON "public"."profiles"
FOR DELETE TO authenticated
USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow admins update all, users their own" ON "public"."profiles";
CREATE POLICY "Allow admins update all, users their own" ON "public"."profiles"
FOR UPDATE TO authenticated
USING (
  (select auth.uid()) = id OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON "public"."profiles";
CREATE POLICY "Allow users to insert their own profile" ON "public"."profiles"
FOR INSERT TO authenticated
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles";
CREATE POLICY "profiles_select_policy" ON "public"."profiles"
FOR SELECT TO authenticated
USING (true);

-- saved_research tabellen
DROP POLICY IF EXISTS "Allow users to insert their own saved research" ON "public"."saved_research";
CREATE POLICY "Allow users to insert their own saved research" ON "public"."saved_research"
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow users to select their own saved research" ON "public"."saved_research";
CREATE POLICY "Allow users to select their own saved research" ON "public"."saved_research"
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "allow users to delete their own research" ON "public"."saved_research";
CREATE POLICY "allow users to delete their own research" ON "public"."saved_research"
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

-- role_permissions tabellen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access" ON "public"."role_permissions"';
        EXECUTE 'CREATE POLICY "Allow admin full access" ON "public"."role_permissions"
                 FOR ALL TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';

        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."role_permissions"';
        EXECUTE 'CREATE POLICY "Allow authenticated read access" ON "public"."role_permissions"
                 FOR SELECT TO authenticated
                 USING (true)';
    END IF;
END
$$;

-- feedback tabellen
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
END
$$;

-- customers tabellen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual user access to their own customer record" ON "public"."customers"';
        EXECUTE 'CREATE POLICY "Allow individual user access to their own customer record" ON "public"."customers"
                 FOR ALL TO authenticated
                 USING (user_id = (select auth.uid()))';
    END IF;
END
$$;

-- subscriptions tabellen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual user access to their own subscriptions" ON "public"."subscriptions"';
        EXECUTE 'CREATE POLICY "Allow individual user access to their own subscriptions" ON "public"."subscriptions"
                 FOR ALL TO authenticated
                 USING (customer.user_id = (select auth.uid()))';
    END IF;
END
$$;

-- pinned_messages tabellen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pinned_messages') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to select their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to select their own pinned messages" ON "public"."pinned_messages"
                 FOR SELECT TO authenticated
                 USING (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to insert their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to insert their own pinned messages" ON "public"."pinned_messages"
                 FOR INSERT TO authenticated
                 WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to update their own pinned messages" ON "public"."pinned_messages"
                 FOR UPDATE TO authenticated
                 USING (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to delete their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to delete their own pinned messages" ON "public"."pinned_messages"
                 FOR DELETE TO authenticated
                 USING (user_id = (select auth.uid()))';
    END IF;
END
$$;

-- theme_settings tabellen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'theme_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only viewable by admins" ON "public"."theme_settings"';
        EXECUTE 'CREATE POLICY "Theme settings only viewable by admins" ON "public"."theme_settings"
                 FOR SELECT TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';

        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only editable by admins" ON "public"."theme_settings"';
        EXECUTE 'CREATE POLICY "Theme settings only editable by admins" ON "public"."theme_settings"
                 FOR ALL TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END
$$;

-- user_api_logs tabellen
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
END
$$;

-- external_api_usage_logs tabellen
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
END
$$;

-- system_settings tabellen
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_view_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_view_system_settings" ON "public"."system_settings"
                 FOR SELECT TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';

        EXECUTE 'DROP POLICY IF EXISTS "admins_can_insert_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_insert_system_settings" ON "public"."system_settings"
                 FOR INSERT TO authenticated
                 WITH CHECK (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';

        EXECUTE 'DROP POLICY IF EXISTS "admins_can_update_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_update_system_settings" ON "public"."system_settings"
                 FOR UPDATE TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';

        EXECUTE 'DROP POLICY IF EXISTS "admins_can_delete_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_delete_system_settings" ON "public"."system_settings"
                 FOR DELETE TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END
$$;

-- Verbeter meerdere permissieve beleid op dezelfde tabellen/rollen/acties
-- Dit consolideert meerdere beleidregels in één beleid waar mogelijk

-- Consolideren van profiles beleid voor updates
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Allow admins update all, users their own" ON "public"."profiles";
CREATE POLICY "consolidated_update_policy" ON "public"."profiles"
FOR UPDATE TO authenticated
USING (
  (select auth.uid()) = id OR 
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = 'admin'
  )
);

-- Consolideren van role_permissions beleid voor SELECT
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access" ON "public"."role_permissions"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."role_permissions"';
        EXECUTE 'CREATE POLICY "consolidated_role_permissions_policy" ON "public"."role_permissions"
                 FOR SELECT TO authenticated
                 USING (true)';
        EXECUTE 'CREATE POLICY "admin_role_permissions_policy" ON "public"."role_permissions"
                 FOR INSERT TO authenticated
                 WITH CHECK (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
        EXECUTE 'CREATE POLICY "admin_role_permissions_update_policy" ON "public"."role_permissions"
                 FOR UPDATE TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
        EXECUTE 'CREATE POLICY "admin_role_permissions_delete_policy" ON "public"."role_permissions"
                 FOR DELETE TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END
$$;

-- Consolideren van theme_settings beleid
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'theme_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only viewable by admins" ON "public"."theme_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only editable by admins" ON "public"."theme_settings"';
        EXECUTE 'CREATE POLICY "theme_settings_admin_policy" ON "public"."theme_settings"
                 FOR ALL TO authenticated
                 USING (
                   EXISTS (
                     SELECT 1 FROM profiles
                     WHERE profiles.id = (select auth.uid())
                     AND profiles.role = ''admin''
                   )
                 )';
    END IF;
END
$$; 