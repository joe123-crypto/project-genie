
import admin from 'firebase-admin';

// This function ensures that Firebase Admin is initialized only once.
export function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Important: Replace escaped newlines for the private key from environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      // This will cause data fetching to fail, but the build will pass.
      console.error("Firebase Admin credentials are not set in environment variables.");
    }
  }
  return admin;
}
