-- FASE 1: Limpieza completa del sistema Twilio
-- Eliminar todos los triggers relacionados con notificaciones automáticas de WhatsApp

-- 1. Eliminar triggers activos
DROP TRIGGER IF EXISTS batallas_notify_whatsapp_insert ON public.batallas;
DROP TRIGGER IF EXISTS batallas_notify_whatsapp_update ON public.batallas;
DROP TRIGGER IF EXISTS batallas_notify_whatsapp ON public.batallas;
DROP TRIGGER IF EXISTS batallas_enqueue ON public.batallas;

-- 2. Eliminar funciones relacionadas con triggers
DROP FUNCTION IF EXISTS public.trg_batallas_created_notify();
DROP FUNCTION IF EXISTS public.trg_enqueue_battle();

-- 3. Eliminar tablas obsoletas del sistema de cola
DROP VIEW IF EXISTS public.v_battle_queue_monitor CASCADE;
DROP TABLE IF EXISTS public.battle_queue CASCADE;

-- 4. Eliminar tabla de logs de WhatsApp (ya no se usa con Twilio)
DROP TABLE IF EXISTS public.logs_whatsapp CASCADE;

-- 5. Eliminar vista de batallas pendientes (ya no es necesaria)
DROP VIEW IF EXISTS public.v_batallas_pendientes_notificacion CASCADE;

-- 6. Eliminar tabla de actividad de WhatsApp (logs de Twilio)
DROP TABLE IF EXISTS public.whatsapp_activity CASCADE;

-- Comentario final
COMMENT ON TABLE public.batallas IS 'Tabla de batallas - Sistema manual de notificación via wa.me (sin Twilio)';
