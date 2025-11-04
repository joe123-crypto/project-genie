// pages/api/firebase.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY as environment variables.'
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
    const { action, id } = req.query;
    const { filter, filterId, filterData, outfit, creation, postId, userId } = req.body;

    // The token verification logic has been removed as per your request.

    switch (action) {
      /* ------------------------------ FILTERS ------------------------------ */
      case "getFilters": {
        const snapshot = await db.collection("filters").orderBy("createdAt", "desc").get();
        const filters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ filters });
      }
      case "getFilterById": {
        if (!id || typeof id !== 'string') return res.status(400).json({ error: "Missing or invalid filter id" });

        const docRef = db.collection("filters").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "Filter not found" });
        }

        const result = { id: doc.id, ...doc.data() };
        return res.status(200).json({ filter: result });
      }
      case "saveFilter": {
        if (!filter) return res.status(400).json({ error: "Missing filter data" });

        const docRef = db.collection("filters").doc();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        const newFilterData = {
          ...filter,
          creatorId: '', // creatorId is not set as authorization is removed
          createdAt: timestamp,
          updatedAt: timestamp,
          accessCount: 0,
        };

        await docRef.set(newFilterData);

        const newFilter = { 
          id: docRef.id, 
          ...filter,
          creatorId: '',
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
          accessCount: 0 
        };
        return res.status(200).json({ filter: newFilter });
      }
      case "updateFilter": {
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
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });

        await db.collection("filters").doc(filterId).delete();
        return res.status(200).json({ success: true });
      }
      case "incrementFilterAccessCount": {
        const { id: filterIdFromBody } = req.body;
        if (!filterIdFromBody) return res.status(400).json({ error: "Missing id" });
        await db.collection("filters").doc(filterIdFromBody).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------------ OUTFITS ------------------------------ */
      case "getOutfits": {
        const snapshot = await db.collection("outfits").orderBy("createdAt", "desc").get();
        const outfits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ outfits });
      }
      case "saveOutfit": {
        if (!outfit) return res.status(400).json({ error: "Missing outfit data" });
        
        const docRef = db.collection("outfits").doc();
        const timestamp = admin.firestore.FieldValue.serverTimestamp();

        await docRef.set({
          ...outfit,
          creatorId: '', // creatorId is not set as authorization is removed
          createdAt: timestamp,
          updatedAt: timestamp,
          accessCount: 0,
        });

        const newOutfit = { 
          id: docRef.id, 
          ...outfit,
          creatorId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          accessCount: 0
        };
        return res.status(200).json({ outfit: newOutfit });
      }
      case "incrementOutfitAccessCount": {
        const { id: outfitIdFromBody } = req.body;
        if (!outfitIdFromBody) return res.status(400).json({ error: "Missing id" });
        await db.collection("outfits").doc(outfitIdFromBody).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------------ POSTS ------------------------------ */
      case "getPosts": {
        const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
        const postsWithAuthors = await Promise.all(snapshot.docs.map(async (doc) => {
            const postData = doc.data();
            let author = null;
            if (postData.userId) {
                try {
                    const userRecord = await admin.auth().getUser(postData.userId);
                    author = {
                        uid: userRecord.uid,
                        displayName: userRecord.displayName || 'Anonymous',
                        photoURL: userRecord.photoURL,
                    };
                } catch (e) {
                    console.error("Error fetching user data:", e);
                    author = {
                        uid: postData.userId,
                        displayName: 'Anonymous',
                        photoURL: undefined
                    }
                }
            }
            return { id: doc.id, ...postData, author };
        }));
        return res.status(200).json({ posts: postsWithAuthors });
    }
      case "likePost": {
        if (!postId || !userId) return res.status(400).json({ error: "Missing postId or userId" });
        const postRef = db.collection("posts").doc(postId);
        const likeRef = db.collection("likes").doc(`${postId}_${userId}`);

        await db.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            if (likeDoc.exists) return; // User already liked the post

            transaction.set(likeRef, { postId, userId });
            transaction.update(postRef, { likeCount: admin.firestore.FieldValue.increment(1) });
        });

        return res.status(200).json({ success: true });
      }

      case "unlikePost": {
        if (!postId || !userId) return res.status(400).json({ error: "Missing postId or userId" });
        const postRef = db.collection("posts").doc(postId);
        const likeRef = db.collection("likes").doc(`${postId}_${userId}`);

        await db.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            if (!likeDoc.exists) return; // User hasn't liked the post

            transaction.delete(likeRef);
            transaction.update(postRef, { likeCount: admin.firestore.FieldValue.increment(-1) });
        });

        return res.status(200).json({ success: true });
      }

      /* ------------------------ TRANSIENT & SAVED IMAGES ----------------------- */
      case "saveCreation": {
        if (!creation) return res.status(400).json({ error: "Missing creation data" });

        const docRef = db.collection("saved").doc();
        await docRef.set({
          ...creation,
          userId: '', // userId is not set as authorization is removed
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        const newCreation = {
          id: docRef.id,
          ...creation,
          userId: '',
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
