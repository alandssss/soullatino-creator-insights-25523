-- FASE 1: Asegurar integridad de datos - Prevenir duplicados en creator_daily_stats
-- Esta restricción garantiza que no se puedan insertar múltiples registros del mismo creador para la misma fecha

-- 1. Eliminar duplicados existentes (si los hay) conservando el registro más reciente
DELETE FROM creator_daily_stats a
USING creator_daily_stats b
WHERE a.creator_id = b.creator_id
  AND a.fecha = b.fecha
  AND a.created_at < b.created_at;

-- 2. Agregar constraint UNIQUE para prevenir futuros duplicados
ALTER TABLE creator_daily_stats
ADD CONSTRAINT uk_creator_daily_stats_creator_fecha 
UNIQUE (creator_id, fecha);

-- 3. Crear índice compuesto para mejorar performance en queries de métricas MTD
CREATE INDEX IF NOT EXISTS idx_creator_daily_stats_month_lookup 
ON creator_daily_stats (creator_id, fecha DESC);

-- 4. Comentarios para documentación
COMMENT ON CONSTRAINT uk_creator_daily_stats_creator_fecha ON creator_daily_stats IS 
'Previene duplicados: solo un registro por creador por día';

COMMENT ON INDEX idx_creator_daily_stats_month_lookup IS 
'Optimiza consultas de métricas mensuales por creador';