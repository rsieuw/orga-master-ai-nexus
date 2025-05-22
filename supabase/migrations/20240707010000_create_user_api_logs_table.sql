CREATE TABLE public.user_api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    function_name TEXT NOT NULL,
    called_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    metadata JSONB
);

COMMENT ON TABLE public.user_api_logs IS 'Logs each API call made by a user to a Supabase function.';
COMMENT ON COLUMN public.user_api_logs.id IS 'Unique identifier for the log entry.';
COMMENT ON COLUMN public.user_api_logs.user_id IS 'The ID of the user who made the API call.';
COMMENT ON COLUMN public.user_api_logs.function_name IS 'Name of the Supabase Edge Function that was called.';
COMMENT ON COLUMN public.user_api_logs.called_at IS 'Timestamp of when the API call was made.';
COMMENT ON COLUMN public.user_api_logs.metadata IS 'Optional metadata about the API call (e.g., parameters, success status).';

-- Optional: Index for querying by user_id and function_name
CREATE INDEX idx_user_api_logs_user_id_function_name ON public.user_api_logs(user_id, function_name);
CREATE INDEX idx_user_api_logs_called_at ON public.user_api_logs(called_at DESC);

-- Voeg role toe aan profiles tabel als deze nog niet bestaat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.user_api_logs ENABLE ROW LEVEL SECURITY;

-- Policies:
-- Admins can see all logs
CREATE POLICY "Allow admins to read all user_api_logs"
ON public.user_api_logs
FOR SELECT
TO authenticated
USING (
  COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'user') = 'admin'
);

-- Functions can insert into this table (service_role bypasses RLS)
-- No specific insert policy needed if inserts are done by Edge Functions using service_role key. 