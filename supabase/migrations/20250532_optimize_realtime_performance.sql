-- Optimalisatie van realtime queries
-- Deze migratie richt zich op het monitoren en analyseren van realtime performance

-- Creëer een schema voor realtime monitoring
CREATE SCHEMA IF NOT EXISTS realtime_monitor;

-- Maak een tabel voor het bijhouden van verzoeken naar realtime functionaliteit
CREATE TABLE IF NOT EXISTS realtime_monitor.requests (
  id BIGSERIAL PRIMARY KEY,
  log_timestamp TIMESTAMPTZ DEFAULT now(),
  entity TEXT,
  duration_ms NUMERIC,
  result_count INTEGER,
  has_cursor BOOLEAN,
  cursor_value BIGINT
);

-- Indexen voor snelle query analyse
CREATE INDEX IF NOT EXISTS requests_entity_idx ON realtime_monitor.requests(entity);
CREATE INDEX IF NOT EXISTS requests_timestamp_idx ON realtime_monitor.requests(log_timestamp);
CREATE INDEX IF NOT EXISTS requests_duration_idx ON realtime_monitor.requests(duration_ms DESC);

-- Functie om realtime verzoeken te loggen
CREATE OR REPLACE FUNCTION realtime_monitor.log_request(
  p_entity TEXT,
  p_duration_ms NUMERIC,
  p_result_count INTEGER,
  p_has_cursor BOOLEAN,
  p_cursor_value BIGINT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO realtime_monitor.requests
    (entity, duration_ms, result_count, has_cursor, cursor_value)
  VALUES
    (p_entity, p_duration_ms, p_result_count, p_has_cursor, p_cursor_value);
END;
$$ LANGUAGE plpgsql;

-- Functie om prestatie statistieken op te vragen
CREATE OR REPLACE FUNCTION realtime_monitor.get_entity_stats(
  p_since TIMESTAMPTZ DEFAULT (now() - interval '24 hours')
)
RETURNS TABLE (
  entity TEXT,
  avg_duration_ms NUMERIC,
  max_duration_ms NUMERIC,
  total_requests BIGINT,
  avg_results INTEGER
) AS $$
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
$$ LANGUAGE plpgsql;

-- Functie om oude logs te verwijderen
CREATE OR REPLACE FUNCTION realtime_monitor.cleanup_old_logs(
  p_days INTEGER DEFAULT 7
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM realtime_monitor.requests
  WHERE log_timestamp < now() - (p_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Functie om een gedetailleerd rapport te produceren voor slow requests
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
) AS $$
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
$$ LANGUAGE plpgsql; 