-- ============================================================================
-- SISTEMA DE RANKINGS GAMIFICADOS
-- ============================================================================

-- 1. Tabla de rankings históricos (leaderboards semanales/mensuales)
CREATE TABLE IF NOT EXISTS public.creator_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  periodo_tipo TEXT NOT NULL CHECK (periodo_tipo IN ('semanal', 'mensual')),
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  ranking_position INTEGER NOT NULL,
  diamantes_periodo NUMERIC DEFAULT 0,
  horas_periodo NUMERIC DEFAULT 0,
  dias_periodo INTEGER DEFAULT 0,
  puntos_gamificacion INTEGER DEFAULT 0,
  categoria TEXT, -- 'top10', 'top50', 'mejorando', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, periodo_tipo, periodo_inicio)
);

CREATE INDEX idx_rankings_periodo ON public.creator_rankings(periodo_tipo, periodo_inicio DESC);
CREATE INDEX idx_rankings_position ON public.creator_rankings(ranking_position);
CREATE INDEX idx_rankings_creator ON public.creator_rankings(creator_id);

-- 2. Tabla de badges/logros
CREATE TABLE IF NOT EXISTS public.creator_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  badge_tipo TEXT NOT NULL, -- 'diamante_50k', 'diamante_100k', 'racha_7dias', 'top1_semanal', etc.
  badge_nivel TEXT, -- 'bronce', 'plata', 'oro', 'platino'
  titulo TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT, -- emoji o nombre de icono
  fecha_obtencion TIMESTAMPTZ DEFAULT now(),
  metadata JSONB, -- datos adicionales del logro
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, badge_tipo, badge_nivel)
);

CREATE INDEX idx_badges_creator ON public.creator_badges(creator_id, fecha_obtencion DESC);
CREATE INDEX idx_badges_tipo ON public.creator_badges(badge_tipo);

-- 3. Tabla de competencias entre equipos/grupos
CREATE TABLE IF NOT EXISTS public.team_competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  tipo_competencia TEXT NOT NULL, -- 'diamantes', 'horas', 'consistencia'
  estado TEXT DEFAULT 'activa' CHECK (estado IN ('programada', 'activa', 'finalizada')),
  equipos JSONB NOT NULL, -- [{ team: 'Equipo A', managers: ['Manager1'], creators: [] }, ...]
  resultados JSONB, -- Resultados finales al terminar
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_competitions_estado ON public.team_competitions(estado, fecha_fin DESC);

-- 4. Tabla de notificaciones de ranking
CREATE TABLE IF NOT EXISTS public.ranking_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  tipo_notificacion TEXT NOT NULL, -- 'subida_ranking', 'bajada_ranking', 'cerca_top10', 'nuevo_badge', 'competencia_cercana'
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  metadata JSONB, -- { old_position, new_position, difference, etc }
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_creator ON public.ranking_notifications(creator_id, created_at DESC);
CREATE INDEX idx_notifications_leida ON public.ranking_notifications(leida);

-- 5. Vista materializada para el leaderboard actual
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_leaderboard_actual AS
SELECT 
  c.id as creator_id,
  c.nombre,
  c.tiktok_username,
  c.manager,
  c.grupo,
  c.telefono,
  COALESCE(SUM(cds.diamantes), 0) as diamantes_semana,
  COALESCE(SUM(cds.duracion_live_horas), 0) as horas_semana,
  COALESCE(COUNT(DISTINCT cds.fecha), 0) as dias_semana,
  ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(cds.diamantes), 0) DESC) as ranking_position,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(cds.diamantes), 0) DESC) <= 10 THEN 'top10'
    WHEN ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(cds.diamantes), 0) DESC) <= 50 THEN 'top50'
    ELSE 'otros'
  END as categoria
FROM public.creators c
LEFT JOIN public.creator_daily_stats cds ON c.id = cds.creator_id 
  AND cds.fecha >= CURRENT_DATE - INTERVAL '7 days'
WHERE c.status = 'activo'
GROUP BY c.id, c.nombre, c.tiktok_username, c.manager, c.grupo, c.telefono;

CREATE UNIQUE INDEX ON public.mv_leaderboard_actual(creator_id);
CREATE INDEX ON public.mv_leaderboard_actual(ranking_position);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.creator_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ranking_notifications ENABLE ROW LEVEL SECURITY;

-- Rankings: lectura para usuarios autorizados
CREATE POLICY "rankings_read" ON public.creator_rankings
  FOR SELECT TO public
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'viewer') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Badges: lectura para usuarios autorizados
CREATE POLICY "badges_read" ON public.creator_badges
  FOR SELECT TO public
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'viewer') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Competencias: lectura para usuarios autorizados
CREATE POLICY "competitions_read" ON public.team_competitions
  FOR SELECT TO public
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'viewer') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Competencias: escritura solo admin/manager
CREATE POLICY "competitions_write" ON public.team_competitions
  FOR ALL TO public
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Notificaciones: lectura para usuarios autorizados
CREATE POLICY "notifications_read" ON public.ranking_notifications
  FOR SELECT TO public
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager') OR 
    has_role(auth.uid(), 'viewer') OR 
    has_role(auth.uid(), 'supervisor')
  );

-- Notificaciones: actualizar para marcar como leídas
CREATE POLICY "notifications_update" ON public.ranking_notifications
  FOR UPDATE TO public
  USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'manager')
  );

-- ============================================================================
-- FUNCIÓN: Refrescar vista materializada del leaderboard
-- ============================================================================
CREATE OR REPLACE FUNCTION public.refresh_leaderboard_actual()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_leaderboard_actual;
END;
$$;