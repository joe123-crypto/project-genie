
import type { NextApiRequest, NextApiResponse } from "next";
import { initializeFirebaseAdmin, verifyIdToken } from "../../../../lib/firebaseAdmin";
import { Share } from "../../../../types";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { postId } = req.query;
    if (typeof postId !== 'string') {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const db = initializeFirebaseAdmin().firestore();
    const postRef = db.collection("posts").doc(postId);
    const doc = await postRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Post not found" });
    }

    const post = doc.data() as Share;
    const likes = post.likes || [];
    const userHasLiked = likes.includes(userId);

    let updatedLikes;
    if (userHasLiked) {
      updatedLikes = likes.filter((uid) => uid !== userId);
    } else {
      updatedLikes = [...likes, userId];
    }

    await postRef.update({
      likes: updatedLikes,
      likeCount: updatedLikes.length,
    });

    const updatedPostData = (await postRef.get()).data();

    const updatedPost: Share = {
        id: postId,
        userId: updatedPostData?.userId,
        filterId: updatedPostData?.filterId,
        filterName: updatedPostData?.filterName || '',
        imageUrl: updatedPostData?.imageUrl,
        likes: updatedLikes,
        likeCount: updatedLikes.length,
        createdAt: updatedPostData?.createdAt.toDate().toISOString(),
    };

    res.status(200).json(updatedPost);

  } catch (error: any) {
    console.error("Error toggling like:", error);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: "Token expired, please re-authenticate." });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
}
