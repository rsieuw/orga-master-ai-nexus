-- @fileoverview Adds a research_model_preference column to the public.profiles table.
-- This migration allows users to store their preferred AI model for the 'Deep Research' feature.

-- Add research_model_preference column to profiles table
-- This column stores the user's preferred AI model for the 'Deep Research' feature.

ALTER TABLE public.profiles
ADD COLUMN research_model_preference TEXT NULL;

COMMENT ON COLUMN public.profiles.research_model_preference IS 'User preference for the AI model used in the Deep Research feature.'; 