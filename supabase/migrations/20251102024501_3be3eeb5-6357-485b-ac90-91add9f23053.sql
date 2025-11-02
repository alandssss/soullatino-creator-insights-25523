-- Crear tabla de batallas
CREATE TABLE public.batallas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  oponente TEXT NOT NULL,
  guantes TEXT,
  reto TEXT,
  tipo TEXT,
  notas TEXT,
  estado TEXT DEFAULT 'programada' CHECK (estado IN ('programada', 'completada', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_batallas_creator_fecha ON public.batallas(creator_id, fecha);
CREATE INDEX idx_batallas_fecha ON public.batallas(fecha) WHERE estado = 'programada';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_batallas_updated_at
BEFORE UPDATE ON public.batallas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.batallas ENABLE ROW LEVEL SECURITY;

-- Política de lectura
CREATE POLICY "batallas_read" ON public.batallas
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR 
    has_role(auth.uid(), 'supervisor'::app_role) OR
    has_role(auth.uid(), 'viewer'::app_role)
  );

-- Política de escritura
CREATE POLICY "batallas_write" ON public.batallas
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Comentarios para documentación
COMMENT ON TABLE public.batallas IS 'Almacena las batallas oficiales programadas para los creadores';
COMMENT ON COLUMN public.batallas.guantes IS 'Potenciadores o guantes asignados para la batalla';
COMMENT ON COLUMN public.batallas.tipo IS 'Modalidad de la batalla (PK, 1v1, etc.)';
COMMENT ON COLUMN public.batallas.estado IS 'Estado actual: programada, completada, cancelada';