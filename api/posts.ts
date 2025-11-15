import { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseAdmin'; // Using admin SDK

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imageUrl, filterId, userId } = req.body;

        if (!imageUrl || !filterId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const docRef = await addDoc(collection(db, 'posts'), {
            imageUrl,
            filterId,
            authorId: userId,
            createdAt: serverTimestamp(),
            likes: [],
        });

        res.status(201).json({ id: docRef.id });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
}
