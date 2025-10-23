-- Actualizar rol de usuario a admin para acceso completo
UPDATE public.user_roles 
SET role = 'admin'::app_role
WHERE user_id = '16f16253-bd22-4626-b769-3dd8fdf098c0';