
import admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (app) return app;

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Add detailed checks for each environment variable
    if (!projectId) {
      const errorMessage = 'Firebase Admin initialization failed: Missing environment variable FIREBASE_PROJECT_ID.';
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    if (!clientEmail) {
      const errorMessage = 'Firebase Admin initialization failed: Missing environment variable FIREBASE_CLIENT_EMAIL.';
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    if (!privateKey) {
      const errorMessage = 'Firebase Admin initialization failed: Missing environment variable FIREBASE_PRIVATE_KEY.';
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }

    try {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error: any) {
      console.error('🔥 Firebase Admin initialization error:', error.message);
      throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    }

  } else {
    app = admin.app();
  }

  return app;
}

export function verifyIdToken(idToken: string) {
    initializeFirebaseAdmin();
    return admin.auth().verifyIdToken(idToken);
}
