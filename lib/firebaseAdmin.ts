import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let db: admin.firestore.Firestore;

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error: any) {
      console.error("Firebase admin initialization error", error);
      // Propagate the error to avoid silent failures
      throw new Error(`Firebase admin initialization failed: ${error.message}`);
    }
  }
  db = getFirestore();
}

// Export the initializer and a getter for the db instance
export { initializeFirebaseAdmin };

// Export a getter for db to ensure it's accessed after initialization
export const getDb = () => {
  if (!db) {
    initializeFirebaseAdmin();
  }
  return db;
};
