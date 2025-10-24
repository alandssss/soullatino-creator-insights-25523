-- ============================================
-- QUERIES DE MONITOREO PARA SUPABASE ANALYTICS
-- ============================================
-- Usar en Supabase Dashboard -> Analytics o en dashboards externos

-- ============================================
-- 1. LATENCIA P95 DE EDGE FUNCTIONS (ÚLTIMAS 24H)
-- ============================================
SELECT 
  metadata->>'function_id' as function_id,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) as p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) as p95_ms,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) as p99_ms,
  COUNT(*) as total_requests
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'execution_time_ms' IS NOT NULL
GROUP BY 1
ORDER BY 3 DESC;

-- Objetivo: single <2.5s (2500ms), batch <12s (12000ms), predictive <3.5s (3500ms)

-- ============================================
-- 2. RATE-LIMIT EFFECTIVENESS (429s POR FUNCIÓN - ÚLTIMA HORA)
-- ============================================
SELECT 
  metadata->>'function_id' as function_id,
  COUNT(*) FILTER (WHERE (response->>'status_code')::int = 429) as rate_limited_count,
  COUNT(*) as total_requests,
  ROUND(100.0 * COUNT(*) FILTER (WHERE (response->>'status_code')::int = 429) / NULLIF(COUNT(*), 0), 2) as rate_limit_pct
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY 1
HAVING COUNT(*) FILTER (WHERE (response->>'status_code')::int = 429) > 0
ORDER BY 2 DESC;

-- Objetivo: >0 (indica que rate-limit está funcionando), pero <10% del total

-- ============================================
-- 3. ERRORES 5XX POR FUNCIÓN (ÚLTIMAS 24H)
-- ============================================
SELECT 
  metadata->>'function_id' as function_id,
  COUNT(*) FILTER (WHERE (response->>'status_code')::int >= 500) as errors_5xx,
  COUNT(*) as total_requests,
  ROUND(100.0 * COUNT(*) FILTER (WHERE (response->>'status_code')::int >= 500) / NULLIF(COUNT(*), 0), 2) as error_rate_pct
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY 1
HAVING COUNT(*) FILTER (WHERE (response->>'status_code')::int >= 500) > 0
ORDER BY 2 DESC;

-- Objetivo: <0.5% error rate

-- ============================================
-- 4. DISTRIBUCIÓN DE STATUS CODES (ÚLTIMAS 24H)
-- ============================================
SELECT 
  (response->>'status_code')::int as status_code,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND response->>'status_code' IS NOT NULL
GROUP BY 1
ORDER BY 2 DESC;

-- ============================================
-- 5. LATENCIA POR MODE (calculate-bonificaciones-unified)
-- ============================================
SELECT 
  DATE_TRUNC('hour', timestamp) AS hour,
  request->'body'->>'mode' AS mode,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) AS p95_ms,
  COUNT(*) as requests
FROM function_edge_logs
WHERE metadata->>'function_id' = 'calculate-bonificaciones-unified'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- Objetivo: mode=single P95<2500ms, mode=batch P95<12000ms, mode=predictive P95<3500ms

-- ============================================
-- 6. FUNCIONES MÁS LENTAS (P99 - ÚLTIMAS 24H)
-- ============================================
SELECT 
  metadata->>'function_id' as function_id,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) as p99_ms,
  COUNT(*) as total_calls
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'execution_time_ms' IS NOT NULL
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10;

-- ============================================
-- 7. RATE-LIMIT FALSOS POSITIVOS (USUARIOS LEGÍTIMOS BLOQUEADOS)
-- ============================================
-- Detectar IPs con muchos 429s que podrían ser legítimos
SELECT 
  request->'headers'->>'x-forwarded-for' AS ip,
  COUNT(*) FILTER (WHERE (response->>'status_code')::int = 429) as total_429,
  COUNT(*) FILTER (WHERE (response->>'status_code')::int = 200) as total_200,
  COUNT(*) as total_requests
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY 1
HAVING COUNT(*) FILTER (WHERE (response->>'status_code')::int = 429) > 50
ORDER BY 2 DESC;

