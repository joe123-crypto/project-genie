'use client'

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { signInWithGoogle, signIn, signUp, getAuthUser } from '../services/authService';
import { Spinner } from './Spinner';
import { commonClasses, themeColors } from '../utils/theme'; // Import theme utilities

interface InitialAuthViewProps {
  onSignInSuccess: (user: User) => void;
}

export const InitialAuthView: React.FC<InitialAuthViewProps> = ({ onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const user = await getAuthUser();
        if (user) {
          onSignInSuccess(user);
        }
      } catch {
        // No user signed in, or error checking. Proceed to show auth options.
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [onSignInSuccess]);

  const handleAuthAction = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (isSigningUp && !username) {
      setError('Please enter a username.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const user = isSigningUp
        ? await signUp(email, password, username)
        : await signIn(email, password);
      onSignInSuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const user = await signInWithGoogle();
      if (user) {
        onSignInSuccess(user);
      } else {
        setError('Google Sign-In failed or was cancelled.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred with Google Sign-In.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`${commonClasses.container.card} max-w-md mx-auto animate-fade-in`}>
      <h2 className={`${commonClasses.text.heading} text-3xl font-bold text-center mb-6`}>
        {isSigningUp ? 'Create Account' : 'Sign In'}
      </h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="space-y-4">
        {isSigningUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full px-4 py-2 border ${themeColors.border.light} ${themeColors.border.dark} rounded-md focus:outline-none focus:ring-2`}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-2 border ${themeColors.border.light} ${themeColors.border.dark} rounded-md focus:outline-none focus:ring-2`}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-4 py-2 border ${themeColors.border.light} ${themeColors.border.dark} rounded-md focus:outline-none focus:ring-2`}
        />
        <button
          onClick={() => handleAuthAction()}
          className={`w-full py-2 rounded-md ${commonClasses.button.primary} ${commonClasses.transitions.default}`}
          disabled={isLoading}
        >
          {isSigningUp ? 'Sign Up' : 'Sign In'}
        </button>
        <button
          onClick={handleGoogleSignIn}
          className={`w-full py-2 rounded-md ${commonClasses.button.secondary} ${commonClasses.transitions.default} flex items-center justify-center gap-2`}
          disabled={isLoading}
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Sign {isSigningUp ? 'Up' : 'In'} with Google
        </button>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className={`w-full py-2 rounded-md hover:underline ${commonClasses.transitions.default} text-brand-primary dark:text-dark-brand-primary`}
          disabled={isLoading}
        >
          {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};
