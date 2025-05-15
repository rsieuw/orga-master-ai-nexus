-- @fileoverview Adds an emoji column to the public.tasks table.
-- This migration allows associating an emoji character with each task for visual representation.

-- Add emoji field to tasks table
ALTER TABLE tasks ADD COLUMN emoji TEXT;

-- Enable RLS on the new column
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
 
-- Comment on emoji field for documentation
COMMENT ON COLUMN tasks.emoji IS 'Emoji character that represents the task'; 