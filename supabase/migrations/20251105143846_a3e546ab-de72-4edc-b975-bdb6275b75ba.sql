-- Solución alternativa: Hardcodear valores en el trigger
-- (igual que hicimos en los edge functions con el portal URL)

CREATE OR REPLACE FUNCTION public.trg_batallas_created_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cambio_relevante BOOLEAN := false;
  supabase_url TEXT := 'https://mpseoscrzpnequwvzokn.supabase.co';
  hook_secret TEXT;
BEGIN
  -- Obtener el secret desde la configuración
  BEGIN
    hook_secret := current_setting('app.battle_hook_secret', true);
  EXCEPTION
    WHEN OTHERS THEN
      hook_secret := NULL;
  END;

  -- Si no hay secret configurado, usar valor por defecto (el edge function validará con su BATTLE_CREATED_HOOK_SECRET)
  -- Esto es temporal hasta que podamos configurar GUC
  IF hook_secret IS NULL THEN
    RAISE WARNING '[trg_batallas] Battle hook secret not configured, using edge function validation';
    hook_secret := 'temp-will-be-validated-by-edge-function';
  END IF;

  -- Solo proceder si estado es "programada"
  IF (NEW.estado <> 'programada') THEN
    RAISE NOTICE '[trg_batallas] Batalla % no es programada (estado: %), skip', NEW.id, NEW.estado;
    RETURN NEW;
  END IF;
  
  -- Detectar si es INSERT o UPDATE con cambios relevantes
  IF (TG_OP = 'INSERT') THEN
    cambio_relevante := true;
    RAISE NOTICE '[trg_batallas] INSERT detectado para batalla %', NEW.id;
  ELSIF (TG_OP = 'UPDATE') THEN
    cambio_relevante := (
      OLD.fecha IS DISTINCT FROM NEW.fecha OR
      OLD.hora IS DISTINCT FROM NEW.hora OR
      OLD.oponente IS DISTINCT FROM NEW.oponente OR
      OLD.tipo IS DISTINCT FROM NEW.tipo OR
      OLD.guantes IS DISTINCT FROM NEW.guantes OR
      OLD.reto IS DISTINCT FROM NEW.reto OR
      OLD.estado IS DISTINCT FROM NEW.estado
    );
    IF cambio_relevante THEN
      RAISE NOTICE '[trg_batallas] UPDATE con cambios relevantes para batalla %', NEW.id;
    ELSE
      RAISE NOTICE '[trg_batallas] UPDATE sin cambios relevantes para batalla %', NEW.id;
    END IF;
  END IF;
  
  -- Enviar notificación si hay cambio relevante
  IF cambio_relevante THEN
    BEGIN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/battle-created',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || hook_secret
        ),
        body := jsonb_build_object(
          'batalla_id', NEW.id,
          'operation', TG_OP
        )
      );
      RAISE NOTICE '[trg_batallas] Notification sent successfully for batalla % (operation: %)', NEW.id, TG_OP;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[trg_batallas] Failed to send notification for batalla %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Crear trigger para UPDATE
DROP TRIGGER IF EXISTS batallas_notify_whatsapp_update ON public.batallas;
CREATE TRIGGER batallas_notify_whatsapp_update
  AFTER UPDATE ON public.batallas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_batallas_created_notify();

-- Verificar y crear trigger de INSERT si no existe
DROP TRIGGER IF EXISTS batallas_notify_whatsapp_insert ON public.batallas;
CREATE TRIGGER batallas_notify_whatsapp_insert
  AFTER INSERT ON public.batallas
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_batallas_created_notify();