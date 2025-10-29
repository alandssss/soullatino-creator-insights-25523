-- @compat: Crear índice único para prevenir duplicados diarios por creador
-- Esto garantiza que cada creador tenga solo un registro por fecha
CREATE UNIQUE INDEX IF NOT EXISTS ux_creator_daily_stats_creator_fecha 
ON public.creator_daily_stats (creator_id, fecha);

-- Comentario explicativo
COMMENT ON INDEX public.ux_creator_daily_stats_creator_fecha IS 
'Garantiza un solo registro por creador por día. Soporta upsert idempotente en upload-excel-recommendations.';