-- ================================================================
-- SCRIPTS DE PREPARACIÓN PARA PRODUCCIÓN - SOULLATINO ANALYTICS
-- Fecha: 2025-11-22
-- Ejecutar en orden antes de deploy
-- ================================================================

-- ================================================================
-- PASO 1: LIMPIEZA DE DATOS - Campo "nombre" con IDs numéricos
-- ================================================================

-- 1.1 Identificar creadores con nombres corruptos (IDs numéricos)
SELECT 
  id, 
  creator_id, 
  nombre, 
  tiktok_username,
  CASE 
    WHEN nombre ~ '^\d{10,}$' THEN '❌ ID numérico'
    WHEN nombre LIKE 'ID_%' THEN '❌ Prefijo ID_'
    ELSE '✅ OK'
  END as estado_nombre
FROM creators 
WHERE nombre ~ '^\d{10,}$' OR nombre LIKE 'ID_%'
ORDER BY nombre;

-- 1.2 Corregir usando tiktok_username si está disponible
UPDATE creators 
SET nombre = tiktok_username,
    updated_at = NOW()
WHERE nombre ~ '^\d{10,}$' 
  AND tiktok_username IS NOT NULL 
  AND tiktok_username !~ '^\d{10,}$'
  AND tiktok_username != '';

-- 1.3 Para los que no tienen tiktok_username válido, marcar claramente
UPDATE creators 
SET nombre = 'Sin nombre - ' || SUBSTRING(creator_id, 1, 12),
    updated_at = NOW()
WHERE nombre ~ '^\d{10,}$' 
  AND (tiktok_username IS NULL OR tiktok_username ~ '^\d{10,}$' OR tiktok_username = '');

-- 1.4 Verificar resultado
SELECT 
  COUNT(*) as total_creadores,
  COUNT(*) FILTER (WHERE nombre ~ '^\d{10,}$') as con_id_numerico,
  COUNT(*) FILTER (WHERE tiktok_username IS NOT NULL AND tiktok_username != '') as con_username,
  COUNT(*) FILTER (WHERE nombre LIKE 'Sin nombre%') as sin_nombre_valido
FROM creators;

-- ================================================================
-- PASO 2: RESOLVER VISTAS SECURITY DEFINER
-- ================================================================

-- 2.1 Identificar vistas con SECURITY DEFINER
SELECT 
  schemaname, 
  viewname,
  definition
FROM pg_views 
WHERE schemaname = 'public'
  AND definition ILIKE '%security_definer%';

-- 2.2 Cambiar a SECURITY INVOKER (ejecutar para cada vista encontrada)
-- NOTA: Reemplazar [nombre_vista] con el nombre real de las vistas encontradas arriba

-- ALTER VIEW public.[nombre_vista_1] SET (security_invoker = true);
-- ALTER VIEW public.[nombre_vista_2] SET (security_invoker = true);

-- Ejemplo si la vista se llama "v_creator_summary":
-- ALTER VIEW public.v_creator_summary SET (security_invoker = true);

-- 2.3 Verificar que RLS se aplica correctamente después del cambio
-- Probar con usuario de rol 'viewer' que solo pueda ver sus creadores asignados

-- ================================================================
-- PASO 3: AÑADIR CONSTRAINT UNIQUE PARA PREVENIR DUPLICADOS
-- ================================================================

-- 3.1 Verificar si hay duplicados actuales
SELECT 
  creator_id, 
  fecha, 
  COUNT(*) as duplicados
FROM creator_daily_stats
GROUP BY creator_id, fecha
HAVING COUNT(*) > 1;

-- 3.2 Si hay duplicados, eliminar (conservar el más reciente)
DELETE FROM creator_daily_stats
WHERE id NOT IN (
  SELECT DISTINCT ON (creator_id, fecha) id
  FROM creator_daily_stats
  ORDER BY creator_id, fecha, created_at DESC
);

-- 3.3 Añadir constraint UNIQUE
ALTER TABLE creator_daily_stats 
ADD CONSTRAINT uk_creator_daily_stats_creator_fecha 
UNIQUE (creator_id, fecha);

-- ================================================================
-- PASO 4: ÍNDICES ADICIONALES PARA PERFORMANCE
-- ================================================================

-- 4.1 Índice compuesto para queries de stats por creador + fecha
CREATE INDEX IF NOT EXISTS idx_creator_daily_stats_creator_fecha 
ON creator_daily_stats(creator_id, fecha DESC);

-- 4.2 Índice compuesto para queries de bonificaciones
CREATE INDEX IF NOT EXISTS idx_creator_bonificaciones_creator_mes 
ON creator_bonificaciones(creator_id, mes_referencia DESC);

-- 4.3 Índice compuesto para batallas
CREATE INDEX IF NOT EXISTS idx_batallas_creator_estado_fecha 
ON batallas(creator_id, estado, fecha DESC);

-- 4.4 Índice para búsqueda de supervisión por creator + fecha
CREATE INDEX IF NOT EXISTS idx_supervision_logs_creator_fecha 
ON supervision_live_logs(creator_id, fecha_evento DESC);

-- 4.5 Verificar uso de índices
-- Ejecutar EXPLAIN ANALYZE en queries críticas para confirmar que los índices se usan

-- ================================================================
-- PASO 5: CONFIGURAR REFRESH AUTOMÁTICO DE VISTAS MATERIALIZADAS
-- ================================================================

-- 5.1 Crear función para refresh diario
CREATE OR REPLACE FUNCTION public.daily_refresh_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Refresh de mv_leaderboard_actual
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_leaderboard_actual;
  
  -- Refresh de recommendations_today (si existe)
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.recommendations_today;
  
  RAISE NOTICE 'Materialized views refreshed successfully';
