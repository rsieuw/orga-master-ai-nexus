-- Fix voor beveiligingswaarschuwingen in functies
-- Deze migratie voegt expliciete search_path parameters toe aan alle functies om schema-hijacking aanvallen te voorkomen

-- 1. Fix realtime_monitor functies
CREATE OR REPLACE FUNCTION realtime_monitor.log_request(
  p_entity TEXT,
  p_duration_ms NUMERIC,
  p_result_count INTEGER,
  p_has_cursor BOOLEAN,
  p_cursor_value BIGINT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = realtime_monitor, pg_temp
AS $$
BEGIN
  INSERT INTO realtime_monitor.requests
    (entity, duration_ms, result_count, has_cursor, cursor_value)
  VALUES
    (p_entity, p_duration_ms, p_result_count, p_has_cursor, p_cursor_value);
END;
$$;

CREATE OR REPLACE FUNCTION realtime_monitor.get_entity_stats(
  p_since TIMESTAMPTZ DEFAULT (now() - interval '24 hours')
)
RETURNS TABLE (
  entity TEXT,
  avg_duration_ms NUMERIC,
  max_duration_ms NUMERIC,
  total_requests BIGINT,
  avg_results INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = realtime_monitor, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    entity,
    AVG(duration_ms)::NUMERIC AS avg_duration_ms,
    MAX(duration_ms)::NUMERIC AS max_duration_ms,
    COUNT(*)::BIGINT AS total_requests,
    AVG(result_count)::INTEGER AS avg_results
  FROM
    realtime_monitor.requests
  WHERE
    log_timestamp >= p_since
  GROUP BY
    entity
  ORDER BY
    avg_duration_ms DESC;
END;
$$;

CREATE OR REPLACE FUNCTION realtime_monitor.cleanup_old_logs(
  p_days INTEGER DEFAULT 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = realtime_monitor, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM realtime_monitor.requests
  WHERE log_timestamp < now() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION realtime_monitor.report_slow_requests(
  p_threshold_ms NUMERIC DEFAULT 100,
  p_limit INTEGER DEFAULT 100,
  p_since TIMESTAMPTZ DEFAULT (now() - interval '24 hours')
)
RETURNS TABLE (
  log_timestamp TIMESTAMPTZ,
  entity TEXT,
  duration_ms NUMERIC,
  result_count INTEGER,
  has_cursor BOOLEAN,
  cursor_value BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = realtime_monitor, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.log_timestamp,
    r.entity,
    r.duration_ms,
    r.result_count,
    r.has_cursor,
    r.cursor_value
  FROM
    realtime_monitor.requests r
  WHERE
    r.log_timestamp >= p_since
    AND r.duration_ms >= p_threshold_ms
  ORDER BY
    r.duration_ms DESC
  LIMIT p_limit;
END;
$$;

-- 2. Fix api functies
CREATE OR REPLACE FUNCTION api.refresh_table_definitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW api.table_definitions;
END;
$$;

CREATE OR REPLACE FUNCTION api.refresh_column_definitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW api.column_definitions;
END;
$$;

CREATE OR REPLACE FUNCTION api.refresh_all_definitions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api, pg_temp
AS $$
BEGIN
  PERFORM api.refresh_table_definitions();
  PERFORM api.refresh_column_definitions();
END;
$$;

-- 3. Fix api_monitoring functies
CREATE OR REPLACE FUNCTION api_monitoring.capture_query_stats()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api_monitoring, pg_temp
AS $$
DECLARE
    inserted_count INTEGER;
    rec RECORD;
BEGIN
    -- Zorg ervoor dat pg_stat_statements is geïnstalleerd
    BEGIN
        -- Controleer of extension bestaat
        PERFORM 1 FROM pg_extension WHERE extname = 'pg_stat_statements';
        EXCEPTION WHEN undefined_table THEN
        -- Installeer de extension als deze niet bestaat
        CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    END;

    -- Voeg statistieken toe aan de monitoringtabel
    WITH stmt_stats AS (
        SELECT 
            rolname,
            query,
            calls,
            CASE WHEN EXISTS (SELECT FROM information_schema.columns 
                             WHERE table_name = 'pg_stat_statements' 
                             AND column_name = 'total_time') 
                 THEN (SELECT total_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
                 ELSE (SELECT total_exec_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
            END AS total_exec_time,
            CASE WHEN EXISTS (SELECT FROM information_schema.columns 
                             WHERE table_name = 'pg_stat_statements' 
                             AND column_name = 'mean_time') 
                 THEN (SELECT mean_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
                 ELSE (SELECT mean_exec_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
            END AS mean_exec_time,
            CASE WHEN EXISTS (SELECT FROM information_schema.columns 
                             WHERE table_name = 'pg_stat_statements' 
                             AND column_name = 'max_time') 
                 THEN (SELECT max_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
                 ELSE (SELECT max_exec_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
            END AS max_exec_time,
            CASE WHEN EXISTS (SELECT FROM information_schema.columns 
                             WHERE table_name = 'pg_stat_statements' 
                             AND column_name = 'stddev_time') 
                 THEN (SELECT stddev_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
                 ELSE (SELECT stddev_exec_time FROM pg_stat_statements t WHERE t.userid = pss.userid AND t.queryid = pss.queryid LIMIT 1) 
            END AS stddev_exec_time,
            rows / NULLIF(calls, 0) AS rows_per_call
        FROM 
            pg_stat_statements pss
            JOIN pg_roles pr ON pr.oid = pss.userid
        WHERE 
            calls > 5 -- Alleen relevante queries
    )
    INSERT INTO api_monitoring.query_stats 
        (rolname, query_text, calls, total_exec_time, mean_exec_time, max_exec_time, stddev_exec_time, rows_per_call)
    SELECT 
        rolname,
        query,
        calls,
        COALESCE(total_exec_time, 0) AS total_exec_time,
        COALESCE(mean_exec_time, 0) AS mean_exec_time,
        COALESCE(max_exec_time, 0) AS max_exec_time,
        COALESCE(stddev_exec_time, 0) AS stddev_exec_time,
        rows_per_call
    FROM 
        stmt_stats
    ORDER BY 
        total_exec_time DESC NULLS LAST
    LIMIT 100;  -- Beperk tot de top 100 queries
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION api_monitoring.report_top_queries(
    p_since TIMESTAMPTZ DEFAULT (now() - interval '24 hours'),
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    rolname TEXT,
    query_text TEXT,
    avg_calls NUMERIC,
    avg_total_time NUMERIC,
    avg_mean_time NUMERIC,
    max_time NUMERIC,
    avg_rows NUMERIC,
    samples INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = api_monitoring, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qs.rolname,
        qs.query_text,
        AVG(qs.calls)::NUMERIC AS avg_calls,
        AVG(qs.total_exec_time)::NUMERIC AS avg_total_time,
        AVG(qs.mean_exec_time)::NUMERIC AS avg_mean_time,
        MAX(qs.max_exec_time)::NUMERIC AS max_time,
        AVG(qs.rows_per_call)::NUMERIC AS avg_rows,
        COUNT(*)::INTEGER AS samples
    FROM 
        api_monitoring.query_stats qs
    WHERE 
        qs.capture_time >= p_since
    GROUP BY 
        qs.rolname, qs.query_text
    ORDER BY 
        avg_total_time DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION api_monitoring.cleanup_old_stats(
    p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = api_monitoring, pg_temp
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_monitoring.query_stats
    WHERE capture_time < now() - (p_retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Update documentatie en opmerkingen
COMMENT ON FUNCTION realtime_monitor.log_request IS 'Functie om realtime verzoeken te loggen. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION realtime_monitor.get_entity_stats IS 'Functie om prestatie statistieken per entiteit op te vragen. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION realtime_monitor.cleanup_old_logs IS 'Functie om oude logs te verwijderen. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION realtime_monitor.report_slow_requests IS 'Functie om trage requests te rapporteren. Heeft een expliciete search_path voor veiligheid.';

COMMENT ON FUNCTION api.refresh_table_definitions IS 'Functie om de table_definitions weergave te vernieuwen. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION api.refresh_column_definitions IS 'Functie om de column_definitions weergave te vernieuwen. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION api.refresh_all_definitions IS 'Functie om alle definitie-weergaves te vernieuwen. Heeft een expliciete search_path voor veiligheid.';

COMMENT ON FUNCTION api_monitoring.capture_query_stats IS 'Functie om query statistieken te verzamelen. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION api_monitoring.report_top_queries IS 'Functie om top queries te rapporteren. Heeft een expliciete search_path voor veiligheid.';
COMMENT ON FUNCTION api_monitoring.cleanup_old_stats IS 'Functie om oude statistieken op te schonen. Heeft een expliciete search_path voor veiligheid.'; 