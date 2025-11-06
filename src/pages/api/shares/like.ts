
import { NextApiRequest, NextApiResponse } from 'next';
import { initializeFirebaseAdmin } from '../../../lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { postId } = req.body;
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    const app = initializeFirebaseAdmin();
    const auth = app.auth();
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const db = app.firestore();
    const postRef = db.collection('shares').doc(postId);

    const { share, liked } = await db.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      const likes: string[] = postData?.likes || [];
      let newLikes: string[];
      let isLiked = false;

      if (likes.includes(userId)) {
        // User is unliking the post
        newLikes = likes.filter(uid => uid !== userId);
      } else {
        // User is liking the post
        newLikes = [...likes, userId];
        isLiked = true;
      }

      transaction.update(postRef, { 
        likes: newLikes,
        likeCount: newLikes.length,
      });

      const share = {
        ...postData,
        id: postDoc.id,
        likes: newLikes,
        likeCount: newLikes.length,
        createdAt: postData?.createdAt.toDate().toISOString(),
      };
      return { share, liked: isLiked };
    });

    return res.status(200).json({ message: `Post ${liked ? 'liked' : 'unliked'} successfully`, share });

  } catch (error: any) {
    console.error(`Error toggling like for post ${postId}:`, error);
    if (error.message === 'Post not found') {
      return res.status(444).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to toggle like', details: error.message });
  }
}
