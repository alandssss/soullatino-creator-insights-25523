# Guía para Actualizar Variables de Entorno en Lovable

## El Problema
- Lovable está usando el proyecto: `mpseoscrzpnequwvzokn.supabase.co` ❌
- Las Edge Functions están en: `fhboambxnmswtxalllnn.supabase.co` ✅
- **Resultado**: Nada funciona (ni sync ni upload)

## Solución: Actualizar Variables en Lovable

### Paso 1: Acceder a la Configuración
1. Ve a https://lovable.dev
2. Inicia sesión
3. Selecciona tu proyecto "Soullatino Creator Insights"

### Paso 2: Encontrar Environment Variables
Busca una de estas opciones en el menú:
- ⚙️ **Settings** → **Environment Variables**
- 🔧 **Project Settings** → **Env Vars**
- 📋 **Configuration** → **Environment**

### Paso 3: Actualizar las 3 Variables

Busca y actualiza estas variables (o créalas si no existen):

#### Variable 1: VITE_SUPABASE_URL
```
Nombre: VITE_SUPABASE_URL
Valor: https://fhboambxnmswtxalllnn.supabase.co
```

#### Variable 2: VITE_SUPABASE_PUBLISHABLE_KEY
```
Nombre: VITE_SUPABASE_PUBLISHABLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYm9hbWJ4bm1zd3R4YWxsbG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MTM0MzgsImV4cCI6MjA0ODE4OTQzOH0.JxdcMEbUdNqrv6Hy_LmVUkqMxTKhVPVVnKCTvpbI0Zg
```

#### Variable 3: VITE_SUPABASE_PROJECT_ID
```
Nombre: VITE_SUPABASE_PROJECT_ID
Valor: fhboambxnmswtxalllnn
```

### Paso 4: Redesplegar
1. **Guarda** los cambios
2. Busca un botón que diga:
   - "Deploy" / "Redesplegar"
   - "Rebuild" / "Reconstruir"
   - "Redeploy" / "Volver a desplegar"
3. Haz clic y espera 2-3 minutos

### Paso 5: Verificar
1. Abre tu aplicación en Lovable
2. Ve a Admin → Carga
3. Prueba el botón "Sincronizar con Airtable"
4. Debería funcionar ✅

## Si No Encuentras las Variables de Entorno

### Opción A: Buscar en la Documentación
1. Ve a https://docs.lovable.dev
2. Busca "environment variables" o "env vars"

### Opción B: Contactar Soporte
1. Busca el botón de "Help" o "Support" en Lovable
2. Pregunta: "¿Cómo actualizo las variables de entorno de mi proyecto?"

### Opción C: Usar el Chat de Lovable
Si Lovable tiene un chat de IA:
1. Pregúntale: "How do I update environment variables?"
2. Sigue sus instrucciones

## Verificación Rápida
Después de redesplegar, abre la consola del navegador (F12) y escribe:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```
Debería mostrar: `https://fhboambxnmswtxalllnn.supabase.co`

## ¿Por Qué No Puedo Cambiar el Proyecto de Supabase?
El proyecto `mpseoscrzpnequwvzokn` no permite desplegar funciones (error 403).
Esto significa que no tienes permisos de administrador en ese proyecto.
