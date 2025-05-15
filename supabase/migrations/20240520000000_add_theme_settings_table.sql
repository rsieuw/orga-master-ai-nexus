-- @fileoverview Creates the theme_settings table, related functions, and RLS policies.
-- This migration sets up the `public.theme_settings` table to manage theme configurations per user role.
-- It includes:
-- - The table structure with columns for role, available_themes, and default_theme.
-- - Initial records for 'admin', 'paid', and 'free' roles.
-- - Row Level Security policies restricting access to administrators.
-- - Helper functions:
--   - `get_available_themes_for_role(p_role TEXT)`: Fetches available themes for a given role.
--   - `get_default_theme_for_role(p_role TEXT)`: Fetches the default theme for a given role.
--   - `update_theme_settings(p_role TEXT, p_available_themes TEXT[], p_default_theme TEXT)`: Updates theme settings for a role.

-- Create theme_settings table
CREATE TABLE public.theme_settings (
  role TEXT PRIMARY KEY, -- e.g., 'admin', 'paid', 'free'
  available_themes TEXT[] DEFAULT ARRAY['custom-dark']::TEXT[], -- Default: only 'custom-dark'
  default_theme TEXT DEFAULT 'custom-dark', -- Default theme for new users with this role
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Initial records for all roles
INSERT INTO public.theme_settings (role, available_themes, default_theme)
VALUES 
  ('admin', ARRAY['light', 'dark', 'custom-dark']::TEXT[], 'custom-dark'),
  ('paid', ARRAY['light', 'dark', 'custom-dark']::TEXT[], 'custom-dark'),
  ('free', ARRAY['custom-dark']::TEXT[], 'custom-dark');

-- Row Level Security (only admins can edit this table)
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and edit this table
CREATE POLICY "Theme settings only viewable by admins" ON public.theme_settings
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Theme settings only editable by admins" ON public.theme_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Function to get available themes for a role
CREATE OR REPLACE FUNCTION public.get_available_themes_for_role(p_role TEXT)
RETURNS TEXT[] AS $$
DECLARE
  themes TEXT[];
BEGIN
  SELECT available_themes INTO themes 
  FROM public.theme_settings 
  WHERE role = p_role;
  
  -- Fallback to 'custom-dark' if role does not exist or has no themes
  IF themes IS NULL OR array_length(themes, 1) = 0 THEN
    themes := ARRAY['custom-dark']::TEXT[];
  END IF;
  
  RETURN themes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the default theme for a role
CREATE OR REPLACE FUNCTION public.get_default_theme_for_role(p_role TEXT)
RETURNS TEXT AS $$
DECLARE
  theme TEXT;
BEGIN
  SELECT default_theme INTO theme 
  FROM public.theme_settings 
  WHERE role = p_role;
  
  -- Fallback to 'custom-dark' if role does not exist or has no default theme
  IF theme IS NULL THEN
    theme := 'custom-dark';
  END IF;
  
  RETURN theme;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update the theme_settings table
CREATE OR REPLACE FUNCTION public.update_theme_settings(
  p_role TEXT,
  p_available_themes TEXT[],
  p_default_theme TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the role exists
  IF NOT EXISTS (SELECT 1 FROM public.theme_settings WHERE role = p_role) THEN
    RETURN FALSE;
  END IF;

  -- Check if the default theme is in the available themes
  IF NOT p_default_theme = ANY(p_available_themes) THEN
    RAISE EXCEPTION 'Default theme must be in the available themes list';
  END IF;

  -- Update the settings
  UPDATE public.theme_settings
  SET 
    available_themes = p_available_themes,
    default_theme = p_default_theme,
    updated_at = NOW()
  WHERE role = p_role;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 