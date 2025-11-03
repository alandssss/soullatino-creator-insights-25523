-- Habilitar extensión pg_net para HTTP requests desde triggers
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Función que dispara la edge function al crear una batalla
CREATE OR REPLACE FUNCTION trg_batallas_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo notificar si el estado es 'programada'
  IF (NEW.estado = 'programada') THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url', true) || '/functions/v1/battle-created',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.battle_hook_secret', true)
      ),
      body := jsonb_build_object('batalla_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger en la tabla batallas (se ejecuta después del INSERT)
DROP TRIGGER IF EXISTS batallas_after_insert_notify ON batallas;
CREATE TRIGGER batallas_after_insert_notify
AFTER INSERT ON batallas
FOR EACH ROW
EXECUTE FUNCTION trg_batallas_created_notify();

-- Configurar las variables de sistema necesarias
-- IMPORTANTE: Reemplazar estos valores con los reales de tu proyecto
DO $$
BEGIN
  -- URL de Supabase (reemplazar con la real)
  PERFORM set_config('app.supabase_url', current_setting('SUPABASE_URL', true), false);
  
  -- Secret del hook (debe coincidir con BATTLE_CREATED_HOOK_SECRET)
  PERFORM set_config('app.battle_hook_secret', current_setting('BATTLE_CREATED_HOOK_SECRET', true), false);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No se pudieron configurar las GUCs automáticamente. Ejecutar manualmente:';
    RAISE NOTICE 'SELECT set_config(''app.supabase_url'', ''https://mpseoscrzpnequwvzokn.supabase.co'', false);';
    RAISE NOTICE 'SELECT set_config(''app.battle_hook_secret'', ''<TU_SECRET>'', false);';
END;
$$;

-- Comentarios para documentación
COMMENT ON FUNCTION trg_batallas_created_notify() IS 
'Trigger que envía notificación WhatsApp automática al crear una batalla programada';

COMMENT ON TRIGGER batallas_after_insert_notify ON batallas IS 
'Dispara notificación WhatsApp vía edge function battle-created cuando se inserta una batalla con estado=programada';
