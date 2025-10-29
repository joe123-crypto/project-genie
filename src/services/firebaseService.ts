// Updated firebaseService.ts to only call our API routes
import { Filter, Outfit } from '../types';

const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return '';
    }
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
        return `https://${vercelUrl}`;
    }

    const renderInternalHostname = process.env.RENDER_INTERNAL_HOSTNAME;
    if (renderInternalHostname) {
        return `http://${renderInternalHostname}:${process.env.PORT}`;
    }

    return 'http://localhost:3000';
};

/**
 * Fetches all filters from the backend API
 * @returns A promise that resolves to an array of Filter objects
 */
export const getFilters = async (): Promise<Filter[]> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=getFilters`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch filters');
        }

        const data = await response.json();
        return data.filters || [];
    } catch (error) {
        console.error('Error fetching filters:', error);
        throw error;
    }
};

/**
 * Fetches a single filter by its ID from the backend API
 * @param id - The ID of the filter to fetch
 * @returns A promise that resolves to the Filter object
 */
export const getFilterById = async (id: string): Promise<Filter> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=getFilterById&id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch filter');
        }

        const data = await response.json();
        return data.filter;
    } catch (error) {
        console.error(`Error fetching filter with id ${id}:`, error);
        throw error;
    }
}


/**
 * Saves a filter to the backend
 * @param filter - The filter object to save
 * @param idToken - The user's ID token for authentication (currently unused)
 * @returns A promise that resolves to the saved Filter object
 */
export const saveFilter = async (filter: Omit<Filter, 'id'>, idToken: string): Promise<Filter> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=saveFilter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filter, idToken }), // idToken is passed in the body for now
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error saving filter, response text:", errorText);
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Failed to save filter');
            } catch {
                throw new Error('Failed to save filter, and the response was not valid JSON.');
            }
        }

        const data = await response.json();
        return data.filter;
    } catch (error) {
        console.error('Error saving filter:', error);
        throw error;
    }
};

/**
 * Deletes a filter from the backend
 * @param filterId - The ID of the filter to delete
 * @param idToken - The user's ID token for authentication (currently unused)
 * @returns A promise that resolves when the filter is deleted
 */
export const deleteFilter = async (filterId: string, idToken: string): Promise<void> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=deleteFilter`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filterId, idToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete filter');
        }
    } catch (error) {
        console.error('Error deleting filter:', error);
        throw error;
    }
};

/**
 * Deletes a user account from the backend
 * @param idToken - The user's ID token for authentication (currently unused)
 * @returns A promise that resolves when the user is deleted
 */
export const deleteUser = async (idToken: string): Promise<void> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/user`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken })
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
 * Updates a filter in the backend
 * @param filterId - The ID of the filter to update
 * @param filterData - The updated filter data
 * @param idToken - The user's ID token for authentication (currently unused)
 * @returns A promise that resolves to the updated Filter object
 */
export const updateFilter = async (filterId: string, filterData: Omit<Filter, 'id'>, idToken: string): Promise<Filter> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=updateFilter`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filterId, filterData, idToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update filter');
        }

        const data = await response.json();
        return data.filter;
    } catch (error) {
        console.error('Error updating filter:', error);
        throw error;
    }
};

/**
 * Saves an outfit to the backend
 * @param outfitData - The outfit object to save
 * @param idToken - The user's ID token for authentication (currently unused)
 * @returns A promise that resolves to the saved Outfit object
 */

export const saveOutfit = async (outfitData: Omit<Outfit, 'id'>, idToken: string) => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=saveOutfit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                outfit: {
                    ...outfitData,
                    createdAt: new Date().toISOString(),
                },
                idToken,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save outfit to Firestore.');
        }

        return data.outfit;
    } catch (err) {
        console.error('❌ Error in saveOutfit:', err);
        throw err;
    }
};
  
  
/**
 * Increments the access count for a filter
 * @param filterId - The ID of the filter
 * @returns A promise that resolves when the count is incremented
 */
export const incrementFilterAccessCount = async (filterId: string): Promise<void> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=incrementFilterAccessCount`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: filterId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to increment access count');
        }
    } catch (error) {
        console.error('Error incrementing access count:', error);
        // This is a non-critical operation, so we don't throw
    }
};

/**
 * Fetches all outfits from the backend API
 * @returns A promise that resolves to an array of Outfit objects
 */
export const getOutfits = async (): Promise<Outfit[]> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=getOutfits`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch outfits');
        }

        const data = await response.json();
        console.log("outfits",data.outfits);
        return data.outfits || [];
    } catch (error) {
        console.error('Error fetching outfits:', error);
        throw error;
    }
};

/**
 * Increments the access count for an outfit
 * @param outfitId - The ID of the outfit
 * @returns A promise that resolves when the count is incremented
 */
export const incrementOutfitAccessCount = async (outfitId: string): Promise<void> => {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/firebase?action=incrementOutfitAccessCount`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: outfitId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to increment outfit access count');
        }
    } catch (error) {
        console.error('Error incrementing outfit access count:', error);
        // This is a non-critical operation, so we don't throw
    }
};
