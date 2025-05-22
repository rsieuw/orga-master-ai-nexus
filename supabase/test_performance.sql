-- Prestatie test en monitor script

-- 1. Realtime monitoring
SELECT realtime_monitor.log_request(
  'users', -- entity
  3.72, -- gemiddelde duur
  5, -- aantal resultaten
  true, -- heeft cursor
  12345 -- cursor waarde
);

SELECT * FROM realtime_monitor.get_entity_stats();

-- 2. Metadata monitoring via materialized views
SELECT COUNT(*) FROM api.table_definitions;
SELECT COUNT(*) FROM api.column_definitions;

-- 3. Prestatiemonitoring
SELECT api_monitoring.capture_query_stats();
SELECT * FROM api_monitoring.report_top_queries() LIMIT 5;

-- 4. Realtime queries rapport
SELECT * FROM realtime_monitor.report_slow_requests(1.0) LIMIT 3;

-- 5. Vernieuwen van materialized views
SELECT api.refresh_all_definitions(); 