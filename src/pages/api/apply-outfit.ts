import type { NextApiRequest, NextApiResponse } from 'next';
import { mergeImages } from '../../services/geminiService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, outfitImage, outfitPrompt } = req.body;

        if (!image || !outfitImage || !outfitPrompt) {
            return res.status(400).json({ error: 'Missing required fields: image, outfitImage, outfitPrompt' });
        }

        // mergeImages takes an array of inputs and a prompt
        const resultImageUrl = await mergeImages([image, outfitImage], outfitPrompt);

        return res.status(200).json({ resultImageUrl });
    } catch (error: any) {
        console.error('Error applying outfit:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
