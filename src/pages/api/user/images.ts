
import { NextApiRequest, NextApiResponse } from 'next';
import { firestoreAdmin } from '../../../lib/firestoreAdmin';
import { verifyIdToken } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authorization.split('Bearer ')[1];

  const { email } = req.query;

  if (typeof email !== 'string') {
    return res.status(400).json({ error: 'email must be a string' });
  }

  try {
    const decodedToken = await verifyIdToken(idToken);
    const tokenEmail = decodedToken.email;

    if (tokenEmail !== email) {
      return res.status(403).json({ error: 'Forbidden: You can only fetch your own images' });
    }

    const sharesSnapshot = await firestoreAdmin
      .collection('shares')
      .where('email', '==', email)
      .limit(20)
      .get();

    const images = sharesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(images);
  } catch (error: any) {
    console.error('Error fetching user images:', error);
    if (error.code === 'auth/id-token-expired') {
        res.status(401).json({ error: 'Token expired' });
    } else if (error.code === 'auth/argument-error') {
        res.status(401).json({ error: 'Invalid token' });
    } else {
        res.status(500).json({ error: 'Failed to fetch user images' });
    }
  }
}
