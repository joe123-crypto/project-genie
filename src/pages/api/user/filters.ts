
import type { NextApiRequest, NextApiResponse } from 'next';
import { firestoreAdmin } from '../../../lib/firestoreAdmin';
import { Filter } from '../../../types';
import { verifyIdToken } from '../../../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await verifyIdToken(idToken);
    const tokenUid = decodedToken.uid;
    const { uid } = req.query;

    if (typeof uid !== 'string') {
      return res.status(400).json({ error: 'User ID must be a string' });
    }

    if (tokenUid !== uid) {
      return res.status(403).json({ error: 'Forbidden: You can only fetch your own data' });
    }

    const filtersRef = firestoreAdmin.collection('filters');
    const snapshot = await filtersRef.where('userId', '==', uid).get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const filters: Filter[] = [];
    snapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
      filters.push({ id: doc.id, ...doc.data() } as Filter);
    });

    res.status(200).json(filters);
  } catch (error: any) {
    console.error('Error fetching user filters:', error);
    if (error.code === 'auth/id-token-expired') {
        res.status(401).json({ error: 'Token expired' });
    } else if (error.code === 'auth/argument-error') {
        res.status(401).json({ error: 'Invalid token' });
    }
    else {
        res.status(500).json({ error: 'Internal server error' });
    }
  }
}
