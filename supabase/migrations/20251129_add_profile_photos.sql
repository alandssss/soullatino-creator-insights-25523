-- Add profile photo columns to creators table
ALTER TABLE creators 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_image_last_refreshed TIMESTAMP WITH TIME ZONE;

-- Create index for efficient queries on last_refreshed
CREATE INDEX IF NOT EXISTS idx_creators_profile_refresh 
ON creators(profile_image_last_refreshed) 
WHERE profile_image_url IS NULL OR profile_image_last_refreshed < NOW() - INTERVAL '7 days';

-- Create storage bucket for creator avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-avatars', 'creator-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for creator-avatars bucket
CREATE POLICY "Public read access for creator avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-avatars');

CREATE POLICY "Authenticated users can upload creator avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creator-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update creator avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'creator-avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can delete creator avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'creator-avatars' AND auth.role() = 'service_role');

COMMENT ON COLUMN creators.profile_image_url IS 'Public URL to creator profile photo stored in Supabase Storage';
COMMENT ON COLUMN creators.profile_image_last_refreshed IS 'Timestamp of last profile photo refresh';
