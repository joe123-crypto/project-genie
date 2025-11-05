
import type { NextApiRequest, NextApiResponse } from "next";
import { initializeFirebaseAdmin } from "../../lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageUrl, prompt, userId } = req.body;

  if (!imageUrl || !prompt || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const app = initializeFirebaseAdmin();
    const firestore = app.firestore();

    const post = {
      imageUrl,
      prompt,
      userId,
      createdAt: new Date(),
    };

    const docRef = await firestore.collection("posts").add(post);
    res.status(200).json({ id: docRef.id, ...post });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
