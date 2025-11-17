-- Agregar campo image_url a creator_badges para almacenar URL de imagen generada
ALTER TABLE public.creator_badges 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Índice para búsquedas por tipo de badge
CREATE INDEX IF NOT EXISTS idx_creator_badges_tipo 
ON public.creator_badges(badge_tipo);

COMMENT ON COLUMN public.creator_badges.image_url 
IS 'URL de la imagen generada por IA para este badge (almacenada en Supabase Storage)';

-- Crear bucket público para imágenes de badges
INSERT INTO storage.buckets (id, name, public) 
VALUES ('badge-images', 'badge-images', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Cualquiera puede leer las imágenes (público)
DROP POLICY IF EXISTS "badge_images_public_read" ON storage.objects;
CREATE POLICY "badge_images_public_read" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'badge-images');

-- Política: Solo service role puede subir/actualizar
DROP POLICY IF EXISTS "badge_images_service_upload" ON storage.objects;
CREATE POLICY "badge_images_service_upload" 
ON storage.objects FOR INSERT 
TO service_role 
WITH CHECK (bucket_id = 'badge-images');

DROP POLICY IF EXISTS "badge_images_service_update" ON storage.objects;
CREATE POLICY "badge_images_service_update" 
ON storage.objects FOR UPDATE 
TO service_role 
USING (bucket_id = 'badge-images');