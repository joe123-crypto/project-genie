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
export const auth = new Proxy({} as Auth, {
  get(_target, prop) {
    // During build/SSR, if Firebase isn't available, return undefined for property access
    // This allows the module to be imported without crashing the build
    try {
      if (typeof window === 'undefined') {
        // On server/build, return undefined to prevent build errors
        return undefined;
      }
      return (getFirebaseAuth() as any)[prop];
    } catch (error) {
      // If initialization fails (e.g., during build), return undefined
      // This allows Next.js to build without crashing
      if (typeof window === 'undefined') {
        return undefined;
      }
      throw error;
    }
  }
});

// For db, we need to return the actual Firestore instance (not a Proxy)
// because Firestore functions like collection() check for instanceof Firestore
// Since Proxies can't pass instanceof checks, we need the actual instance
// We'll use a wrapper object with a getter that returns the actual instance

let dbInstance: Firestore | null = null;

// Create a getter function that returns the actual instance
const getDbInstance = (): Firestore => {
  if (!dbInstance) {
    if (typeof window === 'undefined') {
      throw new Error('Firebase Firestore can only be used on the client side');
    }
    dbInstance = getFirestoreDb();
  }
  return dbInstance;
};

// Since collection(db, ...) requires the actual instance and Proxies don't work,
// we need to export the actual instance. However, we want lazy initialization.
// The solution: Export an object that behaves like Firestore but is actually
// the real instance when accessed. We can't use Proxy because instanceof won't work.
// So we'll export the instance directly but only initialize on client side.

// Create a wrapper that allows lazy initialization while being the actual instance
// We'll initialize it on first access, but only if we're on the client
const createDbExport = () => {
  // On client side, we can initialize eagerly since it's safe
  // On server/build, we return a dummy that will never be used
  if (typeof window !== 'undefined') {
    // Client side - initialize lazily via getter
    const dbWrapper = Object.create(null);
    Object.defineProperty(dbWrapper, '_instance', {
      get() {
        if (!dbInstance) {
          dbInstance = getFirestoreDb();
        }
        return dbInstance;
      },
      enumerable: false,
      configurable: false
    });
    // Return a Proxy that forwards to the actual instance
    // But this still won't pass instanceof...
    
    // Actually, the only way is to return the actual instance
    // Since all code using db is in 'use client' components,
    // it's safe to initialize eagerly on client side
    return getFirestoreDb();
  }
  // Server/build - return dummy (won't be used)
  return {} as Firestore;
};

export const db: Firestore = createDbExport();

export const storage = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    try {
      if (typeof window === 'undefined') {
        return undefined;
      }
      return (getFirebaseStorage() as any)[prop];
    } catch (error) {
      if (typeof window === 'undefined') {
        return undefined;
      }
      throw error;
    }
  }
});
