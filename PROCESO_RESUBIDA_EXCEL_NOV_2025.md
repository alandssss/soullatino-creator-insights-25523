# Proceso de Re-subida de Excel - Noviembre 2025

## 📋 Contexto

**Problema Identificado:**
- Los datos de noviembre 2025 están corruptos (diamantes 3x más altos, horas 6-7x infladas)
- Causa raíz: la función `upload-excel-recommendations` acumulaba valores en lugar de reemplazarlos
- Mapeo incorrecto de columnas del Excel real de TikTok

**Excel Correcto:**
- Archivo: `creadore_sal_di_a25_de_nov.xlsx`
- Fecha de datos: 25 de noviembre 2025
- Formato: Snapshot MTD (Month-To-Date) de TikTok

---

## 🔧 Correcciones Implementadas

### 1. Edge Function - Aliases Corregidos

**Archivo:** `supabase/functions/upload-excel-recommendations/index.ts`

**Cambios:**
```typescript
// Alias agregados:
"creator's username": 'creator_username',  // ← Excel real usa apóstrofe
'live duration': 'horas_actuales',         // ← Columna "LIVE duration"
```

**Antes:** No se mapeaban estas columnas → datos perdidos
**Después:** Mapeo correcto → datos completos

---

## 📝 Proceso de Re-subida (Paso a Paso)

### ✅ Paso 1: Limpiar Datos Corruptos

**Ejecutar script SQL:**
```bash
# Desde Lovable Cloud Backend / SQL Editor:
# Ejecutar: scripts/clean-november-2025-data.sql
```

**O manualmente:**
```sql
DELETE FROM creator_daily_stats WHERE fecha >= '2025-11-01' AND fecha < '2025-12-01';
DELETE FROM creator_bonificaciones WHERE mes_referencia = '2025-11-01';
```

**Verificación:**
```sql
-- Debe devolver 0 registros:
SELECT COUNT(*) FROM creator_daily_stats WHERE fecha >= '2025-11-01';
SELECT COUNT(*) FROM creator_bonificaciones WHERE mes_referencia = '2025-11-01';
```

---

### ✅ Paso 2: Re-subir Excel con Edge Function Corregido

**Desde la interfaz del CRM:**
1. Ir a **Admin → Cargas de Excel**
2. Subir archivo: `creadore_sal_di_a25_de_nov.xlsx`
3. Esperar confirmación de carga exitosa

**Logs esperados en la consola del edge function:**
```
[upload-excel-recommendations] Mapped X valid rows
[upload-excel-recommendations] Inserting X records with diamonds only
[upload-excel-recommendations] Successfully upserted X unique records
```

---

### ✅ Paso 3: Recalcular Bonificaciones

**Método 1 - Automático (Recomendado):**
El edge function `calculate-bonificaciones` se ejecuta automáticamente después del upload.

**Método 2 - Manual (si es necesario):**
```typescript
// Desde Admin Panel o ejecutar directamente:
const { data, error } = await supabase.functions.invoke('calculate-bonificaciones', {
  body: { mes_referencia: '2025-11-01' }
});
```

---

### ✅ Paso 4: Verificar Datos Correctos

**Casos de prueba (ejemplos del Excel):**

| Creator    | Diamantes Correctos | Días Correctos | Horas Correctas |
|------------|---------------------|----------------|-----------------|
| charromzt  | ~2,000,000         | 19-24          | 60-130h         |
| nicolmindaa| ~1,200,000         | 20-25          | 80-140h         |
| noahcr55   | ~900,000           | 18-23          | 50-100h         |

**Consulta SQL de verificación:**
```sql
SELECT 
  c.nombre,
  c.tiktok_username,
  b.diam_live_mes,
  b.dias_live_mes,
  b.horas_live_mes,
  b.mes_referencia
FROM creators c
LEFT JOIN creator_bonificaciones b ON c.id = b.creator_id
WHERE b.mes_referencia = '2025-11-01'
  AND c.tiktok_username IN ('charromzt', 'nicolmindaa', 'noahcr55')
ORDER BY b.diam_live_mes DESC;
```

**Valores esperados:**
- `diam_live_mes`: Entre 500K - 2M (NO 6M+)
- `dias_live_mes`: Entre 18-25 días (NO 6)
- `horas_live_mes`: Entre 50-150h (NO 400-800h)

---

## 🚨 Troubleshooting

### Problema: Columnas no mapeadas
**Síntoma:** Excel sube pero algunos creadores tienen 0 horas
**Solución:** Verificar que los aliases incluyan `"creator's username"` y `'live duration'`

### Problema: Datos aún duplicados
**Síntoma:** Diamantes siguen siendo 3x más altos
**Solución:** 
1. Verificar que el script SQL de limpieza se ejecutó correctamente
2. Confirmar que no hay registros duplicados en `creator_daily_stats` para la misma fecha

### Problema: Bonificaciones no se recalculan
**Síntoma:** Dashboard muestra datos viejos
**Solución:** Invocar manualmente `calculate-bonificaciones` desde Admin

---

## 📊 Validación Final

### Checklist de Validación:

- [ ] Script SQL de limpieza ejecutado exitosamente
- [ ] Excel re-subido sin errores en logs
- [ ] `calculate-bonificaciones` ejecutado sin errores
- [ ] Dashboard muestra diamantes correctos (~2M para top creator)
- [ ] Días live correctos (18-25 días)
- [ ] Horas live correctas (50-150h)
- [ ] Panel "Creadores con Baja Actividad" muestra datos coherentes
- [ ] Vista de Creator Profile muestra métricas MTD correctas

---

## 📅 Historial de Cambios

| Fecha      | Acción                                      | Resultado               |
|------------|---------------------------------------------|-------------------------|
| 2025-11-26 | Identificación de datos corruptos           | Análisis completado     |
| 2025-11-26 | Corrección de aliases en edge function      | Implementado            |
| 2025-11-26 | Creación de script SQL de limpieza          | Listo para ejecutar     |
| 2025-11-26 | Documentación de proceso de re-subida       | Este documento          |

---

## 🔗 Referencias

- **Edge Function:** `supabase/functions/upload-excel-recommendations/index.ts`
- **Script SQL:** `scripts/clean-november-2025-data.sql`
- **Excel Original:** `creadore_sal_di_a25_de_nov.xlsx`
- **Calculate Bonificaciones:** `supabase/functions/calculate-bonificaciones/index.ts`

---

## 👤 Responsable

**Ejecutor:** Admin/Manager con permisos de Supabase  
**Fecha límite:** Antes del cierre del mes (30 nov 2025)  
**Prioridad:** 🔴 CRÍTICA - Datos de bonificaciones dependen de esto
