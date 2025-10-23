BEGIN;
DELETE FROM public.user_roles WHERE user_id = '16f16253-bd22-4626-b769-3dd8fdf098c0';
INSERT INTO public.user_roles (user_id, role) VALUES ('16f16253-bd22-4626-b769-3dd8fdf098c0', 'admin'::app_role);
COMMIT;