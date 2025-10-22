-- Agregar columnas faltantes a la tabla creators
ALTER TABLE public.creators 
ADD COLUMN IF NOT EXISTS diamantes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_live INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_live NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_month_diamantes NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_month_views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_month_engagement NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiktok_username TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS manager TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'activo',
ADD COLUMN IF NOT EXISTS graduacion TEXT,
ADD COLUMN IF NOT EXISTS hito_diamantes NUMERIC DEFAULT 100000,
ADD COLUMN IF NOT EXISTS dias_desde_inicio INTEGER DEFAULT 0;

-- Crear índice único en creator_id si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_creators_unique_creator_id'
  ) THEN
    CREATE UNIQUE INDEX idx_creators_unique_creator_id ON public.creators(creator_id);
  END IF;
END $$;

-- Crear tabla de interacciones con creadores
CREATE TABLE IF NOT EXISTS public.creator_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL,
  notas TEXT,
  admin_nombre TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creator_interactions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admin y Manager pueden ver interacciones" ON public.creator_interactions;
DROP POLICY IF EXISTS "Admin y Manager pueden crear interacciones" ON public.creator_interactions;

CREATE POLICY "Admin y Manager pueden ver interacciones"
ON public.creator_interactions FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admin y Manager pueden crear interacciones"
ON public.creator_interactions FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Crear tabla de actividad de WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action_type TEXT NOT NULL,
  message_preview TEXT,
  creator_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.whatsapp_activity ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admin y Manager pueden ver actividad WhatsApp" ON public.whatsapp_activity;
DROP POLICY IF EXISTS "Admin y Manager pueden crear actividad WhatsApp" ON public.whatsapp_activity;

CREATE POLICY "Admin y Manager pueden ver actividad WhatsApp"
ON public.whatsapp_activity FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admin y Manager pueden crear actividad WhatsApp"
ON public.whatsapp_activity FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Crear tabla de metas de creadores
CREATE TABLE IF NOT EXISTS public.creator_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE NOT NULL,
  meta_diamantes NUMERIC NOT NULL,
  meta_dias INTEGER,
  meta_horas NUMERIC,
  mes_referencia DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, mes_referencia)
);

ALTER TABLE public.creator_metas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Admin y Manager pueden ver metas" ON public.creator_metas;
DROP POLICY IF EXISTS "Admin y Manager pueden gestionar metas" ON public.creator_metas;

CREATE POLICY "Admin y Manager pueden ver metas"
ON public.creator_metas FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'viewer')
);

CREATE POLICY "Admin y Manager pueden gestionar metas"
ON public.creator_metas FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'manager')
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_creator_interactions_creator_id ON public.creator_interactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_interactions_created_at ON public.creator_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_activity_creator_id ON public.whatsapp_activity(creator_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_activity_timestamp ON public.whatsapp_activity(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_creator_metas_creator_mes ON public.creator_metas(creator_id, mes_referencia);