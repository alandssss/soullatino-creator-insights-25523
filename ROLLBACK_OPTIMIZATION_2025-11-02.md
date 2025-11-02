# Plan de Rollback - Optimización Quirúrgica 2025-11-02

## Resumen
Este documento describe cómo revertir los cambios aplicados en la optimización quirúrgica del módulo de bonificaciones.

## Estado: ✅ COMPLETADO
- Migración SQL: Añadidas 24 columnas + índices
- Edge Functions: Actualizadas con cálculo extendido
- Frontend: Añadidos fallbacks null-safe
- Limpieza: Eliminado workflow inválido

---

## ROLLBACK SQL (SI ES NECESARIO)

### Revertir Migración de Columnas
```sql
-- Eliminar columnas añadidas (NO RECOMENDADO - se perderían datos)
ALTER TABLE public.creator_bonificaciones 
  DROP COLUMN IF EXISTS semaforo_50k,
  DROP COLUMN IF EXISTS semaforo_100k,
  DROP COLUMN IF EXISTS semaforo_300k,
  DROP COLUMN IF EXISTS semaforo_500k,
  DROP COLUMN IF EXISTS semaforo_1m,
  DROP COLUMN IF EXISTS faltan_50k,
  DROP COLUMN IF EXISTS faltan_100k,
  DROP COLUMN IF EXISTS faltan_300k,
  DROP COLUMN IF EXISTS faltan_500k,
  DROP COLUMN IF EXISTS faltan_1m,
  DROP COLUMN IF EXISTS req_diam_por_dia_50k,
  DROP COLUMN IF EXISTS req_diam_por_dia_100k,
  DROP COLUMN IF EXISTS req_diam_por_dia_300k,
  DROP COLUMN IF EXISTS req_diam_por_dia_500k,
  DROP COLUMN IF EXISTS req_diam_por_dia_1m,
  DROP COLUMN IF EXISTS fecha_estimada_50k,
  DROP COLUMN IF EXISTS fecha_estimada_100k,
  DROP COLUMN IF EXISTS fecha_estimada_300k,
  DROP COLUMN IF EXISTS fecha_estimada_500k,
  DROP COLUMN IF EXISTS fecha_estimada_1m,
  DROP COLUMN IF EXISTS texto_creador,
  DROP COLUMN IF EXISTS texto_manager,
  DROP COLUMN IF EXISTS meta_recomendada,
  DROP COLUMN IF EXISTS fecha_calculo,
  DROP COLUMN IF EXISTS es_nuevo_menos_90_dias,
  DROP COLUMN IF EXISTS bono_dias_extra_usd;

-- Eliminar índices creados
DROP INDEX IF EXISTS public.idx_bonif_mes_diam;
DROP INDEX IF EXISTS public.idx_creators_phone;
```

---

## ROLLBACK EDGE FUNCTIONS

### calculate-bonificaciones-predictivo
**Archivo:** `supabase/functions/calculate-bonificaciones-predictivo/index.ts`

**Revertir líneas 146-217:**
```typescript
// ANTES (versión original)
      // Cerca de objetivo (< 15% faltante)
      const cerca_de_objetivo = faltante > 0 && faltante < (parseInt(proximo_objetivo_valor) * 0.15);

      return {
        creator_id: creator.id,
        mes_referencia: mesRef,
        dias_live_mes,
        horas_live_mes,
        diam_live_mes,
        dias_restantes: diasRestantes,
        hito_12d_40h,
        hito_20d_60h,
        hito_22d_80h,
        grad_50k,
        grad_100k,
        grad_300k,
        grad_500k,
        grad_1m,
        dias_extra_22,
        bono_extra_usd,
        req_diam_por_dia,
        req_horas_por_dia,
        proximo_objetivo_tipo,
        proximo_objetivo_valor,
        es_prioridad_300k,
        cerca_de_objetivo
      };
```

### calculate-all-bonificaciones
**Archivo:** `supabase/functions/calculate-all-bonificaciones/index.ts`

**Opción 1 (RECOMENDADO): Mantener redirección**
- No hacer nada. La redirección es segura y mantiene compatibilidad.

**Opción 2 (NO RECOMENDADO): Restaurar código original**
- Usar `git checkout` del commit anterior a esta optimización
- Restaurar el archivo completo con su lógica original

---

## ROLLBACK FRONTEND

### BonificacionesPanel.tsx
**Archivo:** `src/components/BonificacionesPanel.tsx`

**Cambios a revertir:**

1. **Líneas 177-192** - Revertir a:
```typescript
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-lg">{bonificacion.meta_recomendada || "Sin meta"}</p>
                  {bonificacion.cerca_de_objetivo && (
                    <Badge variant="default">¡Cerca!</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {bonificacion.texto_creador || "Calculando progreso..."}
                </p>
                {bonificacion.texto_manager && (
                  <p className="text-xs text-muted-foreground/80 italic border-t border-border/30 pt-2">
                    📋 Manager: {bonificacion.texto_manager}
                  </p>
                )}
              </div>
```

2. **Líneas 200-230** - Revertir accesos a propiedades (quitar `?.`)

3. **Líneas 282-283** - Revertir a:
```typescript
            {(bonificacion.bono_dias_extra_usd > 0 || bonificacion.bono_extra_usd > 0) && (
```

4. **Líneas 304-305** - Revertir a:
```typescript
            {bonificacion.es_nuevo_menos_90_dias && (
```

5. **Líneas 316-319** - Revertir a:
```typescript
            <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
              Última actualización: {new Date(bonificacion.fecha_calculo).toLocaleDateString('es-MX')}
            </div>
```

---

## ROLLBACK LIMPIEZA

### Restaurar workflow eliminado
**Archivo:** `.github/workflows/refresh-mv-daily.yml`

**Acción:** Restaurar desde Git
```bash
git checkout HEAD~1 -- .github/workflows/refresh-mv-daily.yml
```

**⚠️ NOTA:** Este workflow invocaba RPCs inexistentes, por lo que restaurarlo causará errores.

---

## VALIDACIÓN POST-ROLLBACK

### Checklist de verificación:
1. ✅ Compilación exitosa: `npm run build`
2. ✅ TypeScript sin errores: `tsc --noEmit`
3. ✅ Edge functions desplegadas: `supabase functions list`
4. ✅ Frontend carga sin errores en consola
5. ✅ Panel de bonificaciones muestra datos correctamente
6. ✅ Queries SQL funcionan sin errores de columnas faltantes

---

## NOTAS IMPORTANTES

### ⚠️ NO SE RECOMIENDA ROLLBACK COMPLETO
- Las columnas añadidas NO rompen funcionalidad existente
- Los fallbacks frontend son defensivos y mejoran estabilidad
- La redirección en `calculate-all-bonificaciones` mantiene compatibilidad

### ✅ ROLLBACK PARCIAL SEGURO
Si solo necesitas revertir parte de los cambios:
1. **Mantén la migración SQL** (columnas son útiles aunque no se calculen)
2. **Mantén los fallbacks frontend** (mejoran robustez)
3. **Revertir solo la lógica de cálculo** en `calculate-bonificaciones-predictivo` si es necesario

### 🔄 ROLLBACK vs. FIX FORWARD
En caso de bug, se recomienda **FIX FORWARD** (corregir hacia adelante) en lugar de rollback completo:
- Ajustar cálculos específicos que fallen
- Mantener estructura de columnas
- Preservar mejoras de estabilidad

---

## CONTACTO
Para dudas sobre este rollback: Consultar con el equipo de desarrollo.

**Fecha:** 2025-11-02  
**Autor:** Optimizador Quirúrgico  
**Versión:** 1.0
