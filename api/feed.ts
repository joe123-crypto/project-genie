import { NextApiRequest, NextApiResponse } from 'next';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const postsQuery = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const querySnapshot = await getDocs(postsQuery);
        const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.status(200).json(posts);

    } catch (error) {
        console.error('Error fetching public feed:', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
}
