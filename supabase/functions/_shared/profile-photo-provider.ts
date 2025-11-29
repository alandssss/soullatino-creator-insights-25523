/**
 * Profile Photo Provider
 * 
 * Abstraction layer for fetching profile photos from external providers.
 * Supports configurable providers via environment variables.
 */

interface ProfilePhotoResult {
    success: boolean;
    photoUrl?: string;
    error?: string;
}

/**
 * Fetch profile photo URL from configured provider
 * 
 * @param username - Creator username (TikTok handle without @)
 * @returns ProfilePhotoResult with photo URL or error
 */
export async function fetchProfilePhotoFromProvider(
    username: string
): Promise<ProfilePhotoResult> {
    const providerUrl = Deno.env.get('PROFILE_PROVIDER_URL');
    const providerApiKey = Deno.env.get('PROFILE_PROVIDER_API_KEY');

    if (!providerUrl) {
        console.warn('PROFILE_PROVIDER_URL not configured, using placeholder');
        // Return a placeholder avatar service as fallback
        return {
            success: true,
            photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&size=200&background=random`,
        };
    }

    try {
        const url = new URL(providerUrl);
        url.searchParams.set('username', username);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (providerApiKey) {
            headers['Authorization'] = `Bearer ${providerApiKey}`;
        }

        console.log(`Fetching profile photo for ${username} from ${providerUrl}`);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            throw new Error(`Provider returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        // Support multiple response formats
        const photoUrl = data.photo_url || data.photoUrl || data.avatar_url || data.avatarUrl || data.url;

        if (!photoUrl) {
            throw new Error('Provider response missing photo URL');
        }

        return {
            success: true,
            photoUrl,
        };
    } catch (error) {
        console.error(`Error fetching profile photo for ${username}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Download image from URL and return as Blob
 * 
 * @param imageUrl - URL of image to download
 * @returns Blob of image data
 */
export async function downloadImage(imageUrl: string): Promise<Blob> {
    console.log(`Downloading image from ${imageUrl}`);

    const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(15000), // 15s timeout for image download
    });

    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
    }

    return await response.blob();
}
