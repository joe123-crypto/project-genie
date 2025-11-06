import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin, verifyIdToken } from '../../../lib/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Configure R2 client
const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const firestoreAdmin = getFirestore(initializeFirebaseAdmin());

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await verifyIdToken(idToken);
    const uid = decodedToken.uid;

    if (req.method === 'GET') {
      const savedImagesSnapshot = await firestoreAdmin
        .collection('savedImages')
        .where('userId', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const images = savedImagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(images);

    } else if (req.method === 'DELETE') {
        const { imageId } = req.query;
  
        if (typeof imageId !== 'string' || !imageId) {
          return res.status(400).json({ error: 'imageId must be a string' });
        }
  
        const imageRef = firestoreAdmin.collection('savedImages').doc(imageId);
        const imageDoc = await imageRef.get();
  
        if (!imageDoc.exists) {
          return res.status(404).json({ error: 'Image not found' });
        }
  
        const imageData = imageDoc.data();

        if (imageData?.userId !== uid) {
            return res.status(403).json({ error: 'User not authorized to delete this image' });
        }
        
        if (!imageData || !imageData.imageUrl) {
          // If there's no image URL, we can only delete the Firestore record.
          await imageRef.delete();
          return res.status(200).json({ message: 'Image record deleted. No image URL found to delete from storage.' });
        }
  
        // --- Delete from R2 ---
        // Extract the object key from the full image URL
        const imageKey = new URL(imageData.imageUrl).pathname.substring(1);
  
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: imageKey,
        });
  
        // Delete from R2 and Firestore concurrently
        await Promise.all([
          r2.send(deleteCommand).catch(err => console.error(`Error deleting image from R2: ${err}`)),
          imageRef.delete()
        ]);
  
        res.status(200).json({ message: 'Image deleted successfully' });
  
      } else {
        res.setHeader('Allow', ['GET', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    } catch (error: any) {
      console.error('Error in /api/user/saved-images:', error);
      if (error.code === 'auth/id-token-expired') {
        res.status(401).json({ error: 'Token expired' });
      } else if (error.code === 'auth/argument-error') {
        res.status(401).json({ error: 'Invalid token' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  }
