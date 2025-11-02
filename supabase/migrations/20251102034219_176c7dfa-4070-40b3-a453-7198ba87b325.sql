-- Secure materialized views using SECURITY DEFINER wrapper functions
-- Fix: MISSING_RLS - Materialized Views Accessible via API
-- Note: Materialized views don't support RLS directly, so we use wrapper functions

-- Revoke direct access to materialized views from all roles
REVOKE ALL ON public.recommendations_today FROM PUBLIC;
REVOKE ALL ON public.recommendations_today FROM anon;
REVOKE ALL ON public.recommendations_today FROM authenticated;

-- Create secure wrapper function for recommendations_today
CREATE OR REPLACE FUNCTION public.get_recommendations_today()
RETURNS TABLE (
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enforce role-based access control
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'viewer'::app_role)
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

-- Secure creator_riesgos_mes if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews 
    WHERE schemaname = 'public' AND matviewname = 'creator_riesgos_mes'
  ) THEN
    -- Revoke direct access
    EXECUTE 'REVOKE ALL ON public.creator_riesgos_mes FROM PUBLIC';
    EXECUTE 'REVOKE ALL ON public.creator_riesgos_mes FROM anon';
    EXECUTE 'REVOKE ALL ON public.creator_riesgos_mes FROM authenticated';
  END IF;
END $$;

-- Grant execute permission on the wrapper function
GRANT EXECUTE ON FUNCTION public.get_recommendations_today() TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION public.get_recommendations_today() IS 
'Secure wrapper for recommendations_today materialized view. Enforces role-based access control (admin, manager, viewer). Direct access to the materialized view is revoked for security.';