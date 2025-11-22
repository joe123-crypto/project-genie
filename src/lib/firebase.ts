import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Only create config if we're on client side and have env vars
function getFirebaseConfig() {
  // During build, env vars might not be available - that's OK
  if (typeof window === 'undefined') {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    // During build or if env vars aren't set, return null
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

// Lazy initialization - only on client side
let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getFirebaseApp(): FirebaseApp {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side');
  }

  if (!app) {
    const config = getFirebaseConfig();
    if (!config || !config.apiKey) {
      throw new Error('Firebase configuration is missing. Make sure NEXT_PUBLIC_FIREBASE_API_KEY is set.');
    }

    try {
      app = !getApps().length ? initializeApp(config) : getApp();
    } catch (error) {
      // If initialization fails, log but don't crash during build
      console.error('Firebase initialization failed:', error);
      throw error;
    }
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!_auth) {
    try {
      _auth = getAuth(getFirebaseApp());
    } catch (error) {
      // If we're on server/build, this will throw - let it throw so imports fail gracefully
      throw error;
    }
  }
  return _auth;
}

function getFirestoreDb(): Firestore {
  if (!_db) {
    try {
      _db = getFirestore(getFirebaseApp());
    } catch (error) {
      throw error;
    }
  }
  return _db;
}

function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    try {
      _storage = getStorage(getFirebaseApp());
    } catch (error) {
      throw error;
    }
  }
  return _storage;
}

// Export with getters - only initialize when accessed on client side
// Use Proxy to defer initialization until first property access
// During build, if accessed, it will throw, but the Proxy prevents module-level initialization
// Export actual instances on client side to avoid Proxy issues with Firebase SDK
// Export actual instances on client side to avoid Proxy issues with Firebase SDK
const createAuthExport = (): Auth => {
  if (typeof window !== 'undefined') {
    return getFirebaseAuth();
  }
  return {} as Auth;
};

export const auth: Auth = createAuthExport();

const createDbExport = (): Firestore => {
  if (typeof window !== 'undefined') {
    return getFirestoreDb();
  }
  return {} as Firestore;
};

export const db: Firestore = createDbExport();

const createStorageExport = (): FirebaseStorage => {
  if (typeof window !== 'undefined') {
    return getFirebaseStorage();
  }
  return {} as FirebaseStorage;
};

export const storage: FirebaseStorage = createStorageExport();
