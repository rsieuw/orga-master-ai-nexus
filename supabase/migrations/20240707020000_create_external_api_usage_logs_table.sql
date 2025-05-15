CREATE TABLE public.external_api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Wie heeft de actie getriggerd? Kan NULL zijn voor systeemcalls.
    task_id UUID NULL, -- Optioneel: aan welke taak is dit gerelateerd?
    service_name TEXT NOT NULL, -- 'OpenAI', 'PerplexityAI', etc.
    function_name TEXT NOT NULL, -- Welke Supabase Edge Function maakte de call?
    tokens_prompt INTEGER, -- Tokens gebruikt voor de prompt
    tokens_completion INTEGER, -- Tokens gebruikt voor de completion
    tokens_total INTEGER, -- Totaal tokens
    cost DECIMAL(10, 6), -- Geschatte kosten
    called_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    metadata JSONB -- Overige info, bv. model, success status, error
);

COMMENT ON TABLE public.external_api_usage_logs IS 'Logs usage of external AI APIs like OpenAI, PerplexityAI.';
COMMENT ON COLUMN public.external_api_usage_logs.user_id IS 'The user who initiated the action leading to this API call.';
COMMENT ON COLUMN public.external_api_usage_logs.task_id IS 'The task associated with this API call, if any.';
COMMENT ON COLUMN public.external_api_usage_logs.service_name IS 'Name of the external service called (e.g., OpenAI, PerplexityAI).';
COMMENT ON COLUMN public.external_api_usage_logs.function_name IS 'The Supabase Edge Function that made the external call.';
COMMENT ON COLUMN public.external_api_usage_logs.tokens_prompt IS 'Number of tokens used for the prompt.';
COMMENT ON COLUMN public.external_api_usage_logs.tokens_completion IS 'Number of tokens used for the completion.';
COMMENT ON COLUMN public.external_api_usage_logs.tokens_total IS 'Total number of tokens used (prompt + completion).';
COMMENT ON COLUMN public.external_api_usage_logs.cost IS 'Estimated cost of the API call, if available.';
COMMENT ON COLUMN public.external_api_usage_logs.called_at IS 'Timestamp of when the external API call was made.';
COMMENT ON COLUMN public.external_api_usage_logs.metadata IS 'Additional metadata (e.g., model used, success status, error message if any).';

CREATE INDEX idx_external_api_logs_user_id ON public.external_api_usage_logs(user_id);
CREATE INDEX idx_external_api_logs_service_name ON public.external_api_usage_logs(service_name);
CREATE INDEX idx_external_api_logs_function_name ON public.external_api_usage_logs(function_name);
CREATE INDEX idx_external_api_logs_called_at ON public.external_api_usage_logs(called_at DESC);

ALTER TABLE public.external_api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to read all external_api_usage_logs"
ON public.external_api_usage_logs
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
); 