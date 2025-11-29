# 🎯 PASOS FINALES PARA SUBIR LAS FOTOS A SUPABASE

## ✅ Estado Actual

- ✅ Script creado: `upload_profile_photos_to_supabase.py`
- ✅ Dependencias instaladas en entorno virtual
- ✅ Archivo Excel listo: `27_Nov_25_con_fotos.xlsx`
- ⏳ **ESPERANDO**: Service Role Key de Supabase

## 🔑 Paso 1: Obtener la Service Role Key

El script de configuración está **EJECUTÁNDOSE AHORA** y esperando que pegues la clave.

### Cómo obtener la clave:

1. **Abre tu navegador** (ya tienes Supabase abierto)
2. **Inicia sesión** en Supabase si es necesario
3. **Ve a esta URL**: https://supabase.com/dashboard/project/fhboambxnmswtxalllnn/settings/api
4. **Busca la sección** "Project API keys"
5. **Encuentra** la fila que dice **"service_role"** (NO uses "anon")
6. **Clic en "Reveal"** o el ícono del ojo para mostrar la clave
7. **Copia** la clave completa (empieza con `eyJ...`)

### Ejemplo de cómo se ve:

```
Project API keys
┌─────────────────┬────────────────────────────────────────┐
│ Name            │ Key                                    │
├─────────────────┼────────────────────────────────────────┤
│ anon public     │ eyJhbGci... [NO USES ESTA]            │
│ service_role    │ eyJhbGci... [USA ESTA] 👈              │
└─────────────────┴────────────────────────────────────────┘
```

## 📝 Paso 2: Pegar la clave

1. **Ve a tu terminal** donde está corriendo el script
2. **Pega la clave** que copiaste
3. **Presiona Enter**

El script automáticamente:
- Guardará la clave en el archivo `.env`
- Te preguntará si deseas ejecutar la subida ahora
- Si dices "s", comenzará a subir las fotos inmediatamente

## 🚀 Paso 3: Ejecutar la subida

Si elegiste ejecutar ahora (opción "s"), el script:

1. ✅ Verificará que el bucket `creator-avatars` existe
2. 📖 Leerá el archivo `27_Nov_25_con_fotos.xlsx`
3. 🔄 Para cada creador:
   - ⬇️ Descargará su foto de perfil de TikTok
   - 🎨 La procesará (redimensionar, optimizar)
   - ⬆️ La subirá a Supabase Storage
   - 💾 Actualizará la base de datos con la URL

## 📊 Qué esperar

```
[1/50] 📸 @username1
    ⬇️  Descargando avatar... ✅
    ⬆️  Subiendo a Supabase Storage... ✅
    💾 Actualizando base de datos... ✅
    🔗 URL: https://fhboambxnmswtxalllnn.supabase.co/storage/v1/object/public/creator-avatars/username1.jpg

[2/50] 📸 @username2
    ...
```

## ⏱️ Tiempo estimado

- **Por creador**: ~1-2 segundos
- **Total (50 creadores)**: ~1-2 minutos
- **Total (100 creadores)**: ~2-4 minutos

## ✅ Verificación

Después de que termine, verifica:

1. **En Supabase Dashboard**:
   - Ve a Storage → creator-avatars
   - Deberías ver todas las imágenes

2. **En tu aplicación**:
   - Refresca el panel de soullatino/neuron.lat
   - Las fotos deberían aparecer automáticamente

## 🔧 Si algo sale mal

### "El bucket 'creator-avatars' no existe"

Ejecuta este SQL en Supabase:

```sql
-- Crear el bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-avatars', 'creator-avatars', true);

-- Política de lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-avatars');

-- Política de escritura
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-avatars');
```

### "Error actualizando base de datos"

Verifica que las columnas existen:

```sql
ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE creators ADD COLUMN IF NOT EXISTS profile_image_last_refreshed TIMESTAMPTZ;
```

## 📞 Comando actual en ejecución

El script está esperando tu input en:
```
/Users/worki/.gemini/antigravity/scratch/soullatino-creator-insights-25523/scripts
```

**¡Ve al terminal y pega la Service Role Key ahora!** 🚀
