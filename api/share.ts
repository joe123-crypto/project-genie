import { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { imageUrl, filterId, filterName, username } = req.body;

        if (!imageUrl || !filterId || !filterName) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const docRef = await addDoc(collection(db, 'sharedImages'), {
            imageUrl,
            filterId,
            filterName,
            username,
            createdAt: serverTimestamp(),
        });

        res.status(201).json({ id: docRef.id });

    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ error: 'Failed to create share' });
    }
}
