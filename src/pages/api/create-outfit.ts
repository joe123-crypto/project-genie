import type { NextApiRequest, NextApiResponse } from 'next';
import { saveOutfit } from '../../services/firebaseService';
import { Outfit } from '../../types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const outfitData: Omit<Outfit, 'id'> = req.body;

        // Basic validation
        if (!outfitData.name || !outfitData.prompt || !outfitData.previewImageUrl) {
            return res.status(400).json({ error: 'Missing required fields: name, prompt, previewImageUrl' });
        }

        const newOutfit = await saveOutfit(outfitData);
        return res.status(201).json(newOutfit);
    } catch (error) {
        console.error('Error creating outfit:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
