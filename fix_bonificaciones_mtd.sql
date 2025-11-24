-- Script temporal para corregir datos de creator_bonificaciones
-- Recalcula dias_live_mes y horas_live_mes desde creator_daily_stats del mes actual
-- Ejecutar manualmente una sola vez después de corregir upload-excel-recommendations

-- 1. Recalcular días live MTD (contar fechas distintas con diamantes > 0)
UPDATE creator_bonificaciones b
SET 
  dias_live_mes = (
    SELECT COUNT(DISTINCT fecha)
    FROM creator_daily_stats cds
    WHERE cds.creator_id = b.creator_id
      AND cds.fecha >= DATE_TRUNC('month', CURRENT_DATE)
      AND cds.fecha < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      AND cds.diamantes > 0
  ),
  fecha_calculo = CURRENT_DATE
WHERE b.mes_referencia = DATE_TRUNC('month', CURRENT_DATE)::date;

-- 2. Recalcular horas live MTD
-- Opción A: Si duracion_live_horas es incremental diario, sumar directamente
UPDATE creator_bonificaciones b
SET 
  horas_live_mes = (
    SELECT COALESCE(SUM(cds.duracion_live_horas), 0)
    FROM creator_daily_stats cds
    WHERE cds.creator_id = b.creator_id
      AND cds.fecha >= DATE_TRUNC('month', CURRENT_DATE)
      AND cds.fecha < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      AND cds.diamantes > 0
  ),
  fecha_calculo = CURRENT_DATE
WHERE b.mes_referencia = DATE_TRUNC('month', CURRENT_DATE)::date;

-- 3. Verificación: Mostrar creadores con métricas corregidas
SELECT 
  c.nombre,
  c.tiktok_username,
  b.dias_live_mes as dias_corregidos,
  b.horas_live_mes as horas_corregidas,
  b.diam_live_mes as diamantes_mtd
FROM creator_bonificaciones b
JOIN creators c ON c.id = b.creator_id
WHERE b.mes_referencia = DATE_TRUNC('month', CURRENT_DATE)::date
  AND c.status = 'activo'
ORDER BY b.diam_live_mes DESC
LIMIT 20;

-- 4. Estadísticas de corrección
SELECT 
  COUNT(*) as total_creadores,
  AVG(dias_live_mes) as promedio_dias,
  MAX(dias_live_mes) as max_dias,
  AVG(horas_live_mes) as promedio_horas,
  MAX(horas_live_mes) as max_horas,
  SUM(CASE WHEN dias_live_mes <= 8 THEN 1 ELSE 0 END) as baja_actividad
FROM creator_bonificaciones
WHERE mes_referencia = DATE_TRUNC('month', CURRENT_DATE)::date;
