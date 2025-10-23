-- Crear tabla de prospectos para reclutamiento
CREATE TABLE IF NOT EXISTS public.prospectos_reclutamiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  tiktok_username TEXT,
  instagram TEXT,
  estado TEXT NOT NULL DEFAULT 'contactado',
  notas TEXT,
  fecha_contacto TIMESTAMP WITH TIME ZONE DEFAULT now(),
  fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT now(),
  agente_asignado TEXT,
  diamantes_estimados NUMERIC DEFAULT 0,
  seguidores_estimados INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.prospectos_reclutamiento ENABLE ROW LEVEL SECURITY;

-- Política de lectura para admin, manager y supervisor
CREATE POLICY "prospectos_read" 
ON public.prospectos_reclutamiento 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);

-- Política de escritura para admin y manager
CREATE POLICY "prospectos_write" 
ON public.prospectos_reclutamiento 
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_prospectos_updated_at
BEFORE UPDATE ON public.prospectos_reclutamiento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_prospectos_estado ON public.prospectos_reclutamiento(estado);
CREATE INDEX IF NOT EXISTS idx_prospectos_fecha_contacto ON public.prospectos_reclutamiento(fecha_contacto DESC);