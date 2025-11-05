-- Corregir función trigger para usar edge function send-batalla correcto
CREATE OR REPLACE FUNCTION public.trg_batallas_created_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cambio_relevante BOOLEAN := false;
  supabase_url TEXT := 'https://rgypfqxiqeymltbinkvs.supabase.co';
  service_key TEXT;
BEGIN
  -- Obtener service role key desde secrets
  -- En triggers de Supabase, usamos el service role key hardcodeado
  -- ya que current_setting no puede acceder a los secrets de Supabase
  service_key := current_setting('request.jwt.claims', true)::json->>'role';
  
  -- Para triggers, Supabase no expone secrets, así que usamos una aproximación:
  -- El edge function send-batalla valida con SUPABASE_SERVICE_ROLE_KEY
  -- Aquí simplemente enviamos la petición sin Authorization o con un token temporal
  -- El edge function debe ser público o validar de otra forma
  
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
    END IF;
  END IF;
  
  -- Enviar notificación si hay cambio relevante
  IF cambio_relevante THEN
    BEGIN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/send-batalla',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJneXBmcXhpcWV5bWx0Ymlua3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NDU1MjksImV4cCI6MjA0NjQyMTUyOX0.N9z9Q2LvFgLaRKIkPq9HdI4YbQGlVJGGCRZxqJHCWvE'
        ),
        body := jsonb_build_object(
          'batallaId', NEW.id::text
        )
      );
      RAISE NOTICE '[trg_batallas] Notification sent to send-batalla for batalla % (operation: %)', NEW.id, TG_OP;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[trg_batallas] Failed to send notification for batalla %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;