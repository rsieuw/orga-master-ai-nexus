-- Description: Optimaliseer Row Level Security policies door auth.<function>() aanroepen te vervangen met (select auth.<function>())
-- Gerelateerd aan Supabase linter waarschuwing auth_rls_initplan

-- Task table policies
DROP POLICY IF EXISTS "Allow individual delete access" ON "public"."tasks";
CREATE POLICY "Allow individual delete access" ON "public"."tasks"
FOR DELETE TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow individual insert access" ON "public"."tasks";
CREATE POLICY "Allow individual insert access" ON "public"."tasks"
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual select access" ON "public"."tasks";
CREATE POLICY "Allow individual select access" ON "public"."tasks"
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual update access" ON "public"."tasks";
CREATE POLICY "Allow individual update access" ON "public"."tasks"
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- Profile table policies
DROP POLICY IF EXISTS "Allow admins read all, users their own" ON "public"."profiles";
CREATE POLICY "Allow admins read all, users their own" ON "public"."profiles" 
FOR SELECT TO authenticated
USING (id = (select auth.uid()) OR (select auth.jwt() ->> 'role'::text) = 'admin'::text);

DROP POLICY IF EXISTS "Allow admins update all, users their own" ON "public"."profiles";
CREATE POLICY "Allow admins update all, users their own" ON "public"."profiles" 
FOR UPDATE TO authenticated
USING (id = (select auth.uid()) OR (select auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK (id = (select auth.uid()) OR (select auth.jwt() ->> 'role'::text) = 'admin'::text);

DROP POLICY IF EXISTS "Allow users to delete own profile" ON "public"."profiles";
CREATE POLICY "Allow users to delete own profile" ON "public"."profiles" 
FOR DELETE TO authenticated
USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow users to insert their own profile" ON "public"."profiles";
CREATE POLICY "Allow users to insert their own profile" ON "public"."profiles" 
FOR INSERT TO authenticated
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
CREATE POLICY "Users can update their own profile" ON "public"."profiles" 
FOR UPDATE TO authenticated
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles";
CREATE POLICY "Users can view their own profile" ON "public"."profiles" 
FOR SELECT TO authenticated
USING (id = (select auth.uid()));

-- Task notes table policies
DROP POLICY IF EXISTS "Allow individual delete access (of Allow delete for own notes)" ON "public"."task_notes";
CREATE POLICY "Allow individual delete access (of Allow delete for own notes)" ON "public"."task_notes"
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual read access (of Allow select for own notes)" ON "public"."task_notes";
CREATE POLICY "Allow individual read access (of Allow select for own notes)" ON "public"."task_notes"
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow individual update access (of Allow update for own notes)" ON "public"."task_notes";
CREATE POLICY "Allow individual update access (of Allow update for own notes)" ON "public"."task_notes"
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow insert for own notes" ON "public"."task_notes";
CREATE POLICY "Allow insert for own notes" ON "public"."task_notes"
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- External API usage logs
DROP POLICY IF EXISTS "Allow admins to read external_api_usage_logs" ON "public"."external_api_usage_logs";
CREATE POLICY "Allow admins to read external_api_usage_logs" ON "public"."external_api_usage_logs"
FOR SELECT TO authenticated
USING ((select auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Feedback table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feedback') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admin users to view all feedback" ON "public"."feedback"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to view their own feedback" ON "public"."feedback"';
        EXECUTE 'CREATE POLICY "feedback_select_policy" ON "public"."feedback"
                 FOR SELECT TO authenticated
                 USING (user_id = (select auth.uid()) OR (select auth.jwt() ->> ''role''::text) = ''admin''::text)';
    END IF;
END
$$;

-- Saved research table policies
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

-- Customers table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        -- Alleen uitvoeren als de customers tabel bestaat
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual user access to their own customer record" ON "public"."customers"';
        EXECUTE 'CREATE POLICY "Allow individual user select own customer record" ON "public"."customers"
                 FOR SELECT TO authenticated
                 USING (user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Allow individual user insert own customer record" ON "public"."customers"
                 FOR INSERT TO authenticated
                 WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Allow individual user update own customer record" ON "public"."customers"
                 FOR UPDATE TO authenticated
                 USING (user_id = (select auth.uid()))
                 WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Allow individual user delete own customer record" ON "public"."customers"
                 FOR DELETE TO authenticated
                 USING (user_id = (select auth.uid()))';
    END IF;
END
$$;

-- Subscriptions table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
        -- Alleen uitvoeren als de subscriptions tabel bestaat
        EXECUTE 'DROP POLICY IF EXISTS "Allow individual user access to their own subscriptions" ON "public"."subscriptions"';
        EXECUTE 'CREATE POLICY "Allow individual user select own subscriptions" ON "public"."subscriptions"
                 FOR SELECT TO authenticated
                 USING (customer.user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Allow individual user insert own subscriptions" ON "public"."subscriptions"
                 FOR INSERT TO authenticated
                 WITH CHECK (customer.user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Allow individual user update own subscriptions" ON "public"."subscriptions"
                 FOR UPDATE TO authenticated
                 USING (customer.user_id = (select auth.uid()))
                 WITH CHECK (customer.user_id = (select auth.uid()))';

        EXECUTE 'CREATE POLICY "Allow individual user delete own subscriptions" ON "public"."subscriptions"
                 FOR DELETE TO authenticated
                 USING (customer.user_id = (select auth.uid()))';
    END IF;
END
$$;

-- Pinned messages table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pinned_messages') THEN
        -- Alleen uitvoeren als de pinned_messages tabel bestaat
        EXECUTE 'DROP POLICY IF EXISTS "Allow users to delete their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to delete their own pinned messages" ON "public"."pinned_messages"
                 FOR DELETE TO authenticated
                 USING (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to insert their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to insert their own pinned messages" ON "public"."pinned_messages"
                 FOR INSERT TO authenticated
                 WITH CHECK (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to select their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to select their own pinned messages" ON "public"."pinned_messages"
                 FOR SELECT TO authenticated
                 USING (user_id = (select auth.uid()))';

        EXECUTE 'DROP POLICY IF EXISTS "Allow users to update their own pinned messages" ON "public"."pinned_messages"';
        EXECUTE 'CREATE POLICY "Allow users to update their own pinned messages" ON "public"."pinned_messages"
                 FOR UPDATE TO authenticated
                 USING (user_id = (select auth.uid()))
                 WITH CHECK (user_id = (select auth.uid()))';
    END IF;
END
$$;

-- Theme settings table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'theme_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only editable by admins" ON "public"."theme_settings"';
        EXECUTE 'CREATE POLICY "Theme settings only select by admins" ON "public"."theme_settings"
                 FOR SELECT TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'CREATE POLICY "Theme settings only insert by admins" ON "public"."theme_settings"
                 FOR INSERT TO authenticated
                 WITH CHECK ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'CREATE POLICY "Theme settings only update by admins" ON "public"."theme_settings"
                 FOR UPDATE TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)
                 WITH CHECK ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'CREATE POLICY "Theme settings only delete by admins" ON "public"."theme_settings"
                 FOR DELETE TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'DROP POLICY IF EXISTS "Theme settings only viewable by admins" ON "public"."theme_settings"';
    END IF;
END
$$;

-- Role permissions table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow admin full access" ON "public"."role_permissions"';
        EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."role_permissions"';
        EXECUTE 'DROP POLICY IF EXISTS "role_permissions_admin_policy" ON "public"."role_permissions"';
        EXECUTE 'CREATE POLICY "role_permissions_select_policy" ON "public"."role_permissions"
                 FOR SELECT
                 USING ((select auth.uid()) IS NOT NULL OR (select auth.jwt() ->> ''role''::text) = ''admin''::text)';
    END IF;
END
$$;

-- User API logs table policies
DROP POLICY IF EXISTS "Allow admins to read user_api_logs" ON "public"."user_api_logs";
CREATE POLICY "Allow admins to read user_api_logs" ON "public"."user_api_logs"
FOR SELECT TO authenticated
USING ((select auth.jwt() ->> 'role'::text) = 'admin'::text);

-- Chat messages table policies
DROP POLICY IF EXISTS "Allow users to delete own messages" ON "public"."chat_messages";
CREATE POLICY "Allow users to delete own messages" ON "public"."chat_messages"
FOR DELETE TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow users to insert messages for their own tasks" ON "public"."chat_messages";
CREATE POLICY "Allow users to insert messages for their own tasks" ON "public"."chat_messages"
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow users to select their own task messages" ON "public"."chat_messages";
CREATE POLICY "Allow users to select their own task messages" ON "public"."chat_messages"
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

-- System settings table policies
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_delete_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_delete_system_settings" ON "public"."system_settings"
                 FOR DELETE TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'DROP POLICY IF EXISTS "admins_can_insert_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_insert_system_settings" ON "public"."system_settings"
                 FOR INSERT TO authenticated
                 WITH CHECK ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'DROP POLICY IF EXISTS "admins_can_update_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_update_system_settings" ON "public"."system_settings"
                 FOR UPDATE TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)
                 WITH CHECK ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        EXECUTE 'DROP POLICY IF EXISTS "admins_can_view_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "admins_can_view_system_settings" ON "public"."system_settings"
                 FOR SELECT TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';

        -- Combineer dubbele permissive policies
        EXECUTE 'DROP POLICY IF EXISTS "Allow public read for system_settings" ON "public"."system_settings"';
        EXECUTE 'DROP POLICY IF EXISTS "admins_can_view_system_settings" ON "public"."system_settings"';
        EXECUTE 'CREATE POLICY "system_settings_select_policy" ON "public"."system_settings"
                 FOR SELECT TO authenticated
                 USING ((select auth.jwt() ->> ''role''::text) = ''admin''::text)';
    END IF;
END
$$;

-- Combineer dubbele permissive policies
-- Voor het profiles table
DROP POLICY IF EXISTS "Allow admins read all, users their own" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."profiles";
CREATE POLICY "profiles_select_policy" ON "public"."profiles"
FOR SELECT TO authenticated
USING (id = (select auth.uid()) OR (select auth.jwt() ->> 'role'::text) = 'admin'::text);

DROP POLICY IF EXISTS "Allow admins update all, users their own" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
CREATE POLICY "profiles_update_policy" ON "public"."profiles"
FOR UPDATE TO authenticated
USING (id = (select auth.uid()) OR (select auth.jwt() ->> 'role'::text) = 'admin'::text)
WITH CHECK (id = (select auth.uid()) OR (select auth.jwt() ->> 'role'::text) = 'admin'::text); 