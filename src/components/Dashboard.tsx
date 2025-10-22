import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, UploadIcon, SendIcon } from './icons';
import { User, ViewState, Filter } from '../types';
import { getValidIdToken } from '../services/authService';
import { improvePrompt } from '../services/geminiService';

interface DashboardProps {
  user: User | null;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  addFilter: (filter: Filter) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, setViewState, addFilter }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!user) {
      setViewState({ view: 'auth' });
      return;
    }
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const idToken = await getValidIdToken(); 
      if (!idToken) {
        setViewState({ view: 'auth' });
        return; 
      }

      const response = await fetch('/api/generate-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create filter');
      }

      const newFilter: Filter = await response.json();
      addFilter(newFilter);
      setText('');
      setViewState({ view: 'apply', filter: newFilter });
    } catch (error) {
      console.error('Error creating filter:', error);
      alert(`Error creating filter: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprovePrompt = async () => {
    if (!user) {
      setViewState({ view: 'auth' });
      return;
    }
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const improved = await improvePrompt(text);
      setText(improved);
    } catch (error) {
      console.error('Error improving prompt:', error);
      alert(`Error improving prompt: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl px-4">
      <div className="bg-base-100 dark:bg-dark-base-100 rounded-2xl shadow-2xl p-2 flex items-end gap-2 border border-base-300 dark:border-dark-base-300">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="eg Make the person in the image look old(be specific)"
          className="w-full bg-transparent focus:outline-none text-content-100 dark:text-dark-content-100 px-4 placeholder-opacity-50 resize-none overflow-y-hidden"
          disabled={isLoading}
        />
        <button className="p-2 text-content-200 hover:text-brand-primary dark:text-dark-content-200 dark:hover:text-dark-brand-primary rounded-full transition-colors" disabled={isLoading}>
          <UploadIcon className="h-5 w-5" />
        </button>
        <button onClick={handleImprovePrompt} className="p-2 text-content-200 hover:text-brand-primary dark:text-dark-content-200 dark:hover:text-dark-brand-primary rounded-full transition-colors" disabled={isLoading}>
          <SparklesIcon className="h-4 w-4" />
        </button>
        <button
          onClick={handleSend}
          className="p-3 bg-brand-primary text-white rounded-full flex items-center justify-center hover:bg-brand-secondary dark:hover:bg-dark-brand-secondary transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
