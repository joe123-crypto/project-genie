import { initializeFirebaseAdmin } from "./firebaseAdmin";
import * as admin from "firebase-admin";

export function getFirestoreAdmin() {
  initializeFirebaseAdmin();
  return admin.firestore();
}
