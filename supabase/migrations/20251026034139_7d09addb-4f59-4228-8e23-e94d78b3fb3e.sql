-- Eliminar policy existente sin restricción adecuada
DROP POLICY IF EXISTS "Usuarios autorizados pueden crear interacciones" ON creator_interactions;

-- Crear nueva policy con restricción de rol estricta
CREATE POLICY "Usuarios autorizados pueden crear interacciones" 
ON creator_interactions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'supervisor'::app_role)
);