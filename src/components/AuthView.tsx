
import React, { useState } from 'react';
import { signIn, signUp } from '../services/authService';
import { User, ViewState } from '../types';
import { Spinner } from './Spinner';
import { BackArrowIcon } from './icons';
import { commonClasses, themeColors } from '../utils/theme'; // Import theme utilities

interface AuthViewProps {
  onSignInSuccess: (user: User) => void;
  setViewState: (viewState: ViewState) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onSignInSuccess, setViewState }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const inputClasses = `w-full ${themeColors.base.light[100]} ${themeColors.base.dark[300]} border ${themeColors.border.light} ${themeColors.border.dark} rounded-lg px-3 py-2 ${commonClasses.text.body} placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-primary dark:focus:ring-dark-brand-primary focus:outline-none`;

  return (
    <div className="max-w-md mx-auto animate-fade-in">
        <button
            onClick={() => setViewState({ view: 'marketplace' })}
            className={`flex items-center gap-2 ${commonClasses.text.body} hover:text-content-100 dark:hover:text-dark-content-100 mb-6 font-semibold`}
        >
            <BackArrowIcon />
            Back to Marketplace
        </button>

      <div className={`${commonClasses.container.card} p-8 rounded-lg shadow-xl`}>
        <h2 className={`${commonClasses.text.heading} text-3xl font-bold text-center mb-6`}>{isSigningUp ? 'Create Account' : 'Sign In'}</h2>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {isSigningUp && (
            <div>
                <label htmlFor="username" className={`block text-sm font-medium ${commonClasses.text.heading} mb-1`}>
                Username
                </label>
                <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClasses}
                placeholder="your_username"
                disabled={isLoading}
                autoComplete="username"
                />
            </div>
        )}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${commonClasses.text.heading} mb-1`}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              placeholder="you@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium ${commonClasses.text.heading} mb-1`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete={isSigningUp ? "new-password" : "current-password"}
            />
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-center text-sm">{error}</p>}

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={handleAuthAction}
              disabled={isLoading}
              className={`flex justify-center items-center ${commonClasses.button.primary} py-3 px-4 rounded-lg transition-colors disabled:opacity-50`}
            >
              {isLoading ? <Spinner className="w-5 h-5 text-white" /> : (isSigningUp ? 'Create Account' : 'Sign In')}
            </button>
            <button
              type="button"
              onClick={() => setIsSigningUp(!isSigningUp)}
              disabled={isLoading}
              className={`text-center text-sm ${commonClasses.text.body} hover:underline`}
            >
              {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthView;