-- ============================================================================
-- Script: Limpieza de datos corruptos de Noviembre 2025
-- Propósito: Eliminar datos acumulados incorrectamente antes de re-subir Excel
-- Fecha: 2025-11-26
-- ============================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- - Los datos de noviembre 2025 en creator_daily_stats están duplicados/acumulados
-- - Ejemplo: charromzt tiene 6.5M diamantes (debería ser ~2M)
-- - Las horas están 6-7x infladas (800h en lugar de ~130h)
-- - Los días están incorrectos (6 en lugar de 19-24)
--
-- CAUSA RAÍZ:
-- - La función upload-excel-recommendations acumulaba valores en lugar de reemplazarlos
-- - Cada upload sumaba en lugar de sustituir el snapshot MTD
--
-- SOLUCIÓN:
-- 1. Ejecutar este script para limpiar datos corruptos
-- 2. Usar la versión corregida del edge function (con aliases correctos)
-- 3. Re-subir el Excel creadore_sal_di_a25_de_nov.xlsx
-- 4. Ejecutar calculate-bonificaciones para recalcular métricas MTD
-- ============================================================================

-- Paso 1: Respaldar datos actuales (opcional, para auditoría)
-- CREATE TABLE IF NOT EXISTS creator_daily_stats_backup_nov_2025 AS
-- SELECT * FROM creator_daily_stats WHERE fecha >= '2025-11-01' AND fecha < '2025-12-01';

-- Paso 2: Eliminar todos los registros de noviembre 2025 en creator_daily_stats
DELETE FROM creator_daily_stats 
WHERE fecha >= '2025-11-01' AND fecha < '2025-12-01';

-- Paso 3: Eliminar cálculos de bonificaciones de noviembre 2025
DELETE FROM creator_bonificaciones 
WHERE mes_referencia = '2025-11-01';

-- Verificación de limpieza
SELECT 
  'creator_daily_stats' as tabla,
  COUNT(*) as registros_restantes
FROM creator_daily_stats 
WHERE fecha >= '2025-11-01' AND fecha < '2025-12-01'

UNION ALL

SELECT 
  'creator_bonificaciones' as tabla,
  COUNT(*) as registros_restantes
FROM creator_bonificaciones 
WHERE mes_referencia = '2025-11-01';

-- Resultado esperado: 0 registros en ambas tablas para noviembre 2025
-- ============================================================================
-- SIGUIENTE PASO: Re-subir Excel con edge function corregido
-- ============================================================================
