
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('Starting API request to fetch all posts for debugging...');

  try {
    const app = initializeFirebaseAdmin();
    const db = app.firestore();

    // 🚨 RADICAL DEBUGGING STEP: Fetch all documents from 'posts' with no constraints.
    const postsSnapshot = await db.collection('posts').get();

    const count = postsSnapshot.size;
    console.log(`Query completed. Found ${count} document(s) in 'posts' collection.`);

    if (postsSnapshot.empty) {
      return res.status(200).json({ 
        message: "Query executed successfully, but the 'posts' collection is empty or rules are preventing access.",
        docCount: 0,
        shares: [] 
      });
    }

    // Return the raw, unprocessed data for debugging.
    const rawData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Returning raw data:', JSON.stringify(rawData, null, 2));

    // The frontend expects a 'shares' property.
    return res.status(200).json({ 
      message: `Successfully fetched ${count} documents.`,
      docCount: count,
      shares: rawData // Sending raw data for the frontend to display.
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
