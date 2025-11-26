-- Fase 1: Actualizar políticas RLS de creator_bonificaciones
DROP POLICY IF EXISTS "bonificaciones_read" ON creator_bonificaciones;

CREATE POLICY "bonificaciones_read" ON creator_bonificaciones
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Fase 2: Actualizar políticas RLS de creator_daily_stats
DROP POLICY IF EXISTS "Admin y Manager pueden ver daily stats" ON creator_daily_stats;

CREATE POLICY "authenticated_can_read_daily_stats" ON creator_daily_stats
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Fase 3: Actualizar función get_recommendations_today() para incluir supervisor
CREATE OR REPLACE FUNCTION public.get_recommendations_today()
RETURNS TABLE(
  recommendation_id uuid,
  creator_id uuid,
  creator_username text,
  phone_e164 text,
  dias_actuales integer,
  horas_actuales numeric,
  diamantes_actuales numeric,
  proximo_objetivo text,
  dias_restantes integer,
  faltan_dias integer,
  faltan_horas numeric,
  horas_min_dia_sugeridas numeric,
  prioridad_riesgo integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enforce role-based access control (ahora incluye supervisor)
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'viewer'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient permissions';
  END IF;

  -- Return data from materialized view
  RETURN QUERY
  SELECT 
    r.recommendation_id,
    r.creator_id,
    r.creator_username,
    r.phone_e164,
    r.dias_actuales,
    r.horas_actuales,
    r.diamantes_actuales,
    r.proximo_objetivo,
    r.dias_restantes,
    r.faltan_dias,
    r.faltan_horas,
    r.horas_min_dia_sugeridas,
    r.prioridad_riesgo
  FROM public.recommendations_today r;
END;
$$;