END;
$$;

-- 5.2 Programar ejecución diaria (hacer manualmente en Supabase Dashboard)
-- Ir a: Database → Cron Jobs → Add Job
-- Schedule: 0 2 * * * (todos los días a las 2 AM)
-- Function: public.daily_refresh_materialized_views()

-- ================================================================
-- PASO 6: ASIGNAR ROLES A USUARIOS INICIALES
-- ================================================================

-- 6.1 Obtener UUIDs de usuarios de auth.users (requiere SUPABASE_SERVICE_ROLE_KEY)
-- Ejecutar desde Supabase SQL Editor:
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at 
LIMIT 10;

-- 6.2 Asignar rol ADMIN al usuario principal
-- REEMPLAZAR 'TU_USER_UUID_AQUI' con el UUID real del usuario admin
INSERT INTO public.user_roles (user_id, role) 
VALUES ('TU_USER_UUID_AQUI', 'admin'::app_role)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin'::app_role;

-- 6.3 Asignar rol MANAGER a managers
-- Ejecutar una línea por cada manager, reemplazando UUIDs
-- INSERT INTO public.user_roles (user_id, role) VALUES ('UUID_MANAGER_1', 'manager'::app_role);
-- INSERT INTO public.user_roles (user_id, role) VALUES ('UUID_MANAGER_2', 'manager'::app_role);

-- 6.4 Verificar roles asignados
SELECT 
  ur.user_id,
  u.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY ur.role, u.email;

-- ================================================================
-- PASO 7: VALIDAR RLS (Row Level Security)
-- ================================================================

-- 7.1 Probar RLS con usuario de cada rol
-- Conectarse con JWT de usuario 'viewer' y ejecutar:
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims.sub = 'UUID_DEL_VIEWER';

SELECT COUNT(*) FROM creators; -- Debe retornar datos
SELECT COUNT(*) FROM creator_bonificaciones; -- Debe retornar datos
SELECT COUNT(*) FROM user_roles; -- Solo debe retornar 1 (su propio rol)

-- Intentar INSERT (debe fallar para 'viewer'):
INSERT INTO creators (creator_id, nombre) VALUES ('test', 'test'); -- Error esperado

-- 7.2 Probar con usuario sin rol (debe fallar todo)
SET LOCAL request.jwt.claims.sub = 'UUID_SIN_ROL';
SELECT COUNT(*) FROM creators; -- Debe retornar 0 o error

-- ================================================================
-- PASO 8: LIMPIEZA DE DATOS HUÉRFANOS (Opcional)
-- ================================================================

-- 8.1 Identificar registros huérfanos en creator_daily_stats
SELECT 
  cds.creator_id,
  cds.fecha,
  COUNT(*) as registros
FROM creator_daily_stats cds
LEFT JOIN creators c ON c.id = cds.creator_id
WHERE c.id IS NULL
GROUP BY cds.creator_id, cds.fecha;

-- 8.2 Eliminar registros huérfanos (CUIDADO: backup antes)
-- DELETE FROM creator_daily_stats
-- WHERE creator_id NOT IN (SELECT id FROM creators);

-- ================================================================
-- PASO 9: VERIFICACIÓN FINAL
-- ================================================================

-- 9.1 Contar registros en tablas principales
SELECT 
  'creators' as tabla, COUNT(*) as registros FROM creators
UNION ALL
SELECT 'creator_daily_stats', COUNT(*) FROM creator_daily_stats
UNION ALL
SELECT 'creator_bonificaciones', COUNT(*) FROM creator_bonificaciones
UNION ALL
SELECT 'batallas', COUNT(*) FROM batallas
UNION ALL
SELECT 'supervision_live_logs', COUNT(*) FROM supervision_live_logs
UNION ALL
SELECT 'user_roles', COUNT(*) FROM user_roles;

-- 9.2 Verificar último cálculo de bonificaciones
SELECT 
  mes_referencia,
  COUNT(*) as creadores_calculados,
  MAX(fecha_calculo) as ultima_actualizacion,
  AVG(diam_live_mes) as avg_diamantes,
  AVG(dias_live_mes) as avg_dias
FROM creator_bonificaciones
GROUP BY mes_referencia
ORDER BY mes_referencia DESC
LIMIT 3;

-- 9.3 Verificar que TODAS las tablas sensibles tienen RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'creators', 'creator_daily_stats', 'creator_bonificaciones',
    'batallas', 'supervision_live_logs', 'user_roles',
    'creator_interactions', 'creator_metas'
  )
ORDER BY tablename;

-- 9.4 Verificar que NO hay funciones sin search_path
SELECT 
  p.proname as function_name,
  p.prosecdef as is_security_definer,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- Solo SECURITY DEFINER
  AND pg_get_functiondef(p.oid) NOT ILIKE '%set search_path%'
ORDER BY p.proname;

-- ================================================================
-- FIN DE SCRIPTS DE PRODUCCIÓN
-- ================================================================

-- 📋 CHECKLIST POST-EJECUCIÓN:
-- [ ] Paso 1: Limpieza de nombres ejecutada y verificada
-- [ ] Paso 2: SECURITY DEFINER views resueltas
-- [ ] Paso 3: Constraint UNIQUE añadido
-- [ ] Paso 4: Índices adicionales creados
-- [ ] Paso 5: Refresh automático de MVs configurado
-- [ ] Paso 6: Roles asignados a usuarios iniciales
-- [ ] Paso 7: RLS validado con usuarios de prueba
-- [ ] Paso 8: Datos huérfanos limpiados (si aplica)
-- [ ] Paso 9: Verificación final pasada sin errores

-- 🎉 RESULTADO: Base de datos lista para producción
