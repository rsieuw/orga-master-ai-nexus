-- Create system_settings table for storing global system configuration
CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "setting_name" TEXT NOT NULL UNIQUE,
    "setting_value" JSONB NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Add comment to the table
COMMENT ON TABLE "public"."system_settings" IS 'Table for storing global system configuration settings';

-- Create an index on the setting_name column for faster lookups
CREATE INDEX IF NOT EXISTS "idx_system_settings_setting_name" ON "public"."system_settings" ("setting_name");

-- Row-level security policies for system_settings table
ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view system settings
CREATE POLICY "admins_can_view_system_settings"
ON "public"."system_settings"
FOR SELECT
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Policy to allow admins to insert system settings
CREATE POLICY "admins_can_insert_system_settings"
ON "public"."system_settings"
FOR INSERT
TO authenticated
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Policy to allow admins to update system settings
CREATE POLICY "admins_can_update_system_settings"
ON "public"."system_settings"
FOR UPDATE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Policy to allow admins to delete system settings
CREATE POLICY "admins_can_delete_system_settings"
ON "public"."system_settings"
FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Insert default system settings for AI generation limits
INSERT INTO "public"."system_settings" (setting_name, setting_value)
VALUES 
('ai_generation_limits', '{"free_user_limit": 1, "paid_user_limit": 3}'::jsonb)
ON CONFLICT (setting_name) DO NOTHING; 