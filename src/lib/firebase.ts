import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Only create config if we have env vars
function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

// Lazy initialization
let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getFirebaseConfig();
    if (!config || !config.apiKey) {
      // Return null or throw depending on strictness. 
      // For build time safety, we might want to just return null if possible, but types say FirebaseApp.
      // Let's throw if we are trying to use it and config is missing.
      throw new Error('Firebase configuration is missing. Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set.');
    }

    try {
      app = !getApps().length ? initializeApp(config) : getApp();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

function getFirestoreDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp());
  }
  return _storage;
}

// Export with getters
export const auth: Auth = getFirebaseAuth();
export const db: Firestore = getFirestoreDb();
export const storage: FirebaseStorage = getFirebaseStorage();

