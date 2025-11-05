-- ============================================================================
-- SOULLATINO WHATSAPP INTEGRATION - SCHEMA COMPLETO
-- ============================================================================

-- 1.1 Cola de envíos WhatsApp
CREATE TABLE IF NOT EXISTS public.battle_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batalla_id UUID NOT NULL REFERENCES public.batallas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|sent|failed
  enqueued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  intentos INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS battle_queue_status_idx ON public.battle_queue(status);
CREATE INDEX IF NOT EXISTS battle_queue_enqueued_idx ON public.battle_queue(enqueued_at);

-- 1.2 Logs WhatsApp
CREATE TABLE IF NOT EXISTS public.logs_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batalla_id UUID,
  telefono TEXT,
  mensaje_enviado TEXT,
  respuesta JSONB,
  twilio_message_sid TEXT,
  twilio_status TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS logs_whatsapp_batalla_idx ON public.logs_whatsapp(batalla_id);
CREATE INDEX IF NOT EXISTS logs_whatsapp_created_idx ON public.logs_whatsapp(created_at);

-- 1.3 Agregar columnas auxiliares a batallas (si no existen)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='batallas' AND column_name='notificacion_enviada'
  ) THEN
    ALTER TABLE public.batallas ADD COLUMN notificacion_enviada BOOLEAN DEFAULT false;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

-- 1.4 Asegurar que created_at y updated_at existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='batallas' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.batallas ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='batallas' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.batallas ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

-- 1.5 Función de trigger para encolar batallas programadas
CREATE OR REPLACE FUNCTION public.trg_enqueue_battle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo encolar si es programada y no está ya encolada
  IF NEW.estado = 'programada' THEN
    -- Verificar si ya existe en cola (evitar duplicados en UPDATE)
    IF NOT EXISTS (
      SELECT 1 FROM public.battle_queue 
      WHERE batalla_id = NEW.id AND status IN ('pending', 'sent')
    ) THEN
      INSERT INTO public.battle_queue (batalla_id, status)
      VALUES (NEW.id, 'pending');
      RAISE NOTICE '[TRIGGER] Encolada batalla % (estado=%).', NEW.id, NEW.estado;
    END IF;
  ELSE
    RAISE NOTICE '[TRIGGER] No encolada batalla %, estado=%.', NEW.id, NEW.estado;
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger anterior y crear nuevo
DROP TRIGGER IF EXISTS batallas_enqueue ON public.batallas;

CREATE TRIGGER batallas_enqueue
AFTER INSERT OR UPDATE ON public.batallas
FOR EACH ROW
WHEN (NEW.estado = 'programada')
EXECUTE FUNCTION public.trg_enqueue_battle();

-- 1.6 Vista de monitoreo de cola
CREATE OR REPLACE VIEW public.v_battle_queue_monitor AS
SELECT 
  q.id,
  q.batalla_id,
  q.status,
  q.enqueued_at,
  q.processed_at,
  q.intentos,
  q.last_error,
  b.fecha,
  b.hora,
  b.oponente,
  b.tipo,
  b.estado,
  b.guantes,
  b.reto,
  b.notificacion_enviada,
  c.nombre as creator_nombre,
  c.telefono as creator_telefono
FROM public.battle_queue q
JOIN public.batallas b ON b.id = q.batalla_id
LEFT JOIN public.creators c ON c.id = b.creator_id
ORDER BY q.enqueued_at DESC;

-- RLS Policies para nuevas tablas
ALTER TABLE public.battle_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_whatsapp ENABLE ROW LEVEL SECURITY;

-- Admin/Manager pueden ver cola
CREATE POLICY "queue_read" ON public.battle_queue
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'viewer'::app_role)
  );

-- Admin/Manager pueden ver logs
CREATE POLICY "logs_read" ON public.logs_whatsapp
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'viewer'::app_role)
  );

-- System puede escribir en cola y logs
CREATE POLICY "queue_system_write" ON public.battle_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "logs_system_write" ON public.logs_whatsapp
  FOR INSERT
  WITH CHECK (true);