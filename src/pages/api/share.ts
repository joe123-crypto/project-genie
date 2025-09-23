import type { NextApiRequest, NextApiResponse } from "next";
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in environment variables.');
  }
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}
const db = admin.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Save a shared image
    const { imageUrl, filterName, username } = req.body;
    if (!imageUrl || !filterName) {
      return res.status(400).json({ error: 'Missing imageUrl or filterName' });
    }
    const docRef = await db.collection('sharedImages').add({
      imageUrl,
      filterName,
      username: username || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(200).json({ shareId: docRef.id });
  }
  if (req.method === 'GET') {
    // Retrieve a shared image by ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid id' });
    }
    const doc = await db.collection('sharedImages').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({ ...doc.data(), id: doc.id });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
