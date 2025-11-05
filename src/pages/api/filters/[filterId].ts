
import type { NextApiRequest, NextApiResponse } from "next";
import { initializeFirebaseAdmin, verifyIdToken } from "../../../lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await verifyIdToken(token);

    const { filterId } = req.query;

    if (typeof filterId !== 'string') {
        return res.status(400).json({ error: "Invalid filter ID." });
    }

    initializeFirebaseAdmin();
    const db = getFirestore();
    const filterRef = db.collection('filters').doc(filterId);
    const filterDoc = await filterRef.get();

    if (!filterDoc.exists) {
      return res.status(404).json({ error: "Filter not found" });
    }

    const filterData = filterDoc.data();
    const filter = { id: filterDoc.id, ...filterData };

    res.status(200).json({ filter });

  } catch (err: any) {
    console.error("Error fetching filter:", err);
    if (err.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: "Unauthorized" });
    }
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
