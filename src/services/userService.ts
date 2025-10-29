
import { User, Share, Outfit, Filter } from '../types';

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
 * @param email The user's email.
 * @param idToken The user's ID token.
 * @returns A promise that resolves to an array of Share objects.
 */
export const fetchUserImages = async (email: string, idToken: string): Promise<Share[]> => {
  try {
    const response = await fetch(`/api/user/images?email=${email}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
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
 * Fetches a user's created outfits.
 * @param uid The user's ID.
 * @param idToken The user's ID token.
 * @returns A promise that resolves to an array of Outfit objects.
 */
export const fetchUserOutfits = async (uid: string, idToken: string): Promise<Outfit[]> => {
    try {
      const response = await fetch(`/api/user/outfits?uid=${uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
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
   * @param idToken The user's ID token.
   * @returns A promise that resolves to an array of Filter objects.
   */
  export const fetchUserFilters = async (uid: string, idToken: string): Promise<Filter[]> => {
    try {
      const response = await fetch(`/api/user/filters?uid=${uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
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
