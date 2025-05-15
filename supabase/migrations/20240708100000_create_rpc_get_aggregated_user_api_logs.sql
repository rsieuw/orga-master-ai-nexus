CREATE OR REPLACE FUNCTION get_aggregated_user_api_logs()
RETURNS TABLE (
    user_id       uuid,
    function_name text,
    call_count    bigint,
    last_called_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
      ual.user_id,
      ual.function_name,
      COUNT(*) AS call_count,
      MAX(ual.called_at) AS last_called_at
  FROM
      public.user_api_logs ual
  GROUP BY
      ual.user_id,
      ual.function_name
  ORDER BY
      last_called_at DESC;
$$; 