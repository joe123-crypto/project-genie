import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../types';

const API_KEY = process.env.FIREBASE_API_KEY;
const AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1/accounts";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// Ensure this matches the "Authorized redirect URIs" in your Google Cloud Console
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth?action=googleCallback';

const handleAuthResponse = async (response: Response): Promise<User> => {
    const responseText = await response.text();
    let data;
    try {
        data = JSON.parse(responseText);
    } catch {
        console.error("Failed to parse auth response as JSON:", responseText);
        throw new Error("Received an invalid response from authentication server.");
    }

    if (!response.ok) {
        const errorMessage = data.error?.message || 'An unknown authentication error occurred.';
        switch (errorMessage) {
            case 'EMAIL_EXISTS':
                throw new Error('This email is already in use. Please sign in or use a different email.');
            case 'INVALID_LOGIN_CREDENTIALS':
                throw new Error('Invalid email or password. Please check your credentials and try again.');
            case 'WEAK_PASSWORD : Password should be at least 6 characters long':
                throw new Error('Your password must be at least 6 characters long.');
            default:
                throw new Error(errorMessage);
        }
    }

    const user: User = {
        uid: data.localId,
        email: data.email,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (parseInt(data.expiresIn) * 1000),
        username: data.displayName
    };

    return user;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, body } = req;
    const { action, code } = req.query; // Added 'code' for Google callback

    if (!API_KEY) {
        return res.status(500).json({ error: 'Firebase API key is not configured.' });
    }

    if (method === 'GET' && action === 'googleSignIn') {
        if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
            return res.status(500).json({ error: 'Google OAuth environment variables are not configured.' });
        }
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${GOOGLE_REDIRECT_URI}` +
            `&response_type=code` +
            `&scope=email profile openid` +
            `&access_type=offline`;
        return res.redirect(googleAuthUrl);
    }

    if (method === 'GET' && action === 'googleCallback') {
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Authorization code not found.' });
        }
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
            return res.status(500).json({ error: 'Google OAuth environment variables are not configured.' });
        }

        try {
            // Exchange authorization code for tokens
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: GOOGLE_REDIRECT_URI,
                    grant_type: 'authorization_code',
                }).toString(),
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
            }

            const { id_token, access_token, refresh_token, expires_in } = await tokenResponse.json();

            // Use the ID token to sign in to Firebase
            const firebaseSignInResponse = await fetch(`${AUTH_BASE_URL}:signInWithIdp?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postBody: `id_token=${id_token}&providerId=google.com`,
                    requestUri: GOOGLE_REDIRECT_URI,
                    returnIdpCredential: true,
                    returnSecureToken: true
                })
            });

            const firebaseUser = await handleAuthResponse(firebaseSignInResponse);

            // Redirect back to the main application with user session info (e.g., in a cookie or query params)
            // For simplicity, we'll redirect to the homepage. In a real app, you might set cookies here.
            const redirectUrl = `/?idToken=${firebaseUser.idToken}&refreshToken=${firebaseUser.refreshToken}&uid=${firebaseUser.uid}&email=${firebaseUser.email}&expiresAt=${firebaseUser.expiresAt}`;
            // You might also want to include displayName and photoURL if available from Google.
            return res.redirect(redirectUrl);

        } catch (error) {
            console.error('Google OAuth callback error:', error);
            return res.status(500).json({ 
                error: error instanceof Error ? error.message : 'Google sign-in failed' 
            });
        }
    }

    // Existing POST requests handling
    if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        switch (action) {
            case 'signUp':
                const { email: signUpEmail, password: signUpPassword, username: signUpUsername } = body;
                if (!signUpEmail || !signUpPassword || !signUpUsername) {
                    return res.status(400).json({ error: 'Email, password, and username are required' });
                }

                const signUpResponse = await fetch(`${AUTH_BASE_URL}:signUp?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: signUpEmail,
                        password: signUpPassword,
                        displayName: signUpUsername,
                        returnSecureToken: true
                    })
                });

                const signUpUser = await handleAuthResponse(signUpResponse);
                res.status(200).json({ user: signUpUser });
                break;

            case 'signIn':
                const { email: signInEmail, password: signInPassword } = body;
                if (!signInEmail || !signInPassword) {
                    return res.status(400).json({ error: 'Email and password are required' });
                }

                const signInResponse = await fetch(`${AUTH_BASE_URL}:signInWithPassword?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: signInEmail,
                        password: signInPassword,
                        returnSecureToken: true
                    })
                });

                const signInUser = await handleAuthResponse(signInResponse);
                res.status(200).json({ user: signInUser });
                break;

            case 'refreshToken':
                const { refreshToken } = body;
                if (!refreshToken) {
                    return res.status(400).json({ error: 'Refresh token is required' });
                }

                const refreshResponse = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken
                    })
                });
                
                const responseText = await refreshResponse.text();
                let refreshData;

                try {
                    refreshData = JSON.parse(responseText);
                } catch {
                    console.error("Failed to parse refresh token response as JSON:", responseText);
                    return res.status(500).json({ error: "Received an invalid response from authentication server when refreshing token." });
                }

                if (!refreshResponse.ok) {
                    const errorMessage = refreshData.error?.message || 'Failed to refresh token';
                    return res.status(401).json({ error: errorMessage });
                }

                const refreshedUser: User = {
                    uid: refreshData.user_id,
                    email: refreshData.email || '', // Email might not be in refresh response
                    idToken: refreshData.id_token, // Corrected from access_token
                    refreshToken: refreshData.refresh_token,
                    expiresAt: Date.now() + (parseInt(refreshData.expires_in) * 1000)
                };

                res.status(200).json({ user: refreshedUser });
                break;

            case 'validateToken':
                const { idToken } = body;
                if (!idToken) {
                    return res.status(400).json({ error: 'ID token is required' });
                }

                const validateResponse = await fetch(`${AUTH_BASE_URL}:lookup?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken })
                });

                if (!validateResponse.ok) {
                    return res.status(401).json({ error: 'Invalid token' });
                }

                res.status(200).json({ valid: true });
                break;

            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth API error:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        });
    }
}
