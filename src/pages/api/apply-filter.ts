import type { NextApiRequest, NextApiResponse } from 'next';
import { applyImageFilter } from '../../services/geminiService';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image, filterPrompt } = req.body;

        if (!image || !filterPrompt) {
            return res.status(400).json({ error: 'Missing required fields: image, filterPrompt' });
        }

        const resultImageUrl = await applyImageFilter([image], filterPrompt);

        return res.status(200).json({ resultImageUrl });
    } catch (error: any) {
        console.error('Error applying filter:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}
