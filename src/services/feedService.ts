
import { Share } from "../types";

// Fetches the public feed from the new API endpoint
export const fetchPublicFeed = async (): Promise<Share[]> => {
  try {
    const response = await fetch('/api/feed');
    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching public feed:", error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

// Toggles a user's like on a post by calling the API
export const toggleLike = async (postId: string, idToken: string): Promise<Share> => {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};
