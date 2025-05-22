-- Optimalisatie voor metadata/reflection queries
-- Deze migratie richt zich op het verbeteren van queries die tabeldefinities en metadata ophalen

-- 0. Creëer het API schema indien het niet bestaat
CREATE SCHEMA IF NOT EXISTS api;

-- 1. Creëer een gematerialiseerde weergave om veelgebruikte metadata te cachen
CREATE MATERIALIZED VIEW IF NOT EXISTS api.table_definitions AS
WITH table_defs AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.oid::int8 AS table_id,
    pg_catalog.obj_description(c.oid, 'pg_class') as description,
    c.relkind AS kind
  FROM
    pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE
    c.relkind IN ('r', 'v', 'm', 'f', 'p') -- reguliere tabellen, views, materialized views, foreign tables, partitioned tables
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname !~ '^pg_toast'
)
SELECT 
  *,
  CASE 
    WHEN kind = 'r' THEN 'TABLE'
    WHEN kind = 'v' THEN 'VIEW'
    WHEN kind = 'm' THEN 'MATERIALIZED_VIEW'
    WHEN kind = 'f' THEN 'FOREIGN_TABLE'
    WHEN kind = 'p' THEN 'PARTITIONED_TABLE'
  END AS object_type
FROM table_defs
ORDER BY schema_name, table_name;

-- 2. Creëer indexen op de gematerialiseerde weergave voor snelle lookups
CREATE UNIQUE INDEX IF NOT EXISTS table_definitions_pkey ON api.table_definitions (schema_name, table_name);
CREATE INDEX IF NOT EXISTS table_definitions_id_idx ON api.table_definitions (table_id);

-- 3. Creëer een functie om de weergave te vernieuwen
CREATE OR REPLACE FUNCTION api.refresh_table_definitions()
RETURNS void AS
$$
BEGIN
  REFRESH MATERIALIZED VIEW api.table_definitions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION api.refresh_table_definitions() IS
'Functie om de table_definitions weergave te vernieuwen. 
Best om dit uit te voeren na DDL-veranderingen of op een regelmatige basis.';

-- 4. Creëer een aparte weergave voor kolomdefinities
CREATE MATERIALIZED VIEW IF NOT EXISTS api.column_definitions AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  a.attnotnull AS is_not_null,
  pg_catalog.col_description(c.oid, a.attnum) AS description,
  CASE WHEN 
    EXISTS (
      SELECT 1 FROM pg_constraint con 
      WHERE con.conrelid = c.oid 
        AND con.conkey[1] = a.attnum 
        AND con.contype = 'p'
    ) 
  THEN true ELSE false END AS is_primary_key
FROM
  pg_catalog.pg_attribute a
  JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE
  a.attnum > 0
  AND NOT a.attisdropped
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  AND n.nspname !~ '^pg_toast';

-- 5. Creëer indexen op de kolomdefinities
CREATE UNIQUE INDEX IF NOT EXISTS column_definitions_pkey ON api.column_definitions (schema_name, table_name, column_name);

-- 6. Creëer een functie om de kolomweergave te vernieuwen
CREATE OR REPLACE FUNCTION api.refresh_column_definitions()
RETURNS void AS
$$
BEGIN
  REFRESH MATERIALIZED VIEW api.column_definitions;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION api.refresh_column_definitions() IS
'Functie om de column_definitions weergave te vernieuwen.
Best om dit uit te voeren na DDL-veranderingen of op een regelmatige basis.';

-- 7. Creëer een functie om beide weergaves te vernieuwen
CREATE OR REPLACE FUNCTION api.refresh_all_definitions()
RETURNS void AS
$$
BEGIN
  PERFORM api.refresh_table_definitions();
  PERFORM api.refresh_column_definitions();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION api.refresh_all_definitions() IS
'Functie om alle definitie-weergaves te vernieuwen.
Best om dit uit te voeren na DDL-veranderingen of op een regelmatige basis.';

-- Voer de initiële vernieuwing uit
SELECT api.refresh_all_definitions(); 