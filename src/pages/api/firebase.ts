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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'getFilters': {
        const snapshot = await db.collection('filters').orderBy('createdAt', 'desc').get();
        const filters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ filters });
        break;
      }

      case 'saveFilter': {
        const { filter } = req.body;
        if (!filter) return res.status(400).json({ error: 'Missing filter data' });

        const docRef = await db.collection('filters').add({
          ...filter,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessCount: 0,
        });

        const newFilter = (await docRef.get()).data();
        res.status(200).json({ filter: { id: docRef.id, ...newFilter } });
        break;
      }

      case 'updateFilter': {
        const { filterId, filterData } = req.body;
        if (!filterId || !filterData) return res.status(400).json({ error: 'Missing filterId or filterData' });

        const docRef = db.collection('filters').doc(filterId);
        await docRef.update(filterData);

        const updatedFilter = (await docRef.get()).data();
        res.status(200).json({ filter: { id: docRef.id, ...updatedFilter } });
        break;
      }

      case 'deleteFilter': {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: 'Missing filterId' });

        await db.collection('filters').doc(filterId).delete();
        res.status(200).json({ message: 'Filter deleted' });
        break;
      }

      case 'incrementAccessCount': {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: 'Missing filterId' });

        const docRef = db.collection('filters').doc(filterId);
        await docRef.update({
          accessCount: admin.firestore.FieldValue.increment(1),
        });
        res.status(200).json({ message: 'Access count incremented' });
        break;
      }

      default:
        res.status(400).json({ error: 'Unknown action' });
        break;
    }
  } catch (err: any) {
    console.error('Firebase API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
