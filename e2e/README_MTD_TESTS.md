# 🧪 Tests E2E de Validación de Métricas MTD

Tests automáticos end-to-end para validar que las métricas Month-to-Date (MTD) NO estén duplicadas y se calculen correctamente.

---

## 🎯 Objetivo

Verificar que el fix aplicado (cambio de `reduce()` a `Math.max()`) funciona correctamente en todas las vistas del sistema:
- Dashboard
- CreatorMetricsPanel
- BonificacionesPanel

---

## 📋 Tests Implementados

### 1. **Dashboard - Valores Realistas**
✅ Verifica que los diamantes mostrados en Top Performers sean < 2M (2000K) por mes

### 2. **CreatorMetricsPanel - No Multiplicación**
✅ Valida que:
- Días Live MTD ≤ 31
- Horas Live MTD < 744 (31 días × 24h)
- Diamantes MTD < 5M

### 3. **BonificacionesPanel - Horas Correctas**
✅ Verifica que las horas en el panel de bonificaciones sean realistas

### 4. **Coherencia Entre Vistas**
✅ Compara valores entre Dashboard y CreatorMetrics (diferencia < 20%)

### 5. **Validación de Límites Físicos**
✅ Busca valores sospechosos que excedan límites naturales (ej: 1500h, 50 días)

### 6. **No Valores Inválidos**
✅ Verifica que no haya "NaN", "undefined" o "Infinity" en la UI

### 7. **Múltiples Creadores**
✅ Valida límites en hasta 3 creadores diferentes

---

## 🚀 Cómo Ejecutar los Tests

### Instalar dependencias (si no lo has hecho)
```bash
npm install
npx playwright install
```

### Ejecutar SOLO los tests de validación MTD
```bash
npx playwright test mtd-metrics-validation.spec.ts
```

### Ejecutar con UI interactiva (recomendado para debugging)
```bash
npx playwright test mtd-metrics-validation.spec.ts --ui
```

### Ejecutar en modo headed (ver el navegador)
```bash
npx playwright test mtd-metrics-validation.spec.ts --headed
```

### Ejecutar test específico
```bash
# Solo test de Dashboard
npx playwright test mtd-metrics-validation.spec.ts -g "Dashboard - valores de diamantes"

# Solo test de coherencia
npx playwright test mtd-metrics-validation.spec.ts -g "Coherencia entre vistas"
```

### Ver reporte completo
```bash
npx playwright show-report
```

---

## 📊 Ejemplo de Salida Exitosa

```bash
✅ Dashboard diamantes values: [ 450, 320, 280 ]
✅ Días Live MTD: 15
✅ Horas Live MTD: 67.5
✅ Diamantes MTD: 245000
✅ Bonificaciones - Horas Live: 67.5
✅ Bonificaciones - Días Live: 15
✅ Coherencia Dashboard vs Metrics:
   Dashboard: 245000
   Metrics: 245000
   Diferencia: 0.00%
✅ No se encontraron valores NaN o undefined en UI

7 passed (45s)
```

---

## 🔴 Ejemplo de Falla (Duplicación Detectada)

```bash
❌ Expected: < 744
   Received: 1350

    expect(horas).toBeLessThan(744);
                 ^

⚠️ Valor sospechoso encontrado: 1350.5h

Test failed: CreatorMetricsPanel - MTD metrics no multiplicados
```

---

## 🛠️ Configuración de Tests

### Credenciales de Login
```typescript
email: 'admin@soullatino.com'
password: 'admin123'
```

### Timeouts
- Espera de login: 10 segundos
- Carga de datos: 2 segundos
- Navegación entre tabs: 1 segundo

### Selectores Clave
- `[data-testid="creator-card"]` - Tarjetas de creadores
- `text=Métricas` - Tab de métricas
- `text=Bonificación` - Tab de bonificaciones
- `text=Días Live MTD` - KPI de días
- `text=Horas Live MTD` - KPI de horas

---

## 🐛 Troubleshooting

### "No creators found"
- Asegúrate de que haya datos cargados en la base de datos
- Verifica que el usuario tenga permisos correctos

### "Timeout waiting for selector"
- Aumenta los timeouts en el test si la red es lenta
- Verifica que la aplicación esté corriendo en localhost

### Tests pasan pero UI muestra valores duplicados
- Limpia caché del navegador
- Verifica que los cambios de código estén desplegados
- Revisa logs de consola en modo `--headed`

---

## 📝 Añadir Nuevos Tests

### Template para nuevo test
```typescript
test('Nuevo test de validación', async ({ page }) => {
  await page.waitForTimeout(2000);
  const creatorCards = page.locator('[data-testid="creator-card"]');
  
  if (await creatorCards.count() > 0) {
    await creatorCards.first().click();
    
    // Tu validación aquí
    const value = await page.locator('selector').textContent();
    expect(value).toBeLessThan(MAX_VALUE);
  }
});
```

---

## 🔗 Referencias

- **Documentación del Fix:** `AUDITORIA_SOULLATINO_2025.md` (FIX CRÍTICO #3 y #4)
- **Análisis Técnico:** `VERIFICACION_METRICAS_MTD.md`
- **Archivos Corregidos:**
  - `src/components/creator-detail/CreatorMetricsPanel.tsx`
  - `src/services/creatorAnalytics.ts`

---

## ✅ Estado Actual

**Última ejecución:** Pendiente de primera ejecución  
**Tests implementados:** 7  
**Cobertura:** Dashboard, CreatorMetrics, Bonificaciones  
**Estado esperado:** ✅ Todos los tests deben pasar

---

**Creado:** 2025-01-23  
**Versión:** 1.0
