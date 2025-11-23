-- Fase 3: Corregir días en agencia con función y trigger automático (CORREGIDO)

-- 1. Función para calcular días en agencia automáticamente
CREATE OR REPLACE FUNCTION calculate_dias_en_agencia()
RETURNS trigger AS $$
BEGIN
  -- Calcular días desde fecha_incorporacion hasta hoy (resta de fechas da integer directamente)
  IF NEW.fecha_incorporacion IS NOT NULL THEN
    NEW.dias_en_agencia := GREATEST(0, CURRENT_DATE - NEW.fecha_incorporacion::date);
  ELSE
    NEW.dias_en_agencia := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger para actualizar automáticamente en INSERT/UPDATE
DROP TRIGGER IF EXISTS update_dias_en_agencia ON creators;
CREATE TRIGGER update_dias_en_agencia
  BEFORE INSERT OR UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION calculate_dias_en_agencia();

-- 3. Actualizar todos los registros existentes
UPDATE creators
SET dias_en_agencia = GREATEST(0, CURRENT_DATE - fecha_incorporacion::date)
WHERE fecha_incorporacion IS NOT NULL;