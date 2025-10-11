import admin from "firebase-admin";

let app: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (app) return app;

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // 🔥 Replace literal "\n" sequences with real line breaks
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      console.error("❌ Missing Firebase Admin environment variables.");
      throw new Error("Firebase Admin credentials are incomplete");
    }

    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    app = admin.app();
  }

  return app;
}
