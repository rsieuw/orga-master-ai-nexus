-- Add is_favorite column to tasks table
ALTER TABLE public.tasks
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;

-- Optional: Add an index for faster querying of favorite tasks
CREATE INDEX idx_tasks_is_favorite ON public.tasks(is_favorite);

-- Update existing tasks to set is_favorite to false if it's null (shouldn't be necessary with default)
-- UPDATE public.tasks
-- SET is_favorite = FALSE
-- WHERE is_favorite IS NULL; 