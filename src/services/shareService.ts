import { Filter, User } from '../types';

interface SharedImage {
  imageUrl: string;
  filterName: string;
  username?: string;
  [key: string]: unknown;
}

interface ShareApiResponse {
  shareUrl?: string;
  shareId?: string;
  share?: SharedImage;
  error?: string;
}

export interface ShareResult {
  status: 'shared' | 'modal';
  shareUrl: string;
}

function isWindows(): boolean {
  return typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);
}

export const getSharedImage = async (shareId: string): Promise<SharedImage> => {
  try {

    const response = await fetch(`/api/share?id=${shareId}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to get shared image');
    }

    return data as SharedImage;
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
  const appUrl = window.location.origin;
  const shareText = `Check out this image I created with the '${filter?.name ?? ""}' filter on Genie! Create your own here: ${appUrl}`;
  const filename = `filtered-${Date.now()}.png`;

  // ✅ On mobile (not Windows), try Web Share API
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
      // continue to backend fallback
    }
  }

  // ✅ Backend fallback (Windows OR failed Web Share)
  try {
    const payload = {
      imageUrl: base64ImageDataUrl,
      filterName: filter.name,
      username: user?.email ?? null,
    };


    const response = await fetch('/api/share', {
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
