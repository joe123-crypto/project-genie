// Updated firebaseService.ts to only call our API routes
import { Filter, User } from '../types';

/**
 * Fetches all filters from the backend API
 * @returns A promise that resolves to an array of Filter objects
 */
export const getFilters = async (): Promise<Filter[]> => {
    try {
        const response = await fetch('/api/firebase?action=getFilters', {
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
 * Saves a filter to the backend
 * @param filter - The filter object to save
 * @param idToken - The user's ID token for authentication
 * @returns A promise that resolves to the saved Filter object
 */
export const saveFilter = async (filter: Omit<Filter, 'id'>, idToken: string): Promise<Filter> => {
    try {
        const response = await fetch('/api/firebase?action=saveFilter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filter, idToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save filter');
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
 * @param idToken - The user's ID token for authentication
 * @returns A promise that resolves when the filter is deleted
 */
export const deleteFilter = async (filterId: string, idToken: string): Promise<void> => {
    try {
        const response = await fetch('/api/firebase?action=deleteFilter', {
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
 * Updates a filter in the backend
 * @param filterId - The ID of the filter to update
 * @param filterData - The updated filter data
 * @param idToken - The user's ID token for authentication
 * @returns A promise that resolves to the updated Filter object
 */
export const updateFilter = async (filterId: string, filterData: Omit<Filter, 'id'>, idToken: string): Promise<Filter> => {
    try {
        const response = await fetch('/api/firebase?action=updateFilter', {
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
 * Increments the access count for a filter
 * @param filterId - The ID of the filter
 * @returns A promise that resolves when the count is incremented
 */
export const incrementFilterAccessCount = async (filterId: string): Promise<void> => {
    try {
        const response = await fetch('/api/firebase?action=incrementAccessCount', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filterId }),
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
