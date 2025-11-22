import type { NextApiRequest, NextApiResponse } from 'next';
import { getFilters, getOutfits } from '../../services/firebaseService';
import { Filter, Outfit } from '../../types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { q, type } = req.query;
        const searchQuery = (q as string || '').toLowerCase();
        const searchType = type as string; // 'filter' | 'outfit' | undefined (both)

        let results: (Filter | Outfit)[] = [];

        if (!searchType || searchType === 'filter') {
            const filters = await getFilters();
            const matchedFilters = filters.filter(f =>
                f.name.toLowerCase().includes(searchQuery) ||
                f.prompt.toLowerCase().includes(searchQuery)
            );
            results = [...results, ...matchedFilters];
        }

        if (!searchType || searchType === 'outfit') {
            const outfits = await getOutfits();
            const matchedOutfits = outfits.filter(o =>
                o.name.toLowerCase().includes(searchQuery) ||
                o.prompt.toLowerCase().includes(searchQuery)
            );
            results = [...results, ...matchedOutfits];
        }

        return res.status(200).json(results);
    } catch (error: any) {
        console.error('Error searching:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
