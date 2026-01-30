'use client'

import React, {
    createContext,
    useContext, useState, useEffect,
    useCallback
} from 'react';
import { User } from '@/types';
import { getAuthUser, signOut as firebaseSignOut } from '@/services/authService';


interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (signedInUser: User) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await getAuthUser();

                if (currentUser) {
                    await fetch('/api/auth/session', {
                        method: 'POST',
                        body: JSON.stringify({
                            token: currentUser.idToken,
                            username: currentUser.displayName ||
                                currentUser.username
                        }),
                    });
                }
                setUser(currentUser);
            } catch (error) {
                console.error('Auth initialization failed:', error)
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = useCallback((signedInUser: User) => {
        setUser(signedInUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            await firebaseSignOut();
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
