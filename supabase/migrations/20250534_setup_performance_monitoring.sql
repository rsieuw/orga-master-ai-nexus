-- Opzetten van een prestatiemonitoringsysteem
-- Deze migratie installeert een systeem om de prestaties van de database te volgen en analyseren

-- 0. Creëer het API schema indien het niet bestaat
CREATE SCHEMA IF NOT EXISTS api;

-- 1. Creëer schema voor prestatiemonitoring
CREATE SCHEMA IF NOT EXISTS api_monitoring;

-- 2. Maak een tabel voor het opslaan van prestatiemetingen
CREATE TABLE IF NOT EXISTS api_monitoring.query_stats (
    id BIGSERIAL PRIMARY KEY,
    capture_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    rolname TEXT,
    query_text TEXT,
    calls BIGINT,
    total_exec_time NUMERIC,
    mean_exec_time NUMERIC,
    max_exec_time NUMERIC,
    stddev_exec_time NUMERIC,
    rows_per_call NUMERIC
);

CREATE INDEX IF NOT EXISTS monitoring_query_stats_capture_time_idx ON api_monitoring.query_stats (capture_time);
CREATE INDEX IF NOT EXISTS monitoring_query_stats_mean_time_idx ON api_monitoring.query_stats (mean_exec_time DESC);

-- 3. Maak een functie die prestatiegegevens verzamelt van pg_stat_statements
CREATE OR REPLACE FUNCTION api_monitoring.capture_query_stats()
RETURNS INTEGER AS $$
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
    
    -- Reset de statistieken na het verzamelen om een nieuwe meting te starten
    -- PERFORM pg_stat_statements_reset();
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Maak een functie om prestatierapportages te genereren
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
) AS $$
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
$$ LANGUAGE plpgsql;

-- 5. Maak een functie voor het opschonen van oude gegevens
CREATE OR REPLACE FUNCTION api_monitoring.cleanup_old_stats(
    p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_monitoring.query_stats
    WHERE capture_time < now() - (p_retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Stel documentatie in voor gebruikers
COMMENT ON TABLE api_monitoring.query_stats IS 'Verzamelde prestatiemetingen van queries';
COMMENT ON FUNCTION api_monitoring.capture_query_stats() IS 'Verzamelt huidige query statistieken van pg_stat_statements';
COMMENT ON FUNCTION api_monitoring.report_top_queries(TIMESTAMPTZ, INTEGER) IS 'Genereert een rapport van de meest intensieve queries';
COMMENT ON FUNCTION api_monitoring.cleanup_old_stats(INTEGER) IS 'Verwijdert verouderde statistieken om ruimte te besparen';

-- 7. Voer een eerste dataverzameling uit
-- SELECT api_monitoring.capture_query_stats();

-- 8. Instructies voor regelmatig gebruik
COMMENT ON TABLE api_monitoring.query_stats IS 'Tabel voor het opslaan van databaseprestatiemetingen. 
Om regelmatig statistieken te verzamelen, stel een cron job in om de volgende SQL uit te voeren:
SELECT api_monitoring.capture_query_stats();

Voor een rapport van de zwaarste queries:
SELECT * FROM api_monitoring.report_top_queries();

Om oude statistieken op te schonen:
SELECT api_monitoring.cleanup_old_stats();' 