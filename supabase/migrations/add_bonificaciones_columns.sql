-- 1. Crear tabla base si no existe
CREATE TABLE IF NOT EXISTS creator_bonificaciones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    creator_id uuid, -- Se puede agregar REFERENCES creators(creator_id) si se desea integridad estricta
    mes_referencia date
);

-- 2. Agregar TODAS las columnas necesarias (una por una para evitar errores)
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS dias_extra_22 integer DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS bono_extra_usd numeric DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS bono_dias_extra_usd numeric DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS dias_restantes integer DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS req_diam_por_dia integer DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS req_horas_por_dia numeric DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS proximo_objetivo_tipo text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS proximo_objetivo_valor text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS es_prioridad_300k boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS cerca_de_objetivo boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS hito_12d_40h boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS hito_20d_60h boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS hito_22d_80h boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS grad_100k boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS grad_300k boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS grad_500k boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS grad_1m boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS semaforo_100k text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS faltan_100k integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS req_diam_por_dia_100k integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS fecha_estimada_100k date;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS semaforo_300k text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS faltan_300k integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS req_diam_por_dia_300k integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS fecha_estimada_300k date;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS semaforo_500k text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS faltan_500k integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS req_diam_por_dia_500k integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS fecha_estimada_500k date;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS semaforo_1m text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS faltan_1m integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS req_diam_por_dia_1m integer;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS fecha_estimada_1m date;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS texto_creador text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS texto_manager text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS meta_recomendada text;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS fecha_calculo date;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS es_nuevo_menos_90_dias boolean DEFAULT false;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS dias_mtd integer DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS horas_mtd numeric DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS diamantes_mtd integer DEFAULT 0;
ALTER TABLE creator_bonificaciones ADD COLUMN IF NOT EXISTS nivel_alcanzado text;

-- 3. Habilitar permisos
ALTER TABLE creator_bonificaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'creator_bonificaciones' 
        AND policyname = 'Service role full access'
    ) THEN
        CREATE POLICY "Service role full access" ON creator_bonificaciones
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- 4. Recargar caché de Supabase
NOTIFY pgrst, 'reload config';

-- 5. Activar CRON
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'daily-recompute',
  '0 12 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://fhboambxnmswtxalllnn.supabase.co/functions/v1/cron-daily-recompute',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE"}'::jsonb
    ) as request_id;
  $$
);