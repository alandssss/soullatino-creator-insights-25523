-- Crear índice único en user_roles(user_id) para garantizar un solo rol por usuario
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_roles_user ON public.user_roles(user_id);

-- Actualizar el rol del usuario actual a admin
-- Nota: Reemplaza con el user_id correcto del usuario que necesita ser admin
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'viewer'::app_role
  LIMIT 1
);