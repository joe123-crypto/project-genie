// Updated shareService.ts to only call our API routes
import { Filter, User } from '../types';

/**
 * Shares an image using the best method available for the user's device.
 * - On mobile, uses the native Web Share API to share the image file directly.
 * - On desktop, uploads the image to Firebase Storage, creates a shareable link,
 *   and copies it to the clipboard.
 * @returns A promise that resolves to 'shared' or 'copied' on success.
 */
export const shareImage = async (
  base64ImageDataUrl: string,
  filter: Filter,
  user: User | null
): Promise<'shared' | 'copied'> => {
  const appUrl = window.location.origin;
  const shareText = `Check out this image I created with the '${filter?.name ?? ""}' filter on Genie! Create your own here: ${appUrl}`;
  const filename = `filtered-${Date.now()}.png`;

  // Check if Web Share API is available (mobile devices)
  if (navigator.share && navigator.canShare) {
    try {
      // Convert base64 to blob
      const response = await fetch(base64ImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Filtered with" ,
          text: shareText,
          files: [file]
        });
        return 'shared';
      }
    } catch (error) {
      console.log('Web Share API failed, falling back to link sharing:', error);
    }
  }

  // Fallback: Upload to backend and copy link
  try {
    const response = await fetch('/api/share?action=shareImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64ImageDataUrl, filter, user }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to share image');
    }

    const data = await response.json();
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      return 'copied';
    } catch (clipboardError) {
      console.error('Failed to copy to clipboard:', clipboardError);
      // Fallback: show the URL in an alert
      alert("Share this link:" );
      return 'copied';
    }
  } catch (error) {
    console.error('Error sharing image:', error);
    throw error;
  }
};

/**
 * Gets a shared image by its ID
 * @param shareId - The share ID
 * @returns A promise that resolves to the Share object
 */
export const getSharedImage = async (shareId: string): Promise<any> => {
  try {
    const response = await fetch('/api/share?action=getShare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ shareId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get shared image');
    }

    const data = await response.json();
    return data.share;
  } catch (error) {
    console.error('Error getting shared image:', error);
    throw error;
  }
};
