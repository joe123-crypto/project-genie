import { Share, Outfit, Filter } from '../types';
import { auth, db } from '../lib/firebase';
import { deleteUser as firebaseDeleteUser } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Deletes the currently authenticated user's account from Firebase Authentication.
 * The associated user data in Firestore should be cleaned up via backend triggers or manually.
 */
export const deleteUser = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error("No user is currently signed in.");
    }

    try {
        await firebaseDeleteUser(user);
    } catch (error) {
        console.error("Error deleting user:", error);
        // You might want to re-authenticate the user here if the token is expired
        throw error;
    }
};

/**
 * Fetches a user's created filters.
 * @param uid The user's ID.
 * @returns A promise that resolves to an array of Filter objects.
 */
export const fetchUserFilters = async (uid: string): Promise<Filter[]> => {
    try {
        const q = query(collection(db, "filters"), where("authorId", "==", uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Filter));
    } catch (error) {
        console.error('Error fetching user filters:', error);
        throw error;
    }
};

/**
 * Fetches a user's created outfits.
 * @param uid The user's ID.
 * @returns A promise that resolves to an array of Outfit objects.
 */
export const fetchUserOutfits = async (uid: string): Promise<Outfit[]> => {
    try {
        const q = query(collection(db, "outfits"), where("authorId", "==", uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit));
    } catch (error) {
        console.error('Error fetching user outfits:', error);
        throw error;
    }
};

/**
 * Fetches a user's shared images (posts).
 * @param uid The user's ID.
 * @returns A promise that resolves to an array of Share objects.
 */
export const fetchUserImages = async (uid: string): Promise<Share[]> => {
    try {
        const q = query(collection(db, "posts"), where("author.uid", "==", uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Share));
    } catch (error) {
        console.error('Error fetching user images:', error);
        throw error;
    }
};
