-- Eliminar política antigua combinada
DROP POLICY IF EXISTS "prospectos_write" ON public.prospectos_reclutamiento;

-- Política UPDATE: admin, manager y reclutador pueden actualizar
CREATE POLICY "prospectos_update" 
ON public.prospectos_reclutamiento 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
);

-- Política INSERT: admin, manager y reclutador pueden insertar
CREATE POLICY "prospectos_insert" 
ON public.prospectos_reclutamiento 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'reclutador'::app_role)
);

-- Política DELETE: solo admin y manager pueden eliminar
CREATE POLICY "prospectos_delete" 
ON public.prospectos_reclutamiento 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);