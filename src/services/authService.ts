// Updated authService.ts to only call our API routes
import { User } from '../types';

const USER_SESSION_KEY = "genieUser";

/**
 * Signs up a new user
 * @param email - User's email
 * @param password - User's password
 * @returns A promise that resolves to the User object
 */
export const signUp = async (email: string, password: string): Promise<User> => {
    try {
        const response = await fetch('/api/auth?action=signUp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
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
 * Signs out the current user
 */
export const signOut = (): void => {
    localStorage.removeItem(USER_SESSION_KEY);
};

/**
 * Loads the user session from localStorage
 * @returns The User object if found, null otherwise
 */
export const loadUserSession = (): User | null => {
    try {
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
