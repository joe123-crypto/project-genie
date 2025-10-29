
import { initializeFirebaseAdmin } from "./firebaseAdmin";
import * as admin from "firebase-admin";

initializeFirebaseAdmin();

export const firestoreAdmin = admin.firestore();
