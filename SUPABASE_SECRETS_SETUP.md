# Configurar Secrets en Supabase Dashboard

## ✅ Estado Actual
- ✅ `.env` actualizado a `fhboambxnmswtxalllnn`
- ✅ Schema de base de datos verificado (todas las columnas existen)
- ✅ Edge Functions desplegadas:
  - `sync-to-airtable`
  - `upload-excel-recommendations`

## 🔑 Paso Final: Configurar Secrets

Las Edge Functions necesitan acceso a Airtable. Debes configurar estos secrets en el Supabase Dashboard.

### Paso 1: Acceder al Dashboard
1. Ve a: https://supabase.com/dashboard/project/fhboambxnmswtxalllnn/settings/functions
2. Inicia sesión si es necesario

### Paso 2: Agregar Secrets
En la sección "Edge Function Secrets" o "Environment Variables", agrega:

#### Secret 1: AIRTABLE_API_KEY
```
Nombre: AIRTABLE_API_KEY
Valor: [TU AIRTABLE API KEY]
```
**Nota**: Este es tu Personal Access Token de Airtable. Lo puedes obtener en:
https://airtable.com/create/tokens

#### Secret 2: AIRTABLE_BASE_ID
```
Nombre: AIRTABLE_BASE_ID
Valor: apprY9jmQ4RvDGo17
```

#### Secret 3: AIRTABLE_CREATORS_TABLE_ID
```
Nombre: AIRTABLE_CREATORS_TABLE_ID
Valor: tblFK1tY8yvFpl4bP
```

#### Secret 4: AIRTABLE_DAILY_METRICS_TABLE_ID
```
Nombre: AIRTABLE_DAILY_METRICS_TABLE_ID
Valor: tbl2KTAcZLmLx5mcw
```

#### Secret 5: SUPABASE_SERVICE_ROLE_KEY
```
Nombre: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE
```

#### Secret 6: SUPABASE_URL
```
Nombre: SUPABASE_URL
Valor: https://fhboambxnmswtxalllnn.supabase.co
```

### Paso 3: Verificar
Después de agregar los secrets:
1. Espera 1-2 minutos
2. Abre tu aplicación en Lovable
3. Ve a Admin → Carga
4. Prueba:
   - ✅ Subir archivo Excel
   - ✅ Sincronizar con Airtable

## 🎯 Resultado Esperado
- **Upload Excel**: Debería procesar el archivo y mostrar "✅ Archivo procesado exitosamente"
- **Sync Airtable**: Debería mostrar "✅ Sincronización completada" con el número de registros procesados

## ❓ Si Algo Falla
1. Verifica que todos los secrets estén configurados correctamente
2. Revisa los logs de las Edge Functions en el Dashboard de Supabase
3. Abre la consola del navegador (F12) para ver errores detallados
