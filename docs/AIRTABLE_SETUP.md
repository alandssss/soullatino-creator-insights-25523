# Guía de Configuración: Sincronización con Airtable

## 📋 Requisitos Previos

1. **Cuenta de Airtable**
   - Crea una cuenta en [airtable.com](https://airtable.com)
   - Plan recomendado: **Pro** ($20/usuario/mes) para automatizaciones

2. **Paquetes instalados**
   - ✅ Ya instalado: `airtable` package

---

## 🚀 Configuración Paso a Paso

### Paso 1: Crear Base en Airtable

1. Ve a [airtable.com](https://airtable.com) y crea una nueva base
2. Nómbrala: **"Soullatino CRM"**
3. Crea la primera tabla llamada **"Creadores"**

### Paso 2: Configurar Campos en Tabla "Creadores"

Copia y pega estos campos en orden (Airtable permite importar desde CSV):

**Campos de Identificación:**
- `Creator ID` (Single line text) - **Primary field**
- `Nombre` (Single line text)
- `Username TikTok` (Single line text)
- `Manager` (Single line text)
- `Fecha Ingreso` (Date)
- `Días en Agencia` (Number, integer)
- `Nivel Actual` (Single select: G0, G1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G11)

**Segmentación (Fórmula):**
- `Segmento` (Formula):
  ```
  IF(
    VALUE(RIGHT({Nivel Actual}, LEN({Nivel Actual}) - 1)) <= 6,
    "🌱 Incubadora",
    IF(
      VALUE(RIGHT({Nivel Actual}, LEN({Nivel Actual}) - 1)) <= 8,
      "📈 Profesionalización",
      "⭐ Élite"
    )
  )
  ```

**Métricas MTD:**
- `Diamonds MTD` (Number, allow negatives)
- `Diamonds Mes Anterior` (Number, allow negatives)
- `Horas Live MTD` (Number, decimal, 2 places)
- `Días Live MTD` (Number, integer)
- `Followers Nuevos` (Number, integer)
- `Streams` (Number, integer)

**Motor 1 - Graduación:**
- `Cumple Días Mínimos` (Checkbox)
- `Cumple Horas Mínimas` (Checkbox)
- `Elegible Bono Graduación` (Checkbox)
- `Hito Alcanzado` (Single select: M0.5, M1, M1R, M2, M3, M4, M5)
- `Monto Bono Graduación` (Formula):
  ```
  SWITCH(
    {Hito Alcanzado},
    "M0.5", 15,
    "M1", 25,
    "M1R", 35,
    "M2", 50,
    "M3", 100,
    "M4", 200,
    "M5", 400,
    0
  )
  ```

**Motor 2 - Actividad:**
- `Meta Días` (Number, integer, default: 22)
- `Meta Horas` (Number, integer, default: 80)
- `Progreso % Días` (Formula): `{Días Live MTD} / {Meta Días}`
- `Progreso % Horas` (Formula): `{Horas Live MTD} / {Meta Horas}`
- `Estado Actividad` (Formula):
  ```
  IF(
    {Segmento} != "📈 Profesionalización",
    "N/A",
    IF(
      AND({Progreso % Días} >= 0.8, {Progreso % Horas} >= 0.8),
      "🟢 Verde",
      IF(
        OR({Progreso % Días} >= 0.5, {Progreso % Horas} >= 0.5),
        "🟡 Amarillo",
        "🔴 Rojo"
      )
    )
  )
  ```

**Motor 3 - Crecimiento:**
- `Crecimiento % Diamonds` (Formula):
  ```
  IF(
    {Diamonds Mes Anterior} > 0,
    ({Diamonds MTD} - {Diamonds Mes Anterior}) / {Diamonds Mes Anterior},
    0
  )
  ```
- `Meta Crecimiento %` (Number, decimal, default: 0.20)
- `% de Meta Crecimiento` (Formula): `{Crecimiento % Diamonds} / {Meta Crecimiento %}`
- `Elegible Bono Incremental` (Formula):
  ```
  AND(
    {Segmento} = "⭐ Élite",
    {Crecimiento % Diamonds} >= 0.70 * {Meta Crecimiento %}
  )
  ```

**Score de Prioridad:**
- `Score Prioridad` (Number, integer, 0-100)

### Paso 3: Obtener Credenciales de Airtable

1. **API Key:**
   - Ve a [airtable.com/create/tokens](https://airtable.com/create/tokens)
   - Click en "Create new token"
   - Nombre: "Soullatino Sync"
   - Scopes: `data.records:read` y `data.records:write`
   - Access: Selecciona tu base "Soullatino CRM"
   - Copia el token generado

2. **Base ID:**
   - Abre tu base en Airtable
   - Ve a "Help" → "API documentation"
   - El Base ID aparece en la URL: `https://airtable.com/appXXXXXXXXXXXXXX`
   - Copia el ID que empieza con `app...`

### Paso 4: Configurar Variables de Entorno

Agrega estas líneas a tu archivo `.env`:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=tu_api_key_aqui
AIRTABLE_BASE_ID=tu_base_id_aqui
```

---

## ▶️ Ejecutar Sincronización

### Primera Sincronización (Manual)

```bash
node scripts/sync-to-airtable.js
```

**Salida esperada:**
```
🚀 Iniciando sincronización Supabase → Airtable
⏰ 11/26/2025, 4:30:00 AM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Sincronizando Creadores...
   ✓ 188 creadores encontrados en Supabase
   → Obteniendo registros existentes de Airtable...
   ✓ 0 registros existentes en Airtable
   → 188 nuevos, 0 a actualizar
   → Creando nuevos registros...
      ✓ Creados 10/188
      ✓ Creados 20/188
      ...
   ✅ Creadores sincronizados exitosamente

📋 Sincronizando Managers...
   ℹ️  Los managers se actualizan automáticamente vía relaciones en Airtable
   ✅ Managers OK

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sincronización completada exitosamente

📊 Resumen:
   Creadores: 188 total
   - Nuevos: 188
   - Actualizados: 0

🔗 Ver en Airtable: https://airtable.com/appXXXXXXXXXXXXXX
```

---

## 🔄 Sincronización Automática Diaria

### Opción 1: Cron Job Local (Mac/Linux)

```bash
# Editar crontab
crontab -e

# Agregar esta línea (ejecuta a las 2:00 AM diario)
0 2 * * * cd /ruta/a/tu/proyecto && node scripts/sync-to-airtable.js >> logs/airtable-sync.log 2>&1
```

### Opción 2: GitHub Actions (Recomendado)

Crea `.github/workflows/airtable-sync.yml`:

```yaml
name: Sync to Airtable

on:
  schedule:
    - cron: '0 8 * * *'  # 2 AM CST = 8 AM UTC
  workflow_dispatch:  # Permite ejecución manual

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run sync
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          AIRTABLE_BASE_ID: ${{ secrets.AIRTABLE_BASE_ID }}
        run: node scripts/sync-to-airtable.js
```

**Configurar Secrets en GitHub:**
1. Ve a tu repo → Settings → Secrets and variables → Actions
2. Agrega:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `VITE_SUPABASE_URL` (si no existe)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (si no existe)

---

## 🎨 Crear Vistas en Airtable

### Vista 1: "🎯 Dashboard 3 Motores"

1. Click en "Grid view" → "Create new view" → "Grid"
2. Nombre: "🎯 Dashboard 3 Motores"
3. **Group by:** `Segmento`
4. **Sort by:** `Score Prioridad` (descendente)
5. **Visible fields:**
   - Nombre, Manager, Nivel Actual
   - Diamonds MTD, Días Live MTD, Horas Live MTD
   - Elegible Bono Graduación, Estado Actividad
   - Crecimiento % Diamonds, Score Prioridad

### Vista 2: "🌱 Incubadora"

1. Nueva vista tipo Grid
2. Nombre: "🌱 Incubadora"
3. **Filter:** `Segmento` is `🌱 Incubadora`
4. **Sort:** `Diamonds MTD` (descendente)
5. **Fields:** Nombre, Días en Agencia, Diamonds MTD, Cumple Días, Cumple Horas, Hito Alcanzado

### Vista 3: "⭐ Élite"

1. Nueva vista tipo Grid
2. Nombre: "⭐ Élite"
3. **Filter:** `Segmento` is `⭐ Élite`
4. **Sort:** `Crecimiento % Diamonds` (descendente)
5. **Fields:** Nombre, Diamonds MTD, Crecimiento %, Elegible Bono Incremental

---

## 🐛 Troubleshooting

### Error: "Could not find table 'Creadores'"

**Solución:** Verifica que el nombre de la tabla en Airtable sea exactamente "Creadores" (con mayúscula).

### Error: "Invalid API key"

**Solución:** 
1. Verifica que copiaste el API key completo
2. Asegúrate de que el token tenga los scopes correctos
3. Verifica que el token tenga acceso a la base correcta

### Error: "Field 'XXX' does not exist"

**Solución:** Asegúrate de haber creado todos los campos en Airtable antes de ejecutar el script.

### Los datos no se actualizan

**Solución:**
1. Verifica que el script se ejecute sin errores
2. Revisa que los datos existan en Supabase
3. Verifica que el mes de referencia sea correcto

---

## 📊 Próximos Pasos

1. ✅ Configurar base y tabla de Creadores
2. ✅ Ejecutar primera sincronización
3. ⏳ Crear tabla de Managers
4. ⏳ Crear tabla de Incentivos
5. ⏳ Configurar automatizaciones
6. ⏳ Crear interfaces personalizadas

---

## 💡 Tips

- **Exportar reportes:** En Airtable, puedes exportar cualquier vista a CSV/Excel
- **Compartir vistas:** Crea vistas específicas para cada manager y compártelas
- **Interfaces:** Usa Airtable Interfaces para crear dashboards visuales
- **Automatizaciones:** Configura alertas por email cuando Score Prioridad > 35

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs del script
2. Verifica las credenciales en `.env`
3. Asegúrate de que todos los campos existan en Airtable
4. Contacta si persiste el error
