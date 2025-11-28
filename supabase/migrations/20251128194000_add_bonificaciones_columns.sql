-- Add missing columns to creator_bonificaciones table
-- Run this in Supabase SQL Editor

ALTER TABLE creator_bonificaciones
ADD COLUMN IF NOT EXISTS dias_extra_22 integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bono_extra_usd numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bono_dias_extra_usd numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS dias_restantes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS req_diam_por_dia integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS req_horas_por_dia numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS proximo_objetivo_tipo text,
ADD COLUMN IF NOT EXISTS proximo_objetivo_valor text,
ADD COLUMN IF NOT EXISTS es_prioridad_300k boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cerca_de_objetivo boolean DEFAULT false,

-- Hitos
ADD COLUMN IF NOT EXISTS hito_12d_40h boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hito_20d_60h boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS hito_22d_80h boolean DEFAULT false,

-- Graduaciones
ADD COLUMN IF NOT EXISTS grad_100k boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS grad_300k boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS grad_500k boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS grad_1m boolean DEFAULT false,

-- Semáforos 100k
ADD COLUMN IF NOT EXISTS semaforo_100k text,
ADD COLUMN IF NOT EXISTS faltan_100k integer,
ADD COLUMN IF NOT EXISTS req_diam_por_dia_100k integer,
ADD COLUMN IF NOT EXISTS fecha_estimada_100k date,

-- Semáforos 300k
ADD COLUMN IF NOT EXISTS semaforo_300k text,
ADD COLUMN IF NOT EXISTS faltan_300k integer,
ADD COLUMN IF NOT EXISTS req_diam_por_dia_300k integer,
ADD COLUMN IF NOT EXISTS fecha_estimada_300k date,

-- Semáforos 500k
ADD COLUMN IF NOT EXISTS semaforo_500k text,
ADD COLUMN IF NOT EXISTS faltan_500k integer,
ADD COLUMN IF NOT EXISTS req_diam_por_dia_500k integer,
ADD COLUMN IF NOT EXISTS fecha_estimada_500k date,

-- Semáforos 1M
ADD COLUMN IF NOT EXISTS semaforo_1m text,
ADD COLUMN IF NOT EXISTS faltan_1m integer,
ADD COLUMN IF NOT EXISTS req_diam_por_dia_1m integer,
ADD COLUMN IF NOT EXISTS fecha_estimada_1m date,

-- Textos y metadatos
ADD COLUMN IF NOT EXISTS texto_creador text,
ADD COLUMN IF NOT EXISTS texto_manager text,
ADD COLUMN IF NOT EXISTS meta_recomendada text,
ADD COLUMN IF NOT EXISTS fecha_calculo date,
ADD COLUMN IF NOT EXISTS es_nuevo_menos_90_dias boolean DEFAULT false;

-- Refresh schema cache (Supabase specific)
NOTIFY pgrst, 'reload config';
