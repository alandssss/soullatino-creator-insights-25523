-- Función de validación para detectar inconsistencias en bonificaciones
CREATE OR REPLACE FUNCTION check_bonificaciones_vs_daily_stats()
RETURNS trigger AS $$
DECLARE
  suma_real NUMERIC;
BEGIN
  -- Calcular suma real de creator_daily_stats para el mes
  SELECT COALESCE(SUM(diamantes), 0)
  INTO suma_real
  FROM creator_daily_stats
  WHERE creator_id = NEW.creator_id
    AND fecha >= DATE_TRUNC('month', NEW.mes_referencia::date)
    AND fecha <= (DATE_TRUNC('month', NEW.mes_referencia::date) + INTERVAL '1 month' - INTERVAL '1 day');
  
  -- Si la diferencia es > 5%, lanzar warning en logs
  IF ABS(NEW.diam_live_mes - suma_real) > (suma_real * 0.05) THEN
    RAISE WARNING 'Posible inconsistencia en bonificaciones: creator_id=%, diam_live_mes=%, suma_daily=%, diff=%', 
      NEW.creator_id, NEW.diam_live_mes, suma_real, (NEW.diam_live_mes - suma_real);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para validar datos antes de insertar/actualizar
DROP TRIGGER IF EXISTS validate_bonificaciones_data ON creator_bonificaciones;
CREATE TRIGGER validate_bonificaciones_data
  BEFORE INSERT OR UPDATE ON creator_bonificaciones
  FOR EACH ROW
  EXECUTE FUNCTION check_bonificaciones_vs_daily_stats();