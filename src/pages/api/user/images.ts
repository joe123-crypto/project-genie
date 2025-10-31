import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin, verifyIdToken } from '../../../lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const firestoreAdmin = getFirestore(initializeFirebaseAdmin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await verifyIdToken(idToken);
    const email = decodedToken.email; // Use UID instead of email

    if (req.method === 'GET') {
      // The uid from query is removed, we use the authenticated user's uid
      const sharesSnapshot = await firestoreAdmin
        .collection('sharedImages')
        .where('username', '==', email) // Query by creatorUid
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const images = sharesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(images);

    } else if (req.method === 'DELETE') {
      const { imageId } = req.query;

      if (typeof imageId !== 'string' || !imageId) {
        return res.status(400).json({ error: 'imageId must be a string' });
      }

      const imageRef = firestoreAdmin.collection('sharedImages').doc(imageId);
      const imageDoc = await imageRef.get();

      if (!imageDoc.exists) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const imageData = imageDoc.data();
      
      // Add a check for imageData
      if (!imageData) {
        return res.status(404).json({ error: 'Image data not found' });
      }

      // Delete the image from Cloud Storage
      const bucket = getStorage(initializeFirebaseAdmin()).bucket();
      //const originalImageFile = bucket.file(`shared/${imageData.creatorUid}/${imageId}_original.png`);
      const filteredImageFile = bucket.file(imageData.imageUrl);

      await Promise.all([
        //originalImageFile.delete().catch(err => console.error("Error deleting original image:", err)),
        filteredImageFile.delete().catch(err => console.error("Error deleting image:", err)),
        imageRef.delete()
      ]);

      res.status(200).json({ message: 'Image deleted successfully' });

    } else {
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    console.error('Error in /api/user/images:', error);
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expired' });
    } else if (error.code === 'auth/argument-error') {
      res.status(401).json({ error: 'Invalid token' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
