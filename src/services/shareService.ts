import { Filter, User, Share } from '../types';
import { getApiBaseUrlRuntime } from '../utils/api';
import { downscale } from '../utils/downscale';
import { Capacitor } from '@capacitor/core';

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
  filterUrl?: string; // URL to the filter that created the image
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

// Helper function to generate filter URL for sharing
export const getFilterUrl = (filterId: string): string => {
  if (typeof window === 'undefined') return '';
  
  // On native platforms, use production URL instead of file:// or capacitor://
  const isNative = Capacitor.isNativePlatform();
  let baseUrl: string;
  
  if (isNative) {
    // Use production URL for native platforms
    baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL 
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '')
      : (process.env.NEXT_PUBLIC_VERCEL_URL 
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : 'https://project-genie-sigma.vercel.app');
  } else {
    // Use current origin for web
    baseUrl = window.location.origin;
  }
  
  return `${baseUrl}/?view=apply&filterId=${filterId}`;
};

export const shareImage = async (
  base64ImageDataUrl: string,
  filter: Filter,
  user: User | null
): Promise<ShareResult> => {
  const baseUrl = getApiBaseUrlRuntime();
  const appUrl = window.location.origin;
  const filterUrl = getFilterUrl(filter.id);
  const shareText = `Check out this image I created with the '${filter?.name ?? ""}' filter on Genie! Create your own here: ${filterUrl}`;
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
    console.log('[Share] Starting share process...');
    
    // 1. Convert base64ImageDataUrl to proper format if needed and downscale it
    let imageDataUrl = base64ImageDataUrl;
    console.log('[Share] Image format:', imageDataUrl.startsWith('data:') ? 'data URL' : 'HTTP URL');
    
    // If it's already a data URL, use it directly
    // If it's an HTTP URL, fetch it and convert to data URL
    if (!imageDataUrl.startsWith('data:')) {
      console.log('[Share] Fetching image from URL...');
      const fetchRes = await fetch(imageDataUrl);
      if (!fetchRes.ok) {
        throw new Error(`Failed to fetch image: ${fetchRes.statusText}`);
      }
      const imageBlob = await fetchRes.blob();
      imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });
      console.log('[Share] Image converted to data URL');
    }

    // 2. Downscale the image to reduce size before uploading (max 1024px, WebP format with 0.8 quality)
    // This prevents 413 Payload Too Large errors and speeds up uploads
    console.log('[Share] Downscaling image before upload...');
    let downscaledBase64: string;
    try {
      downscaledBase64 = await downscale(imageDataUrl, 1024, 'webp', 0.8);
      console.log('[Share] Image downscaled successfully, size:', downscaledBase64.length, 'bytes');
    } catch (downscaleError) {
      console.error('[Share] Downscale failed:', downscaleError);
      // If WebP downscale fails, try PNG as fallback
      console.log('[Share] Trying PNG format as fallback...');
      downscaledBase64 = await downscale(imageDataUrl, 1024, 'png', 1.0);
      console.log('[Share] Image downscaled to PNG successfully');
    }
    
    const downscaledDataUrl = downscaledBase64.startsWith('data:') 
      ? downscaledBase64 
      : `data:image/webp;base64,${downscaledBase64}`;

    // 3. Upload downscaled image to R2 using /api/save-image endpoint
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const directoryName = `${timestamp}-${randomId}`;
    
    console.log('[Share] Uploading image to R2...');
    const uploadResponse = await fetch(`${baseUrl}/api/save-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image: downscaledDataUrl, 
        destination: 'shared',
        directoryName: directoryName
      }),
    });

    console.log('[Share] Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      let errorText = 'Failed to upload image';
      try {
        const errorData = await uploadResponse.json();
        errorText = errorData.error || `Upload failed with status ${uploadResponse.status}`;
        console.error('[Share] Upload error:', errorData);
      } catch (parseError) {
        const text = await uploadResponse.text().catch(() => 'Unknown error');
        console.error('[Share] Upload error response:', text);
        errorText = `Upload failed: ${text.substring(0, 200)}`;
      }
      throw new Error(errorText);
    }

    const uploadData = await uploadResponse.json();
    console.log('[Share] Upload response data:', uploadData);
    
    const fileUrl = uploadData.url;
    if (!fileUrl) {
      console.error('[Share] No URL in upload response:', uploadData);
      throw new Error('No URL returned from image upload');
    }

    console.log('[Share] Image uploaded successfully, URL:', fileUrl);

    // 4. Send fileUrl to /api/share
    const payload = {
      imageUrl: fileUrl, // Use the public URL from R2
      filterName: filter.name,
      filterId: filter.id,
      username: user?.email ?? null,
    };

    console.log('[Share] Creating share record...', payload);
    const response = await fetch(`${baseUrl}/api/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('[Share] Share API response status:', response.status);
    
    let data: ShareApiResponse;
    try {
      data = await response.json();
      console.log('[Share] Share API response data:', data);
    } catch (parseError) {
      const text = await response.text().catch(() => 'Unknown error');
      console.error('[Share] Failed to parse share API response:', text);
      throw new Error(`Failed to parse share response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      throw new Error(data.error ?? `Share API failed with status ${response.status}`);
    }
    
    if (!data.shareUrl) {
      console.error('[Share] No shareUrl in response:', data);
      throw new Error('No shareUrl returned from share API');
    }

    console.log('[Share] Share created successfully:', data.shareUrl);

    // Include both the shared image URL and the filter URL for convenience
    return { status: 'modal', shareUrl: data.shareUrl, filterUrl };
  } catch (error: unknown) {
    console.error('❌ Error sharing image:', error);
    if (error instanceof Error) {
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
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
