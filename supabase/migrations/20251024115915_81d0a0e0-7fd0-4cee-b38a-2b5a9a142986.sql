-- Fix SECURITY DEFINER Views by adding SECURITY INVOKER
-- This ensures views execute with current user's privileges, not the creator's

-- Fix v_ia_effectiveness: Add SECURITY INVOKER
DROP VIEW IF EXISTS public.v_ia_effectiveness;

CREATE VIEW public.v_ia_effectiveness
WITH (security_invoker=true)
AS
SELECT
  DATE_TRUNC('month', fecha_creacion) AS mes,
  COUNT(*) FILTER (WHERE seguida_por_manager = true) AS recomendaciones_seguidas,
  COUNT(*) FILTER (WHERE seguida_por_manager = false) AS recomendaciones_ignoradas,
  AVG(lift_percentage) FILTER (WHERE seguida_por_manager = true) AS lift_promedio_seguidas,
  AVG(lift_percentage) FILTER (WHERE seguida_por_manager = false OR seguida_por_manager IS NULL) AS lift_promedio_no_seguidas
FROM creator_recommendations
WHERE fecha_creacion >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
GROUP BY DATE_TRUNC('month', fecha_creacion)
ORDER BY mes DESC;

-- Fix v_nuevos_creadores_detalle: Add SECURITY INVOKER
DROP VIEW IF EXISTS public.v_nuevos_creadores_detalle;

CREATE VIEW public.v_nuevos_creadores_detalle
WITH (security_invoker=true)
AS
SELECT 
  c.id,
  c.nombre,
  c.tiktok_username,
  c.dias_en_agencia,
  c.manager,
  c.agente,
  c.fecha_incorporacion,
  c.telefono,
  COALESCE(b.diam_live_mes, 0) AS diam_live_mes,
  COALESCE(b.dias_live_mes, 0) AS dias_live_mes,
  COALESCE(b.horas_live_mes, 0) AS horas_live_mes,
  CASE 
    WHEN b.diam_live_mes >= 500000 THEN '500K'
    WHEN b.diam_live_mes >= 300000 THEN '300K'
    WHEN b.diam_live_mes >= 100000 THEN '100K'
    ELSE 'Sin Graduación'
  END AS nivel_graduacion,
  CASE 
    WHEN b.diam_live_mes >= 100000 THEN true 
    ELSE false 
  END AS graduado,
  ROUND((COALESCE(b.diam_live_mes, 0) / 100000.0) * 100, 1) AS progreso_100k_pct,
  (100000 - COALESCE(b.diam_live_mes, 0)) AS faltan_para_100k
FROM creators c
LEFT JOIN creator_bonificaciones b 
  ON c.id = b.creator_id 
  AND b.mes_referencia = DATE_TRUNC('month', CURRENT_DATE)::date
WHERE 
  c.dias_en_agencia <= 90
  AND c.status = 'activo'
ORDER BY b.diam_live_mes DESC NULLS LAST;

COMMENT ON VIEW public.v_ia_effectiveness IS 
'Effectiveness metrics for AI recommendations. Uses SECURITY INVOKER to run with current user privileges, respecting RLS policies on creator_recommendations table.';

COMMENT ON VIEW public.v_nuevos_creadores_detalle IS 
'Details of new creators (<90 days in agency) with graduation progress. Uses SECURITY INVOKER to respect RLS policies on creators and creator_bonificaciones tables.';