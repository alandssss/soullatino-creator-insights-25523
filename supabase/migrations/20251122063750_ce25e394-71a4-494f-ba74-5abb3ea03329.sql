-- Create creator_tasks table for CRM task management
CREATE TABLE IF NOT EXISTS public.creator_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  prioridad TEXT NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  descripcion TEXT NOT NULL,
  fecha_limite DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  asignado_a TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for creator_tasks
CREATE POLICY "Tasks viewable by authenticated users with role"
  ON public.creator_tasks
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

CREATE POLICY "Tasks creatable by managers and admins"
  ON public.creator_tasks
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

CREATE POLICY "Tasks updatable by managers and admins"
  ON public.creator_tasks
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'supervisor'::app_role)
  );

CREATE POLICY "Tasks deletable by managers and admins"
  ON public.creator_tasks
  FOR DELETE
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_creator_tasks_updated_at
  BEFORE UPDATE ON public.creator_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_creator_tasks_creator_id ON public.creator_tasks(creator_id);
CREATE INDEX idx_creator_tasks_estado ON public.creator_tasks(estado);
CREATE INDEX idx_creator_tasks_fecha_limite ON public.creator_tasks(fecha_limite);
