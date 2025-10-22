// pages/api/firebase.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Important: Vercel environment variables escape newlines. We need to replace them back.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY as environment variables in your hosting provider (e.g., Vercel, Netlify).'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
};


/* -------------------------------------------------------------------------- */
/*                                API HANDLER                                 */
/* -------------------------------------------------------------------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    initializeFirebaseAdmin();
    const db = admin.firestore();
    const { action } = req.query;

    switch (action) {
      /* ------------------------------ FILTERS ------------------------------ */
      case "getFilters": {
        const snapshot = await db.collection("filters").orderBy("createdAt", "desc").get();
        const filters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ filters });
      }
      case "getFilterById": {
        const { id } = req.query;
        if (!id || typeof id !== 'string') return res.status(400).json({ error: "Missing or invalid filter id" });

        const docRef = db.collection("filters").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Filter not found" });
        }

        const filter = { id: doc.id, ...doc.data() };
        return res.status(200).json({ filter });
      }
      case "saveFilter": {
        const { filter } = req.body;
        if (!filter) return res.status(400).json({ error: "Missing filter data" });

        const docRef = db.collection("filters").doc();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        await docRef.set({
          ...filter,
          createdAt: timestamp,
          updatedAt: timestamp,
          accessCount: 0,
        });

        const newFilter = { 
          id: docRef.id, 
          ...filter,
          // Use ISO string for the client-side object to avoid serialization issues
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
          accessCount: 0 
        };
        return res.status(200).json({ filter: newFilter });
      }
      case "updateFilter": {
        const { filterId, filterData } = req.body;
        if (!filterId || !filterData) return res.status(400).json({ error: "Missing filterId or filterData" });

        const docRef = db.collection("filters").doc(filterId);
        await docRef.update({
          ...filterData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const updatedDoc = await docRef.get();
        const updatedFilter = { id: filterId, ...updatedDoc.data() };
        return res.status(200).json({ filter: updatedFilter });
      }
      case "deleteFilter": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });
        await db.collection("filters").doc(filterId).delete();
        return res.status(200).json({ success: true });
      }
      case "incrementFilterAccessCount": {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "Missing id" });
        await db.collection("filters").doc(id).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------------ OUTFITS ------------------------------ */
      case "getOutfits": {
        const snapshot = await db.collection("outfits").orderBy("createdAt", "desc").get();
        const outfits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ outfits });
      }
      case "saveOutfit": {
        const { outfit } = req.body;
        if (!outfit) return res.status(400).json({ error: "Missing outfit data" });
        
        const docRef = db.collection("outfits").doc();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        await docRef.set({
          ...outfit,
          createdAt: timestamp,
          updatedAt: timestamp,
          accessCount: 0,
        });

        const newOutfit = { 
          id: docRef.id, 
          ...outfit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accessCount: 0
        };
        return res.status(200).json({ outfit: newOutfit });
      }
      case "incrementOutfitAccessCount": {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "Missing id" });
        await db.collection("outfits").doc(id).update({ accessCount: admin.firestore.FieldValue.increment(1) });
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
        
        const newCreation = {
          id: docRef.id,
          ...creation,
          createdAt: new Date().toISOString(),
        }
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
