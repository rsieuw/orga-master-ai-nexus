-- Add the last_viewed_at column to the tasks table
ALTER TABLE public.tasks
ADD COLUMN last_viewed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment explaining the purpose of this field
COMMENT ON COLUMN public.tasks.last_viewed_at IS 'Timestamp of when the task was last viewed. NULL means the task is still new.';