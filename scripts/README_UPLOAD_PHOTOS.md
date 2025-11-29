# 📸 Subir Fotos de Perfil a Supabase

Este script descarga las fotos de perfil de TikTok de todos los creadores y las sube a Supabase Storage, actualizando automáticamente la base de datos.

## 🎯 Objetivo

Subir las fotos de perfil de cada creador a la base de datos de Supabase para que aparezcan en el panel de soullatino/neuron.lat.

## 📋 Pre-requisitos

1. **Service Role Key de Supabase**: Necesitas obtener esta clave desde el dashboard de Supabase
2. **Archivo Excel**: `27_Nov_25_con_fotos.xlsx` en `/Users/worki/Downloads/`
3. **Python 3.8+** instalado

## 🔑 Paso 1: Obtener la Service Role Key

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `fhboambxnmswtxalllnn`
3. Ve a **Settings** → **API**
4. En la sección **Project API keys**, copia la **service_role** key (NO la anon/public key)
5. ⚠️ **IMPORTANTE**: Esta clave es secreta, no la compartas públicamente

## 🛠️ Paso 2: Configurar el archivo .env

Agrega la Service Role Key al archivo `.env`:

```bash
cd /Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523
echo 'SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-aqui"' >> .env
```

## 📦 Paso 3: Instalar dependencias

```bash
cd /Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523/scripts
pip3 install -r requirements.txt
```

## 🚀 Paso 4: Ejecutar el script

```bash
python3 upload_profile_photos_to_supabase.py
```

## 📊 ¿Qué hace el script?

El script realiza las siguientes acciones para cada creador:

1. **Descarga** la foto de perfil de TikTok usando el servicio unavatar.io
2. **Procesa** la imagen (redimensiona a 200x200px, convierte a JPEG)
3. **Sube** la imagen al bucket `creator-avatars` en Supabase Storage
4. **Actualiza** la tabla `creators` con:
   - `profile_image_url`: URL pública de la imagen
   - `profile_image_last_refreshed`: Timestamp de la actualización

## 📁 Estructura del bucket

Las imágenes se guardan en Supabase Storage con la siguiente estructura:

```
creator-avatars/
├── username1.jpg
├── username2.jpg
└── username3.jpg
```

## ✅ Verificación

Después de ejecutar el script, puedes verificar que las fotos se subieron correctamente:

1. **En Supabase Dashboard**:
   - Ve a **Storage** → **creator-avatars**
   - Deberías ver todas las imágenes subidas

2. **En la base de datos**:
   ```sql
   SELECT tiktok_username, profile_image_url, profile_image_last_refreshed 
   FROM creators 
   WHERE profile_image_url IS NOT NULL;
   ```

3. **En tu aplicación**:
   - Las fotos deberían aparecer automáticamente en el panel de soullatino/neuron.lat

## 🔧 Solución de problemas

### Error: "El bucket 'creator-avatars' no existe"

Crea el bucket en Supabase:

1. Ve a **Storage** en el dashboard de Supabase
2. Clic en **New bucket**
3. Nombre: `creator-avatars`
4. Public: ✅ (activado)
5. Crea las siguientes políticas:

```sql
-- Política de lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-avatars');

-- Política de escritura para service role
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-avatars');

-- Política de actualización para service role
CREATE POLICY "Service Role Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'creator-avatars');
```

### Error: "Faltan variables de entorno"

Verifica que el archivo `.env` tenga:
```
VITE_SUPABASE_URL="https://fhboambxnmswtxalllnn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
```

### Las fotos no aparecen en el panel

1. Verifica que la columna `profile_image_url` existe en la tabla `creators`:
   ```sql
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
   ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image_last_refreshed TIMESTAMPTZ;
   ```

2. Verifica que el frontend esté usando esta columna para mostrar las fotos

## 📈 Estadísticas esperadas

Para el archivo `27_Nov_25_con_fotos.xlsx`:
- Total de creadores: ~[número de creadores]
- Tasa de éxito esperada: 85-95%
- Tiempo estimado: ~30 segundos por cada 100 creadores

## 🔄 Re-ejecutar el script

El script usa `upsert: true`, lo que significa que puedes ejecutarlo múltiples veces sin problemas. Las imágenes existentes se sobrescribirán con las nuevas versiones.

## 📞 Soporte

Si encuentras algún problema, revisa:
1. Los logs del script (se muestran en la consola)
2. Los logs de Supabase (Dashboard → Logs)
3. Las políticas de Storage (Dashboard → Storage → Policies)
