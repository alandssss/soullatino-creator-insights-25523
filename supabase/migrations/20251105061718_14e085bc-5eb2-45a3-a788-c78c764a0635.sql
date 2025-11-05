-- Política RLS para permitir lectura pública de batallas en el portal
-- Permite que cualquiera pueda leer batallas sin autenticación
-- La seguridad se maneja a nivel de aplicación mostrando solo batallas del creador específico
CREATE POLICY "public_portal_batallas_read" 
ON public.batallas 
FOR SELECT 
TO public
USING (true);