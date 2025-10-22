import * as admin from "firebase-admin";
import { Filter } from "../types";

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

export const saveFilterAdmin = async (filter: Omit<Filter, "id">): Promise<Filter> => {
    initializeFirebaseAdmin();
    const db = admin.firestore();
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
    return newFilter;
}
