import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../lib/firebaseAdmin'; // Corrected path
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = getDb();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imageUrl, filterId, userId } = req.body;

        if (!imageUrl || !filterId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const docRef = await db.collection('posts').add({
            imageUrl,
            filterId,
            authorId: userId,
            createdAt: FieldValue.serverTimestamp(),
            likes: [],
        });

        res.status(201).json({ id: docRef.id });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
}
