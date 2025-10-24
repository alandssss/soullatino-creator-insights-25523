-- Función RPC para KPI de Graduación de Nuevos Creadores
CREATE OR REPLACE FUNCTION public.kpi_new_creator_graduation(
  p_mes_referencia date DEFAULT date_trunc('month', CURRENT_DATE)::date
)
RETURNS TABLE (
  total_nuevos bigint,
  graduados_100k_mas bigint,
  graduados_300k_mas bigint,
  graduados_500k_mas bigint,
  pct_graduacion_100k numeric,
  pct_graduacion_300k numeric,
  pct_graduacion_500k numeric,
  estado_objetivo_100k text,
  brecha_porcentual_100k numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH nuevos_creadores AS (
    SELECT 
      c.id,
      c.nombre,
      c.dias_en_agencia,
      c.tiktok_username,
      b.diam_live_mes,
      CASE 
        WHEN b.diam_live_mes >= 500000 THEN '500K'
        WHEN b.diam_live_mes >= 300000 THEN '300K'
        WHEN b.diam_live_mes >= 100000 THEN '100K'
        ELSE 'Sin Graduación'
      END as nivel_graduacion
    FROM creators c
    LEFT JOIN creator_bonificaciones b 
      ON c.id = b.creator_id 
      AND b.mes_referencia = p_mes_referencia
    WHERE 
      c.dias_en_agencia <= 90
      AND c.status = 'activo'
  )
  SELECT
    COUNT(*)::bigint as total_nuevos,
    COUNT(*) FILTER (WHERE diam_live_mes >= 100000)::bigint as graduados_100k_mas,
    COUNT(*) FILTER (WHERE diam_live_mes >= 300000)::bigint as graduados_300k_mas,
    COUNT(*) FILTER (WHERE diam_live_mes >= 500000)::bigint as graduados_500k_mas,
    
    -- Porcentajes
    ROUND(
      (COUNT(*) FILTER (WHERE diam_live_mes >= 100000)::NUMERIC * 100.0) 
      / NULLIF(COUNT(*), 0),
      2
    ) as pct_graduacion_100k,
    
    ROUND(
      (COUNT(*) FILTER (WHERE diam_live_mes >= 300000)::NUMERIC * 100.0) 
      / NULLIF(COUNT(*), 0),
      2
    ) as pct_graduacion_300k,
    
    ROUND(
      (COUNT(*) FILTER (WHERE diam_live_mes >= 500000)::NUMERIC * 100.0) 
      / NULLIF(COUNT(*), 0),
      2
    ) as pct_graduacion_500k,
    
    -- Estado vs objetivo (4%)
    CASE 
      WHEN (COUNT(*) FILTER (WHERE diam_live_mes >= 100000)::NUMERIC * 100.0) 
           / NULLIF(COUNT(*), 0) >= 4.0 
      THEN 'CUMPLIDO'
      ELSE 'PENDIENTE'
    END as estado_objetivo_100k,
    
    -- Brecha
    ROUND(
      (
        (COUNT(*) FILTER (WHERE diam_live_mes >= 100000)::NUMERIC * 100.0) 
        / NULLIF(COUNT(*), 0)
      ) - 4.0,
      2
    ) as brecha_porcentual_100k
  FROM nuevos_creadores;
$$;

-- Grant execute a roles autorizados
GRANT EXECUTE ON FUNCTION public.kpi_new_creator_graduation TO authenticated;

-- Vista para Detalle de Nuevos Creadores
CREATE OR REPLACE VIEW public.v_nuevos_creadores_detalle AS
SELECT 
  c.id,
  c.nombre,
  c.tiktok_username,
  c.dias_en_agencia,
  c.manager,
  c.agente,
  c.fecha_incorporacion,
  c.telefono,
  COALESCE(b.diam_live_mes, 0) as diam_live_mes,
  COALESCE(b.dias_live_mes, 0) as dias_live_mes,
  COALESCE(b.horas_live_mes, 0) as horas_live_mes,
  CASE 
    WHEN b.diam_live_mes >= 500000 THEN '500K'
    WHEN b.diam_live_mes >= 300000 THEN '300K'
    WHEN b.diam_live_mes >= 100000 THEN '100K'
    ELSE 'Sin Graduación'
  END as nivel_graduacion,
  CASE 
    WHEN b.diam_live_mes >= 100000 THEN true
    ELSE false
  END as graduado,
  -- Progreso hacia 100K
  ROUND((COALESCE(b.diam_live_mes, 0) / 100000.0) * 100, 1) as progreso_100k_pct,
  100000 - COALESCE(b.diam_live_mes, 0) as faltan_para_100k
FROM creators c
LEFT JOIN creator_bonificaciones b 
  ON c.id = b.creator_id 
  AND b.mes_referencia = date_trunc('month', CURRENT_DATE)::date
WHERE 
  c.dias_en_agencia <= 90
  AND c.status = 'activo'
ORDER BY b.diam_live_mes DESC NULLS LAST;