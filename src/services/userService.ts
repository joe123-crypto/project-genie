
import { User, Share, Outfit, Filter } from '../types';

export const saveImage = async (idToken: string, image: string, destination: string, generationId?: string, prompt?: string, negativePrompt?: string, numInferenceSteps?: number, guidanceScale?: number, strength?: number, lora?: string): Promise<string> => {
  try {
    const response = await fetch('/api/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ 
        image, 
        destination, 
        generationId, 
        prompt, 
        negativePrompt, 
        numInferenceSteps, 
        guidanceScale, 
        strength, 
        lora 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save image');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

/**
 * Updates a user's profile information.
 * @param uid The user's ID.
 * @param profileData The data to update.
 * @param idToken The user's ID token.
 */
export const updateUserProfile = async (uid: string, profileData: Partial<User>, idToken: string): Promise<void> => {
  try {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ uid, profileData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Uploads a new profile picture for the user.
 * @param uid The user's ID.
 * @param file The image file to upload.
 * @param idToken The user's ID token.
 * @returns The URL of the uploaded image.
 */
export const uploadProfilePicture = async (uid: string, file: File, idToken: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uid', uid);

    const response = await fetch('/api/user/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload profile picture');
    }

    const data = await response.json();
    return data.photoURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Deletes a user's account.
 * @param idToken The user's ID token.
 */
export const deleteUser = async (idToken: string): Promise<void> => {
  try {
    const response = await fetch('/api/user', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Fetches a user's images.
 * @param uid The user's ID.
 * @param idToken The user's ID token. (Optional, if not provided, fetches public images)
 * @returns A promise that resolves to an array of Share objects.
 */
export const fetchUserImages = async (uid: string, idToken?: string): Promise<Share[]> => {
  if (typeof uid !== 'string' || !uid) {
    throw new Error('uid must be a non-empty string');
  }

  const headers: HeadersInit = {};
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  try {
    const response = await fetch(`/api/user/images?uid=${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user images');
    }

    const images = await response.json();
    return images;
  } catch (error) {
    console.error('Error fetching user images:', error);
    throw error;
  }
};

/**
 * Deletes a user's image.
 * @param imageId The ID of the image to delete.
 * @param idToken The user's ID token.
 */
export const deleteUserImage = async (imageId: string, idToken: string): Promise<void> => {
  try {
    const response = await fetch(`/api/user/images?imageId=${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete image');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Fetches a user's created outfits.
 * @param uid The user's ID.
 * @param idToken The user's ID token. (Optional, if not provided, fetches public outfits)
 * @returns A promise that resolves to an array of Outfit objects.
 */
export const fetchUserOutfits = async (uid: string, idToken?: string): Promise<Outfit[]> => {
    const headers: HeadersInit = {};
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    try {
      const response = await fetch(`/api/user/outfits?uid=${uid}`, {
        method: 'GET',
        headers: headers,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user outfits');
      }
  
      const outfits = await response.json();
      return outfits;
    } catch (error) {
      console.error('Error fetching user outfits:', error);
      throw error;
    }
  };
  
  /**
   * Fetches a user's created filters.
   * @param uid The user's ID.
   * @param idToken The user's ID token. (Optional, if not provided, fetches public filters)
   * @returns A promise that resolves to an array of Filter objects.
   */
  export const fetchUserFilters = async (uid: string, idToken?: string): Promise<Filter[]> => {
    const headers: HeadersInit = {};
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    try {
      const response = await fetch(`/api/user/filters?uid=${uid}`, {
        method: 'GET',
        headers: headers,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user filters');
      }
  
      const filters = await response.json();
      return filters;
    } catch (error) {
      console.error('Error fetching user filters:', error);
      throw error;
    }
  };
