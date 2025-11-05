
import type { NextApiRequest, NextApiResponse } from "next";
import { initializeFirebaseAdmin } from "../../lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageUrl, filterId, userId } = req.body;

  if (!imageUrl || !filterId || !userId) {
    const missing = [];
    if (!imageUrl) missing.push('imageUrl');
    if (!filterId) missing.push('filterId');
    if (!userId) missing.push('userId');
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    const app = initializeFirebaseAdmin();
    const firestore = app.firestore();

    // Fetch the filter name from the 'filters' collection
    const filterDoc = await firestore.collection('filters').doc(filterId).get();
    if (!filterDoc.exists) {
        return res.status(404).json({ error: "Filter not found" });
    }
    const filterName = filterDoc.data()?.name || '';

    const post = {
      imageUrl,
      filterId,
      userId,
      filterName, // Add filterName to the post object
      createdAt: new Date(),
      likes: [],
      likeCount: 0
    };

    const docRef = await firestore.collection("posts").add(post);
    res.status(200).json({ id: docRef.id, ...post });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
