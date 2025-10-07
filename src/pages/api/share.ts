import type { NextApiRequest, NextApiResponse } from "next";
import admin from 'firebase-admin';

// Initialize Firebase Admin
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
    try {
      // in your POST handler
      const { imageUrl, filterName, username, filterId } = req.body; // <-- include filterId

      if (!imageUrl || !filterName) {
        console.warn("Missing fields: ", { imageUrl, filterName, username, filterId });
        return res.status(400).json({ error: 'Missing imageUrl or filterName' });
      }

      const docRef = await db.collection('sharedImages').add({
        imageUrl,
        filterName,
        filterId: filterId || null,   // ✅ store filterId
        username: username || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const appUrl = process.env.APP_URL || (req.headers.origin ?? 'http://localhost:3000');
      const shareUrl = `${appUrl}/shared/${docRef.id}`;

      console.log("Created share doc: ", { shareId: docRef.id, shareUrl });

      return res.status(200).json({ shareId: docRef.id, shareUrl, filterId }); // ✅ return it too
      
    } catch (err: any) {
      console.error("Error creating share:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid id' });
      }

      const doc = await db.collection('sharedImages').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (err: any) {
      console.error("Error fetching share:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
