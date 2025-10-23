-- Paso 2: Actualizar políticas RLS para incluir el rol 'reclutador'

-- Actualizar política de lectura para prospectos_reclutamiento
DROP POLICY IF EXISTS "prospectos_read" ON public.prospectos_reclutamiento;
CREATE POLICY "prospectos_read" 
ON public.prospectos_reclutamiento 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
);

-- Actualizar política de lectura para supervision_live_logs
DROP POLICY IF EXISTS "supervision_read" ON public.supervision_live_logs;
CREATE POLICY "supervision_read" 
ON public.supervision_live_logs 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
);

-- Actualizar política de escritura para supervision_live_logs
DROP POLICY IF EXISTS "supervision_write" ON public.supervision_live_logs;
CREATE POLICY "supervision_write" 
ON public.supervision_live_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
);

-- Actualizar política de lectura para creators
DROP POLICY IF EXISTS "Usuarios autorizados pueden ver creators" ON public.creators;
CREATE POLICY "Usuarios autorizados pueden ver creators" 
ON public.creators 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'viewer'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
);