-- Objetivo: Identificar IPs corporativas o servicios legítimos para whitelist

-- ============================================
-- 8. COLD STARTS (FUNCIONES CON LATENCIA >5s)
-- ============================================
SELECT 
  metadata->>'function_id' as function_id,
  COUNT(*) FILTER (WHERE (metadata->>'execution_time_ms')::int > 5000) as cold_starts,
  COUNT(*) as total_requests,
  ROUND(100.0 * COUNT(*) FILTER (WHERE (metadata->>'execution_time_ms')::int > 5000) / NULLIF(COUNT(*), 0), 2) as cold_start_pct
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'execution_time_ms' IS NOT NULL
GROUP BY 1
HAVING COUNT(*) FILTER (WHERE (metadata->>'execution_time_ms')::int > 5000) > 0
ORDER BY 3 DESC;

-- Objetivo: <5% de cold starts

-- ============================================
-- 9. CRON JOB HEALTH (refresh_bonificaciones_today)
-- ============================================
-- Nota: Ahora usando GitHub Actions, monitorear en GitHub Workflow runs
-- Si se habilita pg_cron en el futuro:
/*
SELECT 
  j.jobname,
  r.end_time AS last_run,
  EXTRACT(EPOCH FROM (NOW() - r.end_time)) / 60 AS minutes_since_last_run,
  r.status,
  CASE 
    WHEN r.status = 'succeeded' AND EXTRACT(EPOCH FROM (NOW() - r.end_time)) / 60 < 1500 THEN 'healthy'
    WHEN r.status = 'failed' THEN 'failed'
    WHEN EXTRACT(EPOCH FROM (NOW() - r.end_time)) / 60 >= 1500 THEN 'stale'
    ELSE 'unknown'
  END AS health_status
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT * FROM cron.job_run_details
  WHERE jobid = j.jobid
  ORDER BY end_time DESC
  LIMIT 1
) r ON true
WHERE j.jobname = 'refresh-bonificaciones-daily';
*/

-- ============================================
-- 10. AUDIT LOG COVERAGE (ÚLTIMOS 30 DÍAS)
-- ============================================
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS total_actions,
  COUNT(*) FILTER (WHERE action_type IN ('insert', 'update', 'delete')) AS sensitive_actions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE action_type IN ('insert', 'update', 'delete')) / NULLIF(COUNT(*), 0), 2) AS coverage_pct
FROM whatsapp_activity
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- Objetivo: 100% de acciones sensibles loggeadas

-- ============================================
-- 11. DISPONIBILIDAD (UPTIME) - ÚLTIMOS 7 DÍAS
-- ============================================
WITH hourly_stats AS (
  SELECT 
    DATE_TRUNC('hour', timestamp) AS hour,
    COUNT(*) FILTER (WHERE (response->>'status_code')::int < 500) AS successful_requests,
    COUNT(*) AS total_requests
  FROM function_edge_logs
  WHERE timestamp > NOW() - INTERVAL '7 days'
  GROUP BY 1
)
SELECT 
  SUM(successful_requests) * 100.0 / SUM(total_requests) AS uptime_percentage,
  SUM(total_requests) - SUM(successful_requests) AS total_5xx_errors,
  SUM(total_requests) AS total_requests
FROM hourly_stats;

-- Objetivo: ≥99.9% uptime

-- ============================================
-- 12. PERFORMANCE TRENDS (LATENCIA SEMANAL)
-- ============================================
SELECT 
  DATE_TRUNC('day', timestamp) AS day,
  metadata->>'function_id' as function_id,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'execution_time_ms')::int) AS p95_ms,
  COUNT(*) as requests
FROM function_edge_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
  AND metadata->>'execution_time_ms' IS NOT NULL
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- ============================================
-- USO RECOMENDADO:
-- ============================================
-- 1. Ejecutar queries 1-3 cada hora (alertas automáticas)
-- 2. Queries 4-8 diarias (análisis de tendencias)
-- 3. Queries 9-12 semanales (reportes ejecutivos)
-- 4. Integrar con Grafana/Metabase para dashboards visuales
