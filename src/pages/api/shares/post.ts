import { NextApiRequest, NextApiResponse } from 'next';
import { firestoreAdmin } from '../../../lib/firestoreAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { shareId } = req.body;

  if (!shareId) {
    return res.status(400).json({ error: 'shareId is required' });
  }

  try {
    const shareRef = firestoreAdmin.collection('shares').doc(shareId as string);
    await shareRef.update({ isPublic: true });

    res.status(200).json({ message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
}
