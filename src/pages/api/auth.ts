import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '../../types';

const API_KEY = process.env.FIREBASE_API_KEY;
const AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1/accounts";

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
        expiresAt: Date.now() + (parseInt(data.expiresIn) * 1000)
    };

    return user;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method, body } = req;
    const { action } = req.query;

    if (!API_KEY) {
        return res.status(500).json({ error: 'Firebase API key is not configured.' });
    }

    if (method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        switch (action) {
            case 'signUp':
                const { email: signUpEmail, password: signUpPassword } = body;
                if (!signUpEmail || !signUpPassword) {
                    return res.status(400).json({ error: 'Email and password are required' });
                }

                const signUpResponse = await fetch(`${AUTH_BASE_URL}:signUp?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: signUpEmail,
                        password: signUpPassword,
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
