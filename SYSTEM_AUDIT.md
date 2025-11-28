# 🔍 Auditoría Completa del Sistema - Soullatino Creator Insights

> **Fecha**: 2025-11-27  
> **Objetivo**: Mapear arquitectura, flujo de datos, y puntos de integración

---

## 📊 1. Estructura del Frontend

### 1.1 Páginas Principales

| Ruta | Componente | Propósito | Edge Functions Llamadas |
|------|-----------|-----------|------------------------|
| `/` | `Dashboard.tsx` | Panel principal con KPIs y métricas | `get-recommendations-today` |
| `/admin` | `Admin.tsx` | Panel administrativo con carga de Excel | `upload-excel-recommendations` (HTTP), `calculate-bonificaciones-predictivo`, `generate-demo-live-data` |
| `/alertas` | `AlertasSugerencias.tsx` | Recomendaciones y alertas de contacto | `get-recommendations-today` |
| `/batallas` | `BatallasPanel.tsx` | Sistema de batallas PKO | Ninguna (query directo a DB) |
| `/rankings` | `Rankings.tsx` | Rankings de creadores | `calculate-rankings` |
| `/reclutamiento` | `Reclutamiento.tsx` | Panel de reclutamiento | Ninguna |
| `/supervision` | `SupervisionLive.tsx` | Supervisión en vivo de creadores | `supervision-quicklog` |
| `/supervision/:id` | `CreatorProfile.tsx` | Perfil detallado del creador | `process-creator-analytics` |
| `/branding` | `BrandingSettings.tsx` | Configuración de marca | Ninguna |
| `/scoring` | `ScoringConfig.tsx` | Configuración de scoring | Ninguna |
| `/ia-effectiveness` | `IAEffectiveness.tsx` | Efectividad de IA | Ninguna |
| `/debug` | `DebugTools.tsx` | Herramientas de debugging | Ninguna |
| `/login` | `Login.tsx` | Inicio de sesión | `ensure-user-role` |
| `/portal/:username` | `CreatorPortal.tsx` | Portal público de creadores | Ninguna (query directo a DB) |
| `/home` | `HomePage.tsx` | Página de inicio | Ninguna |

### 1.2 Componentes Críticos

#### **AdminUploadPanel** (`src/components/AdminUploadPanel.tsx`)
**Flujo de carga de Excel**:
1. Usuario selecciona archivo Excel (.xlsx/.xls)
2. Frontend valida tipo MIME y extensión
3. Construye `FormData` con el archivo
4. **Envía via HTTP POST** a `${VITE_SUPABASE_URL}/functions/v1/upload-excel-recommendations`
5. Headers: `Authorization: Bearer ${token}`, `apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}`
6. **NO usa** `supabase.functions.invoke()` - usa `fetch()` directamente
7. Recibe respuesta con `records_processed`, `no_match`, etc.
8. **DESPUÉS** del upload, llama a `calculate-bonificaciones-predictivo` con `supabase.functions.invoke()`
9. Muestra toast de éxito y recarga la página

**Problema detectado**: La función reporta éxito pero los datos no se guardan.

---

## ⚡ 2. Edge Functions

### 2.1 Inventario Completo (20 funciones)

| Nombre | Propósito | Llamado desde | Input/Output |
|--------|-----------|---------------|--------------|
| `upload-excel-recommendations` | Procesa Excel y guarda en `creator_daily_stats` | AdminUploadPanel (HTTP) | FormData → JSON (records_processed) |
| `calculate-bonificaciones-predictivo` | Calcula bonificaciones mensuales desde `creator_daily_stats` → `creator_bonificaciones` | AdminUploadPanel, upload-excel-recommendations | `{mes_referencia}` → `{total_creadores}` |
| `calculate-bonificaciones` | (Legacy) Calcula bonificaciones | N/A | N/A |
| `calculate-bonificaciones-unified` | (Legacy) Calcula bonificaciones unificadas | N/A | N/A |
| `calculate-all-bonificaciones` | Recalcula bonificaciones para todos los meses | N/A | N/A |
| `calculate-rankings` | Calcula rankings de creadores | LeaderboardPanel | `{fecha}` → Rankings |
| `ensure-user-role` | Asegura rol de usuario al login | Login.tsx | Sin body → Sin respuesta |
| `generate-badge-image` | Genera imagen de badge | N/A | Badge data → Image |
| `generate-creator-advice` | Genera consejo para creador | N/A | Creator data → Advice |
| `generate-demo-live-data` | Genera datos demo de live | AdminUploadPanel | `{mes_inicio, cantidad_creadores}` → Stats |
| `get-recommendations-today` | Obtiene recomendaciones del día | AlertasSugerencias, PriorityContactsPanel | Sin body → Array de recomendaciones |
| `manage-user` | Gestiona usuarios | UserManagement | `{action, userId, role}` → Success |
| `process-creator-analytics` | Procesa analíticas de creador | CreatorProfile, interactionService | Creator ID → Analytics |
| `supervision-quicklog` | Registra logs de supervisión | IncidentDialog, CreatorDrawer, CreatorPanel | `{creatorId, incident}` → Success |
| `sync-to-airtable` | **Sincroniza a Airtable** | N/A (manual/CRON) | `{month}` → Sync result |
| `register-contact` | Registra contacto | N/A | Contact data → Success |
| `rapid-endpoint` | Endpoint rápido | N/A | N/A |
| `cron-daily-recompute` | Recompute diario (CRON) | N/A (CRON) | N/A |
| `_shared/cors.ts` | Utilidades CORS | Todas las funciones | N/A |
| `_shared/rate-limit.ts` | Rate limiting | Todas las funciones | N/A |

