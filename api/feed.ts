import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../lib/firebaseAdmin'; // Corrected path

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = getDb();

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const postsSnapshot = await db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(posts);

    } catch (error) {
        console.error('Error fetching public feed:', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
}
