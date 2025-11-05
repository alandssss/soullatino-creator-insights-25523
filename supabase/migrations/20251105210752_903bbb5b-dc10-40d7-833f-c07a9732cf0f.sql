-- Habilitar realtime para logs_whatsapp y batallas
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs_whatsapp;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batallas;

-- Configurar replica identity para capturar todos los cambios
ALTER TABLE public.logs_whatsapp REPLICA IDENTITY FULL;
ALTER TABLE public.batallas REPLICA IDENTITY FULL;