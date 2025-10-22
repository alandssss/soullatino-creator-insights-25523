-- Fase 1: Crear infraestructura de base de datos para recommendations_today

-- 1. Ajustar creator_daily_stats: agregar columnas si no existen
ALTER TABLE public.creator_daily_stats 
ADD COLUMN IF NOT EXISTS creator_username text,
ADD COLUMN IF NOT EXISTS phone_e164 text;

-- Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_creator_daily_stats_fecha 
ON public.creator_daily_stats(fecha DESC);

-- 2. Crear la vista materializada recommendations_today
DROP MATERIALIZED VIEW IF EXISTS public.recommendations_today;

CREATE MATERIALIZED VIEW public.recommendations_today AS
SELECT
  s.id as recommendation_id,
  s.creator_id,
  COALESCE(s.creator_username, c.nombre, '') as creator_username,
  COALESCE(s.phone_e164, c.telefono) as phone_e164,
  COALESCE(s.dias_validos_live, 0) as dias_actuales,
  COALESCE(s.duracion_live_horas, 0) as horas_actuales,
  COALESCE(s.diamantes, 0) as diamantes_actuales,
  'Meta mensual'::text as proximo_objetivo,
  GREATEST(0, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date - CURRENT_DATE) as dias_restantes,
  GREATEST(0, 22 - COALESCE(s.dias_validos_live, 0)) as faltan_dias,
  GREATEST(0, 80 - COALESCE(s.duracion_live_horas, 0)) as faltan_horas,
  ROUND(
    GREATEST(0, 80 - COALESCE(s.duracion_live_horas, 0)) / 
    NULLIF(GREATEST(1, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date - CURRENT_DATE), 0)::numeric,
    1
  ) as horas_min_dia_sugeridas,
  CASE
    WHEN (80 - COALESCE(s.duracion_live_horas, 0)) >= 30 THEN 50
    WHEN (80 - COALESCE(s.duracion_live_horas, 0)) >= 15 THEN 30
    ELSE 10
  END::int as prioridad_riesgo
FROM public.creator_daily_stats s
LEFT JOIN public.creators c ON s.creator_id = c.id
WHERE s.fecha = CURRENT_DATE;

-- Crear índice único para refresh concurrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_recommendations_today_recommendation 
ON public.recommendations_today(recommendation_id);

-- 3. Crear la función de refresh
CREATE OR REPLACE FUNCTION public.refresh_recommendations_today()
RETURNS void 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.recommendations_today;
$$;

-- 4. Dar permisos
ALTER MATERIALIZED VIEW public.recommendations_today OWNER TO postgres;
GRANT SELECT ON public.recommendations_today TO authenticated;
GRANT SELECT ON public.recommendations_today TO anon;