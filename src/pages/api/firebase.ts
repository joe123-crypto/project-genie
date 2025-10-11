// pages/api/firebase.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

/* -------------------------------------------------------------------------- */
/*                               FIREBASE ADMIN                               */
/* -------------------------------------------------------------------------- */
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in environment variables.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

/* -------------------------------------------------------------------------- */
/*                                API HANDLER                                 */
/* -------------------------------------------------------------------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      /* ------------------------------ FILTERS ------------------------------ */
      case "getFilters": {
        const snapshot = await db.collection("filters").get();
        const filters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ filters });
      }
      case "saveFilter": {
        const { filter } = req.body;
        if (!filter) return res.status(400).json({ error: "Missing filter data" });

        const docRef = db.collection("filters").doc();
        await docRef.set({
          ...filter,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessCount: 0,
        });

        const newFilter = { id: docRef.id, ...(await docRef.get()).data() };
        return res.status(200).json({ filter: newFilter });
      }
      case "updateFilter": {
        const { filterId, filterData } = req.body;
        if (!filterId || !filterData) return res.status(400).json({ error: "Missing filterId or filterData" });

        const docRef = db.collection("filters").doc(filterId);
        await docRef.update(filterData);
        const updatedFilter = { id: filterId, ...(await docRef.get()).data() };
        return res.status(200).json({ filter: updatedFilter });
      }
      case "deleteFilter": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });
        await db.collection("filters").doc(filterId).delete();
        return res.status(200).json({ success: true });
      }
      case "incrementFilterAccessCount": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });
        await db.collection("filters").doc(filterId).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------------ OUTFITS ------------------------------ */
      case "getOutfits": {
        const snapshot = await db.collection("outfits").get();
        const outfits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ outfits });
      }
      case "saveOutfit": {
        const { outfit } = req.body;
        if (!outfit) return res.status(400).json({ error: "Missing outfit data" });

        const docRef = db.collection("outfits").doc();
        await docRef.set({
          ...outfit,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessCount: 0,
        });

        const newOutfit = { id: docRef.id, ...(await docRef.get()).data() };
        return res.status(200).json({ outfit: newOutfit });
      }
      case "incrementOutfitAccessCount": {
        const { outfitId } = req.body;
        if (!outfitId) return res.status(400).json({ error: "Missing outfitId" });
        await db.collection("outfits").doc(outfitId).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------ TRANSIENT & SAVED IMAGES ----------------------- */
      case "saveCreation": {
        const { creation } = req.body;
        if (!creation) return res.status(400).json({ error: "Missing creation data" });

        const docRef = db.collection("saved").doc();
        await docRef.set({
          ...creation,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const newCreation = { id: docRef.id, ...await (await docRef.get()).data() };
        return res.status(200).json({ creation: newCreation });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err: unknown) {
    console.error("Firebase API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
