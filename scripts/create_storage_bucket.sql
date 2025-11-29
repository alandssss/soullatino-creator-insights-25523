-- Crear el bucket creator-avatars para almacenar fotos de perfil
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- 1. Crear el bucket (público para que las imágenes sean accesibles)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-avatars',
  'creator-avatars',
  true,
  5242880, -- 5MB límite por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Política de lectura pública (cualquiera puede ver las imágenes)
CREATE POLICY IF NOT EXISTS "Public Access to Creator Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-avatars');

-- 3. Política de escritura para service role (solo el backend puede subir)
CREATE POLICY IF NOT EXISTS "Service Role Upload Creator Avatars"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'creator-avatars');

-- 4. Política de actualización para service role
CREATE POLICY IF NOT EXISTS "Service Role Update Creator Avatars"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'creator-avatars');

-- 5. Política de eliminación para service role
CREATE POLICY IF NOT EXISTS "Service Role Delete Creator Avatars"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'creator-avatars');

-- 6. Verificar que las columnas existen en la tabla creators
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS profile_image_last_refreshed TIMESTAMPTZ;

-- 7. Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_creators_profile_image 
ON creators(profile_image_url) 
WHERE profile_image_url IS NOT NULL;

-- Verificación: Mostrar el bucket creado
SELECT * FROM storage.buckets WHERE id = 'creator-avatars';
