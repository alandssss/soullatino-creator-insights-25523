-- Agregar columnas faltantes a supervision_live_logs
ALTER TABLE public.supervision_live_logs
  ADD COLUMN IF NOT EXISTS observer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS observer_name text,
  ADD COLUMN IF NOT EXISTS severidad text CHECK (severidad IN ('baja', 'media', 'alta')),
  ADD COLUMN IF NOT EXISTS accion_sugerida text,
  ADD COLUMN IF NOT EXISTS reporte text;

-- Crear índice para mejorar performance del rate limiting
CREATE INDEX IF NOT EXISTS idx_supervision_logs_observer_creator_time 
  ON public.supervision_live_logs(observer_user_id, creator_id, created_at DESC);

-- Comentario sobre las columnas
COMMENT ON COLUMN public.supervision_live_logs.observer_user_id IS 'Usuario que realizó la observación';
COMMENT ON COLUMN public.supervision_live_logs.observer_name IS 'Nombre del observador';
COMMENT ON COLUMN public.supervision_live_logs.severidad IS 'Nivel de severidad: baja, media, alta';
COMMENT ON COLUMN public.supervision_live_logs.accion_sugerida IS 'Acción sugerida para el incidente';
COMMENT ON COLUMN public.supervision_live_logs.reporte IS 'Descripción detallada del reporte';