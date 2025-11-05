
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const app = initializeFirebaseAdmin();
    const db = app.firestore();

    const sharesSnapshot = await db.collection('sharedImages').where('isPublic', '==', true).get();

    const count = sharesSnapshot.size;

    if (sharesSnapshot.empty) {
      return res.status(200).json({ 
        message: "Query executed successfully, but the 'sharedImages' collection is empty or no images are public.",
        docCount: 0,
        shares: [] 
      });
    }

    const shares = sharesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ 
      message: `Successfully fetched ${count} documents.`,
      docCount: count,
      shares: shares
    });

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in /api/shares/public:', error);
    return res.status(500).json({ 
      error: 'A critical error occurred while fetching data.', 
      details: error.message,
      stack: error.stack, // Include stack trace for debugging
    });
  }
}
