import type { NextApiRequest, NextApiResponse } from 'next';
import { saveFilter } from '../../services/firebaseService';
import { Filter } from '../../types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filterData: Omit<Filter, 'id'> = req.body;

        // Basic validation
        if (!filterData.name || !filterData.prompt || !filterData.previewImageUrl) {
            return res.status(400).json({ error: 'Missing required fields: name, prompt, previewImageUrl' });
        }

        const newFilter = await saveFilter(filterData);
        return res.status(201).json(newFilter);
    } catch (error) {
        console.error('Error creating filter:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
