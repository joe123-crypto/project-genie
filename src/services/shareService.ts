import { Filter, User } from '../types';

interface SharedImage {
  imageUrl: string;
  filterName: string;
  username?: string;
  [key: string]: unknown;
}

interface ShareApiResponse {
  shareUrl?: string;
  share?: SharedImage;
  error?: string;
}

export const shareImage = async (
  base64ImageDataUrl: string,
  filter: Filter,
  user: User | null
): Promise<'shared' | 'copied'> => {
  const appUrl = window.location.origin;
  const shareText = `Check out this image I created with the '${filter?.name ?? ""}' filter on Genie! Create your own here: ${appUrl}`;
  const filename = `filtered-${Date.now()}.png`;

  if (navigator.share && navigator.canShare) {
    try {
      const response = await fetch(base64ImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Filtered with", text: shareText, files: [file] });
        return 'shared';
      }
    } catch (error: unknown) {
      if (error instanceof Error) console.log('Web Share API failed, fallback:', error.message);
      else console.log('Web Share API failed, fallback:', error);
    }
  }

  try {
    const response = await fetch('/api/share?action=shareImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64ImageDataUrl, filter, user }),
    });

    const data: ShareApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to share image');
    }

    try {
      await navigator.clipboard.writeText(data.shareUrl ?? '');
      return 'copied';
    } catch (clipboardError: unknown) {
      console.error('Failed to copy to clipboard:', clipboardError);
      alert("Share this link:");
      return 'copied';
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.error('Error sharing image:', error.message);
    else console.error('Error sharing image:', error);
    throw error;
  }
};

export const getSharedImage = async (shareId: string): Promise<SharedImage> => {
  try {
    const response = await fetch('/api/share?action=getShare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shareId }),
    });

    const data: ShareApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? 'Failed to get shared image');
    }

    return data.share as SharedImage;
  } catch (error: unknown) {
    if (error instanceof Error) console.error('Error getting shared image:', error.message);
    else console.error('Error getting shared image:', error);
    throw error;
  }
};