### 2.2 Flujo Crítico: Carga de Excel → Bonificaciones

```
[Usuario] → Selecciona Excel
    ↓
[AdminUploadPanel.handleUpload()] 
    ↓
[HTTP POST] → upload-excel-recommendations
    ↓
  ┌─────────────────────────────────────┐
  │ upload-excel-recommendations        │
  ├─────────────────────────────────────┤
  │ 1. Valida auth y rol (admin/manager)│
  │ 2. Lee Excel con XLSX.js            │
  │ 3. Mapea columnas (aliases)         │
  │ 4. Resuelve creator_id              │
  │ 5. Crea creadores faltantes         │
  │ 6. DELETE from creator_daily_stats  │
  │    WHERE fecha = today              │
  │ 7. UPSERT to creator_daily_stats    │
  │ 8. Refresh materialized view        │
  │ 9. ✅ LLAMA calculate-bonificaciones│
  │    - GET mes_referencia (YYYY-MM)   │
  │    - INVOKE function con mes        │
  └─────────────────────────────────────┘
    ↓
[HTTP Response] → AdminUploadPanel
    ↓
  {records_processed, no_match, message}
    ↓
[AdminUploadPanel] → Llama calculate-bonificaciones OTRA VEZ
    (Línea 231: supabase.functions.invoke)
    ↓
[Toast] → "✅ Archivo procesado exitosamente"
    ↓
[window.location.reload()] → Recarga página
```

---

## 🗄️ 3. Base de Datos

### 3.1 Tablas Principales

| Tabla | Propósito | Populated By | Queried By |
|-------|-----------|--------------|------------|
| `creators` | Catálogo de creadores | upload-excel-recommendations (UPSERT) | Dashboard, Supervision, Portal |
| `creator_daily_stats` | Stats diarias de creadores | upload-excel-recommendations (DELETE + UPSERT) | calculate-bonificaciones-predictivo |
| `creator_bonificaciones` | Bonificaciones mensuales calculadas | calculate-bonificaciones-predictivo | Dashboard, AdminPanel, sync-to-airtable |
| `creator_recommendations` | Recomendaciones generadas | get-recommendations-today | AlertasSugerencias |
| `user_roles` | Roles de usuarios | manage-user | Login, middleware |
| `supervision_log` | Logs de supervisión | supervision-quicklog | Supervision panel |

### 3.2 Proyecto Supabase Actual

**Frontend está conectado a**: `fhboambxnmswtxalllnn` (después de cambio en `.env`)  
**Edge Functions desplegadas en**: `fhboambxnmswtxalllnn`

**Estado actual (2025-11-27)**:
- `creators`: **1 registro** (Test Creator)
- `creator_daily_stats`: **0 registros** ⚠️
- `creator_bonificaciones`: **0 registros** ⚠️
- `creator_recommendations`: **null registros**

---

## 🔄 4. Puntos de Integración

### 4.1 Supabase Client

**Archivo**: `src/integrations/supabase/client.ts`  
**Variables de entorno** (`.env` actualizado):
```
VITE_SUPABASE_URL="https://fhboambxnmswtxalllnn.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
VITE_SUPABASE_PROJECT_ID="fhboambxnmswtxalllnn"
```

### 4.2 Métodos de Invocación

#### **Método 1: HTTP directo (usado en upload)**
```typescript
const functionUrl = `${supabaseUrl}/functions/v1/upload-excel-recommendations`;
await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  },
  body: formData
});
```

#### **Método 2: supabase.functions.invoke() (usado en el resto)**
```typescript
await supabase.functions.invoke('calculate-bonificaciones-predictivo', {
  body: { mes_referencia: mesRef }
});
```

### 4.3 Airtable Sync

**Edge Function**: `sync-to-airtable`  
**Invocación**: Manual o CRON  
**Input**: `{month: "YYYY-MM"}`  
**Proceso**:
1. Query `creator_bonificaciones` WHERE `mes_referencia` = month
2. Transforma datos al formato Airtable
3. UPSERT a tablas Airtable:
   - `creators` (info básica)
   - `daily_metrics` (bonificaciones del mes)

