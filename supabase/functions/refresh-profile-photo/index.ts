import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchProfilePhotoFromProvider, downloadImage } from '../_shared/profile-photo-provider.ts';
import { withCORS, handleCORSPreflight } from '../_shared/cors.ts';

/**
 * Edge Function: refresh-profile-photo
 * 
 * Fetches and stores profile photos for creators
 * 
 * Input:
 *   - creator_id (optional): UUID of creator
 *   - username (optional): TikTok username
 * 
 * Flow:
 *   1. Resolve creator from DB
 *   2. Fetch photo URL from external provider
 *   3. Download image
 *   4. Upload to Supabase Storage
 *   5. Update creator record with public URL
 */

serve(async (req) => {
    const origin = req.headers.get('origin');

    if (req.method === 'OPTIONS') {
        return handleCORSPreflight(origin);
    }

    try {
        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Parse request body
        const { creator_id, username } = await req.json();

        if (!creator_id && !username) {
            return withCORS(
                new Response(
                    JSON.stringify({
                        status: 'error',
                        error_message: 'Either creator_id or username is required'
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                ),
                origin
            );
        }

        console.log(`[refresh-profile-photo] Processing: creator_id=${creator_id}, username=${username}`);

        // Resolve creator from database
        let query = supabase
            .from('creators')
            .select('id, tiktok_username, creator_id, nombre');

        if (creator_id) {
            query = query.eq('id', creator_id);
        } else {
            query = query.eq('tiktok_username', username);
        }

        const { data: creators, error: fetchError } = await query.single();

        if (fetchError || !creators) {
            console.error('[refresh-profile-photo] Creator not found:', fetchError);
            return withCORS(
                new Response(
                    JSON.stringify({
                        status: 'error',
                        error_message: 'Creator not found'
                    }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                ),
                origin
            );
        }

        const resolvedUsername = creators.tiktok_username || username;
        const resolvedCreatorId = creators.id;

        console.log(`[refresh-profile-photo] Resolved: ${resolvedUsername} (${resolvedCreatorId})`);

        // Fetch profile photo from provider
        const photoResult = await fetchProfilePhotoFromProvider(resolvedUsername);

        if (!photoResult.success || !photoResult.photoUrl) {
            console.error('[refresh-profile-photo] Failed to fetch photo:', photoResult.error);
            return withCORS(
                new Response(
                    JSON.stringify({
                        status: 'error',
                        creator_id: resolvedCreatorId,
                        username: resolvedUsername,
                        error_message: photoResult.error || 'Failed to fetch profile photo'
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                ),
                origin
            );
        }

        console.log(`[refresh-profile-photo] Photo URL obtained: ${photoResult.photoUrl}`);

        // Download image
        let imageBlob: Blob;
        try {
            imageBlob = await downloadImage(photoResult.photoUrl);
        } catch (error) {
            console.error('[refresh-profile-photo] Failed to download image:', error);
            return withCORS(
                new Response(
                    JSON.stringify({
                        status: 'error',
                        creator_id: resolvedCreatorId,
                        username: resolvedUsername,
                        error_message: `Failed to download image: ${error instanceof Error ? error.message : String(error)}`
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                ),
                origin
            );
        }

        // Upload to Supabase Storage
        const filename = `${resolvedCreatorId}.jpg`;
        const bucketName = 'creator-avatars';

        console.log(`[refresh-profile-photo] Uploading to storage: ${bucketName}/${filename}`);

        // Delete existing file if it exists
        await supabase.storage
            .from(bucketName)
            .remove([filename]);

        // Upload new file
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filename, imageBlob, {
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: true,
            });

        if (uploadError) {
            console.error('[refresh-profile-photo] Upload failed:', uploadError);
            return withCORS(
                new Response(
                    JSON.stringify({
                        status: 'error',
                        creator_id: resolvedCreatorId,
                        username: resolvedUsername,
                        error_message: `Failed to upload image: ${uploadError.message}`
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                ),
                origin
            );
        }

        // Generate public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filename);

        const publicUrl = publicUrlData.publicUrl;

        console.log(`[refresh-profile-photo] Public URL: ${publicUrl}`);

        // Update creator record
        const { error: updateError } = await supabase
            .from('creators')
            .update({
                profile_image_url: publicUrl,
                profile_image_last_refreshed: new Date().toISOString(),
            })
            .eq('id', resolvedCreatorId);

        if (updateError) {
            console.error('[refresh-profile-photo] Failed to update creator:', updateError);
            return withCORS(
                new Response(
                    JSON.stringify({
                        status: 'error',
                        creator_id: resolvedCreatorId,
                        username: resolvedUsername,
                        error_message: `Failed to update creator record: ${updateError.message}`
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                ),
                origin
            );
        }

        console.log(`[refresh-profile-photo] ✅ Success for ${resolvedUsername}`);

        return withCORS(
            new Response(
                JSON.stringify({
                    status: 'ok',
                    creator_id: resolvedCreatorId,
                    username: resolvedUsername,
                    profile_image_url: publicUrl,
                }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            ),
            origin
        );

    } catch (error) {
        console.error('[refresh-profile-photo] Unexpected error:', error);
        return withCORS(
            new Response(
                JSON.stringify({
                    status: 'error',
                    error_message: error instanceof Error ? error.message : String(error)
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            ),
            origin
        );
    }
});
