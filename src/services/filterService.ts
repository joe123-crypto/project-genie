import { Filter } from '../types';

export const fetchFilterById = async (filterId: string): Promise<Filter> => {
    const response = await fetch(`/api/filters/${filterId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch filter');
    }
    return response.json();
};
