-- FASE 1: Corrección de Datos - Prevenir duplicados en creator_daily_stats
-- Agregar constraint UNIQUE para evitar duplicados por creator_id y fecha

-- Primero, eliminar duplicados existentes si los hay
WITH ranked_stats AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY creator_id, fecha 
      ORDER BY created_at DESC
    ) as rn
  FROM creator_daily_stats
)
DELETE FROM creator_daily_stats
WHERE id IN (
  SELECT id FROM ranked_stats WHERE rn > 1
);

-- Agregar constraint UNIQUE
ALTER TABLE creator_daily_stats
ADD CONSTRAINT unique_creator_date UNIQUE (creator_id, fecha);

-- Crear índice para mejorar performance en queries por mes
CREATE INDEX IF NOT EXISTS idx_creator_daily_stats_month 
ON creator_daily_stats (creator_id, fecha DESC);

-- Comentario explicativo
COMMENT ON CONSTRAINT unique_creator_date ON creator_daily_stats IS 
'Garantiza que no haya duplicados para la misma combinación de creator_id y fecha. Esto previene errores en cálculos de métricas MTD y bonificaciones.';