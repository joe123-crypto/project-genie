// pages/api/firebase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in environment variables.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

interface Filter {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: any; // extend with other filter fields
}

interface FirebaseResponse {
  filters?: Filter[];
  filter?: Filter;
  message?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FirebaseResponse>
) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'getFilters': {
        const snapshot = await db.collection('filters').orderBy('createdAt', 'desc').get();
        const filters: Filter[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ filters });
      }

      case 'saveFilter': {
        const { filter } = req.body as { filter?: Filter };
        if (!filter) return res.status(400).json({ error: 'Missing filter data' });

        const docRef = await db.collection('filters').add({
          ...filter,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessCount: 0,
        });

        const newFilter = (await docRef.get()).data() as Filter;
        return res.status(200).json({ filter: { id: docRef.id, ...newFilter } });
      }

      case 'updateFilter': {
        const { filterId, filterData } = req.body as { filterId?: string; filterData?: Partial<Filter> };
        if (!filterId || !filterData) return res.status(400).json({ error: 'Missing filterId or filterData' });

        const docRef = db.collection('filters').doc(filterId);
        await docRef.update(filterData);

        const updatedFilter = (await docRef.get()).data() as Filter;
        return res.status(200).json({ filter: { id: docRef.id, ...updatedFilter } });
      }

      case 'deleteFilter': {
        const { filterId } = req.body as { filterId?: string };
        if (!filterId) return res.status(400).json({ error: 'Missing filterId' });

        await db.collection('filters').doc(filterId).delete();
        return res.status(200).json({ message: 'Filter deleted' });
      }

      case 'incrementAccessCount': {
        const { filterId } = req.body as { filterId?: string };
        if (!filterId) return res.status(400).json({ error: 'Missing filterId' });

        const docRef = db.collection('filters').doc(filterId);
        await docRef.update({
          accessCount: admin.firestore.FieldValue.increment(1),
        });
        return res.status(200).json({ message: 'Access count incremented' });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err: unknown) {
    console.error('Firebase API error:', err);
    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
