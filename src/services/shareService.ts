import { Filter, User, Share } from '../types';
import { getApiBaseUrlRuntime } from '../utils/api';

interface SharedImage {
  imageUrl: string;
  filterName: string;
  filterId?: string;   // ✅ added filterId support
  username?: string;
  [key: string]: unknown;
}

interface ShareApiResponse {
  shareUrl?: string;
  shareId?: string;
  share?: SharedImage;
  error?: string;
  details?: string;
}

export interface ShareResult {
  status: 'shared' | 'modal';
  shareUrl: string;
}

// Specific type for the response from the toggleLike API
interface ToggleLikeApiResponse {
    message: string;
    share: Share;
}

// Specific type for the error response from the toggleLike API
interface ToggleLikeApiError {
    error: string;
    details?: string;
}


function isWindows(): boolean {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
}

export const getSharedImage = async (shareId: string): Promise<SharedImage> => {
  const baseUrl = getApiBaseUrlRuntime();
  try {
    const response = await fetch(`${baseUrl}/api/share?id=${shareId}`, {
      method: 'GET',
    });

    const data: ShareApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to get shared image');
    }

    return data.share as SharedImage;
  } catch (error: unknown) {
    console.error('❌ Error getting shared image:', error);
    throw error;
  }
};

export const shareImage = async (
  base64ImageDataUrl: string,
  filter: Filter,
  user: User | null
): Promise<ShareResult> => {
  const baseUrl = getApiBaseUrlRuntime();
  const appUrl = window.location.origin;
  const shareText = `Check out this image I created with the '${filter?.name ?? ""}' filter on Genie! Create your own here: ${appUrl}`;
  const filename = `filtered-${Date.now()}.png`;

  if (!isWindows() && navigator.share && navigator.canShare) {
    try {
      const response = await fetch(base64ImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Filtered with Genie",
          text: shareText,
          url: appUrl,
          files: [file],
        });
        return { status: 'shared', shareUrl: base64ImageDataUrl };
      }
    } catch (error: unknown) {
      console.log('⚠️ Web Share API failed, falling back to backend:', error);
    }
  }

  try {
    // 1. Convert base64ImageDataUrl to Blob
    const fetchRes = await fetch(base64ImageDataUrl);
    const imageBlob = await fetchRes.blob();

    // 2. Call /api/upload-url to get a signed URL for R2
    const uploadUrlResponse = await fetch(`${baseUrl}/api/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentType: imageBlob.type, folder: 'shared' }),
    });

    if (!uploadUrlResponse.ok) {
      const errorData = await uploadUrlResponse.json();
      throw new Error(errorData.error || 'Failed to get upload URL for R2');
    }

    const { uploadUrl, fileUrl } = await uploadUrlResponse.json();

    // 3. Upload image to R2 using the signed URL
    const uploadImageResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': imageBlob.type },
      body: imageBlob,
    });

    if (!uploadImageResponse.ok) {
      throw new Error('Failed to upload image to R2');
    }

    // 4. Send fileUrl to /api/share
    const payload = {
      imageUrl: fileUrl, // Use the public URL from R2
      filterName: filter.name,
      filterId: filter.id,
      username: user?.email ?? null,
    };

    const response = await fetch(`${baseUrl}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: ShareApiResponse = await response.json();

    if (!response.ok || !data.shareUrl) {
      throw new Error(data.error ?? 'Failed to share image');
    }

    return { status: 'modal', shareUrl: data.shareUrl };
  } catch (error: unknown) {
    console.error('❌ Error sharing image:', error);
    throw error;
  }
};


export const fetchPublicFeed = async (): Promise<Share[]> => {
    const baseUrl = getApiBaseUrlRuntime();
    try {
        const response = await fetch(`${baseUrl}/api/shares/public`);
        if (!response.ok) {
            // Try to parse the error details from the API response
            const data: ShareApiResponse = await response.json().catch(() => ({ error: 'Failed to fetch public feed. The API response was not valid JSON.' }));
            // Construct a more informative error message
            const errorMessage = `${data.error}${data.details ? `: ${data.details}` : ''}`;
            throw new Error(errorMessage);
        }
        const result = await response.json();
        return result.shares || [];
    } catch (error) {
        console.error('Error fetching public feed:', error);
        throw error;
    }
};

export const fetchUser = async (userId: string): Promise<User> => {
    const baseUrl = getApiBaseUrlRuntime();
    try {
        const response = await fetch(`${baseUrl}/api/user/profile?userId=${userId}`);
        if (!response.ok) {
            const data: ShareApiResponse = await response.json().catch(() => ({ error: `Failed to fetch user ${userId}` }));
            const errorMessage = `${data.error}${data.details ? `: ${data.details}` : ''}`;
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        throw error;
    }
};


export const toggleLike = async (postId: string, idToken: string): Promise<Share> => {
    const baseUrl = getApiBaseUrlRuntime();
    const response = await fetch(`${baseUrl}/api/shares/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ postId }),
    });

    if (!response.ok) {
        const errorData: ToggleLikeApiError = await response.json();
        const errorMessage = `${errorData.error}${errorData.details ? `: ${errorData.details}` : ''}`;
        throw new Error(errorMessage || 'Failed to toggle like');
    }

    const data: ToggleLikeApiResponse = await response.json();
    if (!data.share) {
        throw new Error("API did not return a share object after toggling like.");
    }

    return data.share;
};

export const postToFeed = async (shareId: string): Promise<void> => {
  const baseUrl = getApiBaseUrlRuntime();
  try {
    const response = await fetch(`${baseUrl}/api/shares/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? 'Failed to post to feed');
    }
  } catch (error: unknown) {
    console.error('❌ Error posting to feed:', error);
    throw error;
  }
};

export const fetchFilter = async (filterId: string, idToken: string): Promise<Filter> => {
    const baseUrl = getApiBaseUrlRuntime();
    const response = await fetch(`${baseUrl}/api/filters/${filterId}`, {
        headers: {
            'Authorization': `Bearer ${idToken}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = `${errorData.error}${errorData.details ? `: ${errorData.details}` : ''}`;
        throw new Error(errorMessage || 'Failed to fetch filter');
    }

    const data = await response.json();
    return data.filter;
};
