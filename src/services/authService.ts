// Updated authService.ts to only call our API routes
import { User } from '../types';

const USER_SESSION_KEY = "genieUser";

/**
 * Signs up a new user
 * @param email - User's email
 * @param password - User's password
 * @param username - User's username
 * @returns A promise that resolves to the User object
 */
export const signUp = async (email: string, password: string, username: string): Promise<User> => {
    try {
        const response = await fetch('/api/auth?action=signUp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, username }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to sign up');
        }

        const data = await response.json();
        const user = data.user;
        
        // Save user session to localStorage
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};

/**
 * Signs in an existing user
 * @param email - User's email
 * @param password - User's password
 * @returns A promise that resolves to the User object
 */
export const signIn = async (email: string, password: string): Promise<User> => {
    try {
        const response = await fetch('/api/auth?action=signIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to sign in');
        }

        const data = await response.json();
        const user = data.user;
        
        // Save user session to localStorage
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        
        return user;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};

/**
 * Signs in with Google
 * @returns A promise that resolves to the User object
 */
export const signInWithGoogle = async (): Promise<User | null> => {
    try {
        // Redirect to Google's authentication URL
        // The backend /api/auth will handle the redirect to Google and then back to our app
        window.location.href = '/api/auth?action=googleSignIn';

        // Note: This function will not directly return a user as it initiates a redirect.
        // The user will be handled by the redirect back to the app with session info.
        return new Promise<User | null>(() => {}); // Never resolve this promise as we are redirecting

    } catch (error) {
        console.error('Error initiating Google sign-in:', error);
        throw error;
    }
};

/**
 * Gets the currently authenticated user from local storage.
 * @returns The User object if authenticated, null otherwise.
 */
export const getAuthUser = (): User | null => {
    return loadUserSession();
};

/**
 * Signs out the current user
 */
export const signOut = (): void => {
    localStorage.removeItem(USER_SESSION_KEY);
};

/**
 * Loads the user session from localStorage or URL parameters (after Google redirect)
 * @returns The User object if found, null otherwise
 */
export const loadUserSession = (): User | null => {
    try {
        // First, check for user data in URL parameters (from Google OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const idToken = urlParams.get('idToken');
        const refreshToken = urlParams.get('refreshToken');
        const uid = urlParams.get('uid');
        const email = urlParams.get('email');
        const expiresAt = urlParams.get('expiresAt');
        const username = urlParams.get('username');

        if (idToken && refreshToken && uid && email && expiresAt) {
            const user: User = {
                idToken,
                refreshToken,
                uid,
                email,
                expiresAt: parseInt(expiresAt),
                username: username || undefined
            };

            // Save to localStorage
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));

            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            return user;
        }

        // If not in URL, check localStorage
        const userData = localStorage.getItem(USER_SESSION_KEY);
        if (!userData) return null;
        
        const user = JSON.parse(userData);
        
        // Check if token is expired
        if (user.expiresAt && Date.now() > user.expiresAt) {
            localStorage.removeItem(USER_SESSION_KEY);
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error loading user session:', error);
        localStorage.removeItem(USER_SESSION_KEY);
        return null;
    }
};


/**
 * Updates the user session in localStorage
 * @param updatedFields - The fields to update in the user session
 * @returns The updated User object
 */
export const updateUserSession = (updatedFields: Partial<User>): User | null => {
    const user = loadUserSession();
    if (!user) return null;

    const newUser = { ...user, ...updatedFields };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));
    return newUser;
};

/**
 * Refreshes the user's ID token
 * @param user - The current user object
 * @returns A promise that resolves to the updated User object
 */
export const refreshIdToken = async (user: User): Promise<User> => {
    try {
        const response = await fetch('/api/auth?action=refreshToken', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: user.refreshToken }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to refresh token');
        }

        const data = await response.json();
        const refreshedUser = data.user;
        
        // Update user session in localStorage
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(refreshedUser));
        
        return refreshedUser;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

/**
 * Gets a valid ID token, refreshing if necessary
 * @returns A promise that resolves to a valid ID token
 */
export const getValidIdToken = async (): Promise<string | null> => {
    const user = loadUserSession();
    if (!user) return null;
    
    // Check if token is expired or will expire soon (within 5 minutes)
    if (user.expiresAt && Date.now() > (user.expiresAt - 5 * 60 * 1000)) {
        try {
            const refreshedUser = await refreshIdToken(user);
            return refreshedUser.idToken;
        } catch (error) {
            console.error('Error refreshing token:', error);
            signOut();
            return null;
        }
    }
    
    return user.idToken;
};
