# CONFIGURACIÓN CRÍTICA - NO MODIFICAR

## Problema Identificado
El proyecto tiene Edge Functions desplegadas en el proyecto de Supabase `fhboambxnmswtxalllnn`, pero el `.env` sigue apuntando al proyecto antiguo `mpseoscrzpnequwvzokn`.

## Solución Requerida

### Opción 1: Actualizar Variables en Lovable Cloud (RECOMENDADO)
1. Ir a https://lovable.dev/projects/[project-id]/settings
2. Actualizar las variables de entorno:
   ```
   VITE_SUPABASE_URL=https://fhboambxnmswtxalllnn.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTM0MzgsImV4cCI6MjA0ODE4OTQzOH0.JxdcMEbUdNqrv6Hy_LmVUkqMxTKhVPVVnKCTvpbI0Zg
   VITE_SUPABASE_PROJECT_ID=fhboambxnmswtxalllnn
   ```
3. Redesplegar la aplicación

### Opción 2: Migrar Edge Functions al Proyecto Antiguo
Si prefieres mantener el proyecto `mpseoscrzpnequwvzokn`:
1. Redesplegar todas las Edge Functions a ese proyecto
2. Actualizar las variables de entorno de las funciones

## Estado Actual de Edge Functions
Todas las funciones están desplegadas en `fhboambxnmswtxalllnn`:
- sync-to-airtable (v20)
- upload-excel-recommendations (v16)
- calculate-bonificaciones-predictivo (v9)
- cron-daily-recompute (v4)
- debug-db-connection (v1)

## Por Qué Falla Todo
- Frontend intenta conectarse a: `mpseoscrzpnequwvzokn.supabase.co`
- Edge Functions están en: `fhboambxnmswtxalllnn.supabase.co`
- Resultado: "Failed to send edge request" y "Cannot upload Excel"
