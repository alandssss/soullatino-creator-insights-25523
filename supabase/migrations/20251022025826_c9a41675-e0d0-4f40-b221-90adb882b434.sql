-- Tablas faltantes para que el sistema funcione

-- Tabla de bonificaciones
CREATE TABLE IF NOT EXISTS public.creator_bonificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  dias_live_mes INTEGER DEFAULT 0,
  horas_live_mes NUMERIC DEFAULT 0,
  diam_live_mes NUMERIC DEFAULT 0,
  dias_restantes INTEGER DEFAULT 0,
  grad_50k BOOLEAN DEFAULT false,
  grad_100k BOOLEAN DEFAULT false,
  grad_300k BOOLEAN DEFAULT false,
  grad_500k BOOLEAN DEFAULT false,
  grad_1m BOOLEAN DEFAULT false,
  hito_12d_40h BOOLEAN DEFAULT false,
  hito_20d_60h BOOLEAN DEFAULT false,
  hito_22d_80h BOOLEAN DEFAULT false,
  dias_extra_22 INTEGER DEFAULT 0,
  bono_extra_usd NUMERIC DEFAULT 0,
  proximo_objetivo_tipo TEXT,
  proximo_objetivo_valor TEXT,
  req_diam_por_dia NUMERIC DEFAULT 0,
  req_horas_por_dia NUMERIC DEFAULT 0,
  es_prioridad_300k BOOLEAN DEFAULT false,
  cerca_de_objetivo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, mes_referencia)
);

ALTER TABLE public.creator_bonificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bonificaciones_read" ON public.creator_bonificaciones FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'viewer'));

-- Tabla de datos live diarios
CREATE TABLE IF NOT EXISTS public.creator_live_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  horas NUMERIC DEFAULT 0,
  diamantes NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, fecha)
);

ALTER TABLE public.creator_live_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_daily_read" ON public.creator_live_daily FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "live_daily_write" ON public.creator_live_daily FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Tabla de recomendaciones
CREATE TABLE IF NOT EXISTS public.creator_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  titulo TEXT,
  descripcion TEXT,
  tipo TEXT,
  prioridad TEXT,
  icono TEXT,
  activa BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creator_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_read" ON public.creator_recommendations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'viewer'));

-- Tabla de logs de supervisión
CREATE TABLE IF NOT EXISTS public.supervision_live_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  fecha_evento TIMESTAMPTZ DEFAULT now(),
  en_vivo BOOLEAN,
  en_batalla BOOLEAN,
  buena_iluminacion BOOLEAN,
  audio_claro BOOLEAN,
  set_profesional BOOLEAN,
  score INTEGER,
  riesgo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.supervision_live_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supervision_read" ON public.supervision_live_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'viewer'));

CREATE POLICY "supervision_write" ON public.supervision_live_logs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Agregar columna dias_en_agencia a creators
ALTER TABLE public.creators ADD COLUMN IF NOT EXISTS dias_en_agencia INTEGER DEFAULT 0;