**Secretos requeridos** (Supabase Secrets):
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_CREATORS_TABLE_ID`
- `AIRTABLE_DAILY_METRICS_TABLE_ID`
- `ALERT_EMAIL` (opcional)

---

## 🐛 5. Problema Actual Identificado

### 5.1 Síntomas
- ✅ UI muestra "Archivo procesado exitosamente"
- ✅ Función `upload-excel-recommendations` responde HTTP 200
- ❌ `creator_daily_stats` tiene 0 registros
- ❌ `creator_bonificaciones` tiene 0 registros

### 5.2 Hipótesis

**Hipótesis 1**: La función `upload-excel-recommendations` hace DELETE pero el UPSERT falla silenciosamente.  
**Hipótesis 2**: La función está desplegada en proyecto diferente al que usa el frontend.  
**Hipótesis 3**: Error en transacción - DELETE ejecuta pero UPSERT no.  
**Hipótesis 4**: La función reporta éxito prematuramente antes de commits.

### 5.3 Próximos Pasos de Diagnóstico

1. ✅ Verificar que `.env` apunta a proyecto correcto → **COMPLETADO** (fhboambxnmswtxalllnn)
2. ✅ Verificar que funciones están desplegadas en proyecto correcto → **COMPLETADO**
3. ⏳ Agregar logging detallado en `upload-excel-recommendations`
4. ⏳ Verificar si el DELETE se ejecuta
5. ⏳ Verificar si el UPSERT se ejecuta
6. ⏳ Revisar logs de la función en Dashboard de Supabase

---

## 📈 6. Métricas y Datos Mostrados por Página

### Dashboard (`/`)
- **KPIs**: Total creadores, bonificaciones totales, días MTD, horas MTD
- **Fuente**: Query a `creator_bonificaciones` WHERE mes_referencia = mes actual
- **Componentes**:
  - `PriorityContactsPanel`: Llama `get-recommendations-today`
  - `BonificacionesPanel`: Query a `creator_bonificaciones`
  - `CreatorListPanel`: Query a `creators` JOIN `creator_bonificaciones`

### Admin (`/admin`)
- **AdminUploadPanel**: Carga de Excel
- **UserManagement**: Gestión de usuarios
- **Fuente**: Direct DB queries y Edge Functions

### Alertas (`/alertas`)
- **Recomendaciones**: Llama `get-recommendations-today`
- **Fuente**: `creator_recommendations` table

### Supervision (`/supervision`)
- **Live tracking**: Query a `creators` con estado en vivo
- **Quicklog**: Registra incidents via `supervision-quicklog`
- **Fuente**: `creators`, `supervision_log`

### Rankings (`/rankings`)
- **Leaderboards**: Llama `calculate-rankings`
- **Fuente**: Calcula desde `creator_bonificaciones`

---

## 🚨 7. Issues Detectados

### 7.1 Arquitectura
- ❌ **Inconsistencia**: AdminUploadPanel usa HTTP directo, otros componentes usan `supabase.functions.invoke()`
- ❌ **Duplicación**: `calculate-bonificaciones-predictivo` se llama 2 veces (en upload function Y en frontend)
- ⚠️ **Sin validación**: No hay validación de si datos se guardaron antes de mostrar éxito

### 7.2 Data Flow
- ❌ **Datos no persisten**: Excel upload muestra éxito pero tablas vacías
- ❌ **Sin rollback**: Si bonificaciones fallan, daily_stats quedan inconsistentes
- ⚠️ **Refresh forzado**: `window.location.reload()` es pesado y puede causar pérdida de estado

### 7.3 Edge Functions
- ✅ **Deployadas correctamente** en fhboambxnmswtxalllnn
- ❌ **Sin logs accesibles**: No podemos ver qué pasa dentro de la función
- ⚠️ **Invocación en cadena**: upload-excel llama a calculate-bonificaciones, que puede fallar silenciosamente

---

## ✅ 8. Recomendaciones

### 8.1 Inmediatas
1. **Agregar logging exhaustivo** en `upload-excel-recommendations` (console.log en cada paso)
2. **Verificar schema** de `creator_daily_stats` y `creator_bonificaciones`
3. **Revisar logs** en Supabase Dashboard
4. **Validar response** en AdminUploadPanel antes de mostrar éxito

### 8.2 A Mediano Plazo
1. **Unificar invocación**: Usar siempre `supabase.functions.invoke()` en lugar de HTTP directo
2. **Agregar transacciones**: Envolver DELETE + UPSERT en transacción
3. **Validar antes de éxito**: Query count después de UPSERT y validar > 0
4. **Separar responsabilidades**: Excel upload NO debe llamar a bonificaciones, hacerlo en un CRON

---

## 📝 9. Conclusión

El sistema tiene una arquitectura clara pero hay un **disconnect** entre lo que reporta la UI y lo que realmente sucede en la base de datos. El problema más probable es que la función `upload-excel-recommendations` está fallando en el UPSERT pero reportando éxito de todas formas.

**Acción inmediata**: Revisar logs de la función y agregar validación post-insert en el código.
