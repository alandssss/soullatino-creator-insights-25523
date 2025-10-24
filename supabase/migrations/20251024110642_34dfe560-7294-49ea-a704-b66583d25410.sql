-- Fix Security Definer View warning
-- Recreate v_ia_effectiveness without security definer
DROP VIEW IF EXISTS public.v_ia_effectiveness;

CREATE OR REPLACE VIEW public.v_ia_effectiveness AS
SELECT
  DATE_TRUNC('month', fecha_creacion) AS mes,
  COUNT(*) FILTER (WHERE seguida_por_manager = true) AS recomendaciones_seguidas,
  COUNT(*) FILTER (WHERE seguida_por_manager = false) AS recomendaciones_ignoradas,
  AVG(lift_percentage) FILTER (WHERE seguida_por_manager = true) AS lift_promedio_seguidas,
  AVG(lift_percentage) FILTER (WHERE seguida_por_manager = false OR seguida_por_manager IS NULL) AS lift_promedio_no_seguidas
FROM public.creator_recommendations
WHERE fecha_creacion >= DATE_TRUNC('month', NOW() - INTERVAL '6 months')
GROUP BY 1
ORDER BY 1 DESC;