-- @fileoverview Adds a last_viewed_at column to the public.tasks table.
-- This migration allows tracking when a task was last viewed by a user.

-- Maak eerst de tasks tabel als deze nog niet bestaat
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' NOT NULL,
    priority TEXT DEFAULT 'medium' NOT NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Voeg RLS-beleidsregels toe als ze nog niet bestaan (dit kan geen kwaad om dubbel uit te voeren)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can CRUD their own tasks'
    ) THEN
        CREATE POLICY "Users can CRUD their own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add the last_viewed_at column to the tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment explaining the purpose of this field
COMMENT ON COLUMN public.tasks.last_viewed_at IS 'Timestamp of when the task was last viewed. NULL means the task is still new.';