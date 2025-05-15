-- @fileoverview Defines the get_theme_settings() function.
-- This migration creates a PostgreSQL function `public.get_theme_settings()` 
-- that retrieves all theme settings from the `public.theme_settings` table.
-- If the table does not exist, it returns a default set of theme configurations
-- for 'admin', 'paid', and 'free' roles as a fallback mechanism.

-- Function to retrieve all theme settings
CREATE OR REPLACE FUNCTION public.get_theme_settings()
RETURNS TABLE (
  role TEXT,
  available_themes TEXT[],
  default_theme TEXT
) AS $$
BEGIN
  -- First, check if the theme_settings table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'theme_settings'
  ) THEN
    -- If the table exists, retrieve the data
    RETURN QUERY
    SELECT ts.role, ts.available_themes, ts.default_theme
    FROM public.theme_settings ts;
  ELSE
    -- If the table does not exist, return default values
    RETURN QUERY
    SELECT 'admin'::TEXT, ARRAY['light', 'dark', 'custom-dark']::TEXT[], 'custom-dark'::TEXT
    UNION ALL
    SELECT 'paid'::TEXT, ARRAY['light', 'dark', 'custom-dark']::TEXT[], 'custom-dark'::TEXT
    UNION ALL
    SELECT 'free'::TEXT, ARRAY['custom-dark']::TEXT[], 'custom-dark'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 