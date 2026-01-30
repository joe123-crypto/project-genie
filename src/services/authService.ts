import { User } from '../types';
import { auth } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    updateProfile,
    signOut as firebaseSignOut, // Renamed to avoid conflict
    getIdToken
} from 'firebase/auth';



const USER_SESSION_KEY = "genieUser";

/**
 * Signs up a new user
 */
export const signUp = async (email: string, password: string, username: string): Promise<User> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });

        const user = await mapFirebaseUserToAppUser(userCredential.user);
        saveUserSession(user);
        return user;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};

/**
 * Signs in an existing user
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const appUser = await mapFirebaseUserToAppUser(userCredential.user);

        await fetch('/api/auth/session', {
            method: "POST",
            body: JSON.stringify({
                token: appUser.idToken,
                username: appUser.username || appUser.email.split('@')[0]
            }),
        });

        saveUserSession(appUser);
        return appUser;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};

/**
 * Signs in with Google
 */
export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = await mapFirebaseUserToAppUser(result.user);
        saveUserSession(user);
        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

/**
 * Gets the currently authenticated user.
 */
export const getAuthUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                const appUser = await mapFirebaseUserToAppUser(user);
                saveUserSession(appUser);
                resolve(appUser);
            } else {
                localStorage.removeItem(USER_SESSION_KEY);
                resolve(null);
            }
        });
    });
};

/**
 * Gets a valid ID token, refreshing if necessary.
 */
export const getValidIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }
    // The true flag forces a refresh if the token is expired.
    return await getIdToken(user, true);
};

/**
 * Signs out the current user
 */
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    localStorage.removeItem(USER_SESSION_KEY);
    await fetch('/api/auth/session', {
        method: "DELETE",
    });

};

const mapFirebaseUserToAppUser = async (firebaseUser: any): Promise<User> => {
    const idToken = await getIdToken(firebaseUser);
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName,
        idToken: idToken,
        refreshToken: firebaseUser.refreshToken || '', // Note: refreshToken is not always available client-side
        expiresAt: Date.now() + 3600 * 1000 // Firebase tokens expire in 1 hour
    };
};

const saveUserSession = (user: User) => {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
};
