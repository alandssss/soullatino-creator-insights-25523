-- ============================================================================
-- FASE 1: MIGRACIÓN QUIRÚRGICA - Añadir columnas faltantes a creator_bonificaciones
-- Impacto: CERO breaking changes, solo adición de columnas nullable/con defaults
-- Reversible: ALTER TABLE DROP COLUMN para cada columna
-- ============================================================================

-- Semáforos por graduación (rojo/amarillo/verde)
ALTER TABLE public.creator_bonificaciones 
  ADD COLUMN IF NOT EXISTS semaforo_50k text DEFAULT 'rojo',
  ADD COLUMN IF NOT EXISTS semaforo_100k text DEFAULT 'rojo',
  ADD COLUMN IF NOT EXISTS semaforo_300k text DEFAULT 'rojo',
  ADD COLUMN IF NOT EXISTS semaforo_500k text DEFAULT 'rojo',
  ADD COLUMN IF NOT EXISTS semaforo_1m text DEFAULT 'rojo';

-- Faltantes por graduación
ALTER TABLE public.creator_bonificaciones 
  ADD COLUMN IF NOT EXISTS faltan_50k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faltan_100k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faltan_300k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faltan_500k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS faltan_1m numeric DEFAULT 0;

-- Requerido por día para cada graduación
ALTER TABLE public.creator_bonificaciones 
  ADD COLUMN IF NOT EXISTS req_diam_por_dia_50k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS req_diam_por_dia_100k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS req_diam_por_dia_300k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS req_diam_por_dia_500k numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS req_diam_por_dia_1m numeric DEFAULT 0;

-- Fechas estimadas de alcance
ALTER TABLE public.creator_bonificaciones 
  ADD COLUMN IF NOT EXISTS fecha_estimada_50k date,
  ADD COLUMN IF NOT EXISTS fecha_estimada_100k date,
  ADD COLUMN IF NOT EXISTS fecha_estimada_300k date,
  ADD COLUMN IF NOT EXISTS fecha_estimada_500k date,
  ADD COLUMN IF NOT EXISTS fecha_estimada_1m date;

-- Textos de coaching
ALTER TABLE public.creator_bonificaciones 
  ADD COLUMN IF NOT EXISTS texto_creador text,
  ADD COLUMN IF NOT EXISTS texto_manager text;

-- Meta recomendada y metadata
ALTER TABLE public.creator_bonificaciones 
  ADD COLUMN IF NOT EXISTS meta_recomendada text,
  ADD COLUMN IF NOT EXISTS fecha_calculo date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS es_nuevo_menos_90_dias boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bono_dias_extra_usd numeric DEFAULT 0;

-- ============================================================================
-- ÍNDICES para optimizar queries frecuentes
-- ============================================================================

-- Índice compuesto para query principal del panel (mes + ordenamiento por diamantes)
CREATE INDEX IF NOT EXISTS idx_bonif_mes_diam 
  ON public.creator_bonificaciones (mes_referencia, diam_live_mes DESC);

-- Índice para búsqueda por teléfono en creators (deduplicación frontend)
CREATE INDEX IF NOT EXISTS idx_creators_phone 
  ON public.creators (telefono) 
  WHERE telefono IS NOT NULL AND telefono <> '';

-- ============================================================================
-- COMENTARIOS de documentación
-- ============================================================================

COMMENT ON COLUMN public.creator_bonificaciones.semaforo_50k IS 'Estado del semáforo para graduación 50K: rojo/amarillo/verde';
COMMENT ON COLUMN public.creator_bonificaciones.texto_creador IS 'Mensaje de coaching para el creador';
COMMENT ON COLUMN public.creator_bonificaciones.texto_manager IS 'Nota interna para el manager';
COMMENT ON COLUMN public.creator_bonificaciones.meta_recomendada IS 'Meta sugerida para el mes (ej: "300K Diamantes")';
COMMENT ON COLUMN public.creator_bonificaciones.fecha_calculo IS 'Fecha en que se calcularon las bonificaciones';
COMMENT ON COLUMN public.creator_bonificaciones.bono_dias_extra_usd IS 'Alias de bono_extra_usd para compatibilidad frontend';