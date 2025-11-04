-- FASE 1: Configurar Infraestructura Base para Notificaciones de Batallas

-- Paso 1: Eliminar trigger antiguo (solo INSERT)
DROP TRIGGER IF EXISTS batallas_after_insert_notify ON batallas;

-- Paso 2: Crear trigger combinado para INSERT y UPDATE
CREATE TRIGGER batallas_notify_whatsapp
AFTER INSERT OR UPDATE ON batallas
FOR EACH ROW
WHEN (NEW.estado = 'programada')
EXECUTE FUNCTION trg_batallas_created_notify();

-- Paso 3: Mejorar función del trigger con detección de cambios
CREATE OR REPLACE FUNCTION trg_batallas_created_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cambio_relevante BOOLEAN := false;
  supabase_url TEXT;
  hook_secret TEXT;
BEGIN
  -- Obtener configuración con manejo de errores
  BEGIN
    supabase_url := current_setting('app.supabase_url', true);
    hook_secret := current_setting('app.battle_hook_secret', true);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[trg_batallas] GUC variables not configured: %', SQLERRM;
      RETURN NEW;
  END;

  -- Validar configuración
  IF supabase_url IS NULL OR hook_secret IS NULL THEN
    RAISE WARNING '[trg_batallas] Missing GUC configuration for battle notifications';
    RETURN NEW;
  END IF;

  -- Solo proceder si estado es "programada"
  IF (NEW.estado <> 'programada') THEN
    RETURN NEW;
  END IF;
  
  -- Detectar si es INSERT o UPDATE con cambios relevantes
  IF (TG_OP = 'INSERT') THEN
    cambio_relevante := true;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Solo notificar si cambió algo importante
    cambio_relevante := (
      OLD.fecha IS DISTINCT FROM NEW.fecha OR
      OLD.hora IS DISTINCT FROM NEW.hora OR
      OLD.oponente IS DISTINCT FROM NEW.oponente OR
      OLD.tipo IS DISTINCT FROM NEW.tipo OR
      OLD.guantes IS DISTINCT FROM NEW.guantes OR
      OLD.reto IS DISTINCT FROM NEW.reto OR
      OLD.estado IS DISTINCT FROM NEW.estado
    );
  END IF;
  
  -- Solo enviar notificación si hay cambio relevante
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
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[trg_batallas] Failed to send notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_batallas_created_notify() IS 
'Trigger function para notificaciones WhatsApp de batallas.
Envía notificación cuando:
- Se crea una batalla programada (INSERT)
- Se actualiza una batalla con cambios en: fecha, hora, oponente, tipo, guantes, reto, estado
Requiere GUCs configuradas: app.supabase_url, app.battle_hook_secret';

-- Paso 4: Vista para monitorear creadores sin teléfono
CREATE OR REPLACE VIEW v_creators_sin_telefono AS
SELECT 
  id,
  nombre,
  tiktok_username,
  manager,
  agente,
  status,
  telefono,
  CASE
    WHEN telefono IS NULL OR telefono = '' THEN '❌ Sin teléfono'
    WHEN NOT telefono ~ '^\+\d{10,15}$' THEN '⚠️ Formato inválido'
    ELSE '✅ OK'
  END as estado_telefono
FROM creators
WHERE status = 'activo'
ORDER BY 
  CASE 
    WHEN telefono IS NULL OR telefono = '' THEN 1
    WHEN NOT telefono ~ '^\+\d{10,15}$' THEN 2
    ELSE 3
  END,
  nombre;

-- Paso 5: Vista para monitorear batallas pendientes de notificación
CREATE OR REPLACE VIEW v_batallas_pendientes_notificacion AS
SELECT 
  b.id as batalla_id,
  b.fecha,
  b.hora,
  b.estado,
  c.nombre as creador,
  c.tiktok_username,
  c.telefono,
  CASE 
    WHEN c.telefono IS NULL OR c.telefono = '' THEN '❌ Sin teléfono'
    WHEN NOT c.telefono ~ '^\+\d{10,15}$' THEN '⚠️ Formato inválido'
    ELSE '✅ Teléfono válido'
  END as estado_telefono,
  b.created_at as batalla_creada,
  wa.timestamp as notificacion_enviada,
  CASE
    WHEN wa.id IS NOT NULL THEN '✅ Notificada'
    WHEN c.telefono IS NULL OR c.telefono = '' THEN '❌ Sin teléfono'
    ELSE '⚠️ Pendiente'
  END as estado_notificacion
FROM batallas b
LEFT JOIN creators c ON b.creator_id = c.id
LEFT JOIN whatsapp_activity wa 
  ON wa.creator_id = c.id 
  AND wa.action_type = 'notificacion_creacion_batalla'
  AND wa.timestamp >= b.created_at
  AND wa.timestamp < b.created_at + INTERVAL '2 minutes'
WHERE b.estado = 'programada'
  AND b.created_at > NOW() - INTERVAL '30 days'
ORDER BY b.created_at DESC;