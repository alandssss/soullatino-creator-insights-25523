-- Sistema de Tags/Segmentación para Creadores
-- Permite etiquetar creadores con categorías predefinidas (VIP, Nuevo, Riesgo Alto, etc.)

CREATE TYPE tag_type AS ENUM (
  'VIP', 
  'Nuevo', 
  'Riesgo Alto', 
  'Potencial 300K', 
  'Graduado', 
  'Inactivo', 
  'Prioritario', 
  'En Observación'
);

CREATE TABLE IF NOT EXISTS public.creator_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  tag tag_type NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  
  UNIQUE(creator_id, tag)
);

-- Índices para performance
CREATE INDEX idx_creator_tags_creator_id ON public.creator_tags(creator_id);
CREATE INDEX idx_creator_tags_tag ON public.creator_tags(tag);

-- RLS Policies
ALTER TABLE public.creator_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_read" ON public.creator_tags
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role) OR
  has_role(auth.uid(), 'supervisor'::app_role) OR
  has_role(auth.uid(), 'viewer'::app_role)
);

CREATE POLICY "tags_write" ON public.creator_tags
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

COMMENT ON TABLE public.creator_tags IS 'Sistema de etiquetas para segmentación de creadores en el CRM';

-- Añadir campo etapa a prospectos_reclutamiento para pipeline
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospectos_reclutamiento' AND column_name = 'etapa'
  ) THEN
    ALTER TABLE public.prospectos_reclutamiento ADD COLUMN etapa TEXT DEFAULT 'prospecto';
  END IF;
END $$;

-- Añadir campos adicionales para CRM en prospectos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospectos_reclutamiento' AND column_name = 'proxima_accion'
  ) THEN
    ALTER TABLE public.prospectos_reclutamiento ADD COLUMN proxima_accion TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospectos_reclutamiento' AND column_name = 'fecha_proximo_contacto'
  ) THEN
    ALTER TABLE public.prospectos_reclutamiento ADD COLUMN fecha_proximo_contacto DATE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospectos_reclutamiento' AND column_name = 'responsable'
  ) THEN
    ALTER TABLE public.prospectos_reclutamiento ADD COLUMN responsable TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prospectos_reclutamiento' AND column_name = 'origen'
  ) THEN
    ALTER TABLE public.prospectos_reclutamiento ADD COLUMN origen TEXT;
  END IF;
END $$;

-- Añadir campo fecha_completado a creator_tasks para tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'creator_tasks' AND column_name = 'fecha_completado'
  ) THEN
    ALTER TABLE public.creator_tasks ADD COLUMN fecha_completado TIMESTAMPTZ;
  END IF;
END $$;

-- Función para obtener KPIs por manager
CREATE OR REPLACE FUNCTION public.get_manager_kpis()
RETURNS TABLE(
  manager_name TEXT,
  creator_count BIGINT,
  potential_bonuses_saved NUMERIC,
  tasks_completed_week BIGINT,
  last_interaction TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH manager_creators AS (
    SELECT 
      c.manager,
      c.id as creator_id
    FROM creators c
    WHERE c.status = 'activo'
  ),
  bonuses AS (
    SELECT 
      mc.manager,
      SUM(
        CASE 
          WHEN b.semaforo_300k = 'verde' OR b.semaforo_500k = 'verde' THEN 500
          WHEN b.semaforo_100k = 'verde' THEN 200
          ELSE 0
        END
      ) as potential_saved
    FROM manager_creators mc
    INNER JOIN creator_bonificaciones b ON b.creator_id = mc.creator_id
    WHERE b.mes_referencia = date_trunc('month', CURRENT_DATE)::date
    GROUP BY mc.manager
  ),
  tasks AS (
    SELECT 
      mc.manager,
      COUNT(*) as completed_count
    FROM manager_creators mc
    INNER JOIN creator_tasks ct ON ct.creator_id = mc.creator_id
    WHERE 
      ct.estado = 'completado'
      AND ct.fecha_completado >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY mc.manager
  ),
  interactions AS (
    SELECT 
      mc.manager,
      MAX(ci.created_at) as last_interaction_date
    FROM manager_creators mc
    INNER JOIN creator_interactions ci ON ci.creator_id = mc.creator_id
    GROUP BY mc.manager
  )
  SELECT 
    COALESCE(mc.manager, 'Sin Asignar') as manager_name,
    COUNT(DISTINCT mc.creator_id) as creator_count,
    COALESCE(b.potential_saved, 0) as potential_bonuses_saved,
    COALESCE(t.completed_count, 0) as tasks_completed_week,
    i.last_interaction_date as last_interaction
  FROM manager_creators mc
  LEFT JOIN bonuses b ON b.manager = mc.manager
  LEFT JOIN tasks t ON t.manager = mc.manager
  LEFT JOIN interactions i ON i.manager = mc.manager
  GROUP BY mc.manager, b.potential_saved, t.completed_count, i.last_interaction_date
  ORDER BY potential_bonuses_saved DESC, creator_count DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_manager_kpis() TO authenticated;

COMMENT ON FUNCTION public.get_manager_kpis() IS 'Obtiene KPIs agregados por manager para el Dashboard CRM';
