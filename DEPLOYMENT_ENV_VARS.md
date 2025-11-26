# Configuración de Variables de Entorno para Producción

Para que la aplicación funcione correctamente en producción, necesitas configurar las siguientes variables de entorno en tu plataforma de deploy:

## Variables Requeridas

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://fhboambxnmswtxalllnn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTk0MjAsImV4cCI6MjA3OTY3NTQyMH0.6GpLHPbKmzN6eCRY0crTEqmTdv4yNGf2cTilDoiaeUo
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTk0MjAsImV4cCI6MjA3OTY3NTQyMH0.6GpLHPbKmzN6eCRY0crTEqmTdv4yNGf2cTilDoiaeUo
VITE_SUPABASE_PROJECT_ID=fhboambxnmswtxalllnn
SUPABASE_URL=https://fhboambxnmswtxalllnn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTk0MjAsImV4cCI6MjA3OTY3NTQyMH0.6GpLHPbKmzN6eCRY0crTEqmTdv4yNGf2cTilDoiaeUo
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA5OTQyMCwiZXhwIjoyMDc5Njc1NDIwfQ.8QaeI74OBXnQf23l2XhznoZSDy2eClvOeXppYVWRoFE
GEMINI_API_KEY=AIzaSyDTAkk0SlLbDMh8eHnmURfcITYGcMLyueA
# Airtable Configuration
AIRTABLE_API_KEY=patKN2tDptpzeuUO.b15fd82e02ad7b37f7bb1773cb3b1dce136d7a28409e46fc193a75f6152ece1f
AIRTABLE_BASE_ID=apprY9jmQ4RvDGo17
```

## Instrucciones por Plataforma

### Vercel
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor
4. Redeploy el proyecto

### Netlify
1. Ve a tu sitio en Netlify
2. Site settings → Environment variables
3. Agrega cada variable
4. Trigger deploy

### Otros
Consulta la documentación de tu plataforma sobre cómo configurar variables de entorno.

## Credenciales de Acceso

Una vez desplegado, puedes iniciar sesión con:
- **Email:** admin@soullatino.com
- **Password:** Pues56!

## Cambios Aplicados

✅ Content Security Policy actualizado con URL correcta de Supabase
✅ Login corregido - eliminada llamada bloqueante a ensure-user-role
✅ Claves de Supabase actualizadas
✅ Usuario administrador creado y confirmado
