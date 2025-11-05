-- Corregir vista v_nuevos_creadores_detalle para graduación correcta
-- Solo marca como graduado si cumple AMBOS: diamantes Y días requeridos

DROP VIEW IF EXISTS v_nuevos_creadores_detalle;

CREATE VIEW v_nuevos_creadores_detalle AS
SELECT 
  c.id,
  c.nombre,
  c.tiktok_username,
  c.dias_en_agencia,
  c.manager,
  c.agente,
  c.telefono,
  COALESCE(cb.diam_live_mes, 0) AS diam_live_mes,
  COALESCE(cb.dias_live_mes, 0) AS dias_live_mes,
  COALESCE(cb.horas_live_mes, 0) AS horas_live_mes,
  -- Nivel de graduación solo si cumple AMBOS requisitos
  CASE 
    WHEN cb.diam_live_mes >= 100000 AND cb.dias_live_mes >= 30 THEN '100K'
    WHEN cb.diam_live_mes >= 50000 AND cb.dias_live_mes >= 20 THEN '50K'
    ELSE NULL
  END AS nivel_graduacion,
  -- Graduado = true SOLO si tiene diamantes Y días suficientes
  CASE
    WHEN cb.diam_live_mes IS NULL OR cb.diam_live_mes = 0 THEN false
    WHEN (cb.diam_live_mes >= 100000 AND cb.dias_live_mes >= 30) THEN true
    WHEN (cb.diam_live_mes >= 50000 AND cb.dias_live_mes >= 20) THEN true
    ELSE false
  END AS graduado,
  -- Progreso hacia 100K
  CASE 
    WHEN cb.diam_live_mes IS NULL OR cb.diam_live_mes = 0 THEN 0
    ELSE ROUND((cb.diam_live_mes / 100000.0) * 100, 2)
  END AS progreso_100k_pct,
  -- Faltan para 100K
  GREATEST(0, 100000 - COALESCE(cb.diam_live_mes, 0)) AS faltan_para_100k
FROM creators c
LEFT JOIN creator_bonificaciones cb ON c.id = cb.creator_id
  AND cb.mes_referencia = DATE_TRUNC('month', CURRENT_DATE)::date
WHERE c.dias_en_agencia <= 90
  AND c.status = 'activo'
ORDER BY cb.diam_live_mes DESC NULLS LAST;