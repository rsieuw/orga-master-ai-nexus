-- Add emoji field to tasks table
ALTER TABLE tasks ADD COLUMN emoji TEXT;

-- Enable RLS on the new column
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
 
-- Comment on emoji field for documentation
COMMENT ON COLUMN tasks.emoji IS 'Emoji character that represents the task'; 