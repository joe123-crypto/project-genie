'use client'

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { signInWithGoogle, signIn, signUp, getAuthUser } from '../services/authService';
import { Spinner } from './Spinner';
import { commonClasses, studioClasses } from '../utils/theme';

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

  const inputClass = studioClasses.input;

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/80 p-3 shadow-[0_16px_36px_rgba(239,177,210,0.22)] ring-1 ring-black/5 backdrop-blur dark:bg-white/10 dark:ring-white/10">
          <img src="/lamp.png" alt="Genaie logo" className="h-full w-full object-contain" />
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-content-300 dark:text-dark-content-300">
          Genaie Studio
        </p>
        <h2 className="landing-display mt-3 text-5xl text-content-100 dark:text-dark-content-100">
          {isSigningUp ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-7 text-content-200 dark:text-dark-content-200">
          Sign in to keep creating templates, videos, and saved images in the same polished workspace.
        </p>
      </div>

      <div className={`${commonClasses.container.card} px-6 py-8`}>
        {error ? (
          <p className="mb-4 rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-center text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="space-y-4">
        {isSigningUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <button
          onClick={() => handleAuthAction()}
          className={`w-full ${commonClasses.button.primary}`}
          disabled={isLoading}
        >
          {isSigningUp ? 'Sign Up' : 'Sign In'}
        </button>
        <button
          onClick={handleGoogleSignIn}
          className={`w-full ${commonClasses.button.secondary}`}
          disabled={isLoading}
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          Sign {isSigningUp ? 'Up' : 'In'} with Google
        </button>
        <button
          onClick={() => setIsSigningUp(!isSigningUp)}
          className="w-full py-2 text-sm text-content-200 transition-colors hover:text-content-100 dark:text-dark-content-200 dark:hover:text-dark-content-100"
          disabled={isLoading}
        >
          {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
      </div>
    </div>
  );
};
