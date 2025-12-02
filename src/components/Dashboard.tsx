import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, SendIcon } from './icons';
import { ViewState, Filter } from '../types';
import { getValidIdToken } from '../services/authService';
import { improvePrompt } from '../services/geminiService';
import { getApiBaseUrlRuntime } from '../utils/api';

interface DashboardProps {
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;
  addFilter: (filter: Filter) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setViewState, addFilter }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    try {
      const idToken = await getValidIdToken();
      if (!idToken) {
        throw new Error("Session expired. Please sign in again.");
      }

      const baseUrl = getApiBaseUrlRuntime();
      const targetUrl = `${baseUrl}/api/generate-filter`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt: text }),
      });

      // Check if response is HTML instead of JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. The API endpoint may not be deployed or accessible.`);
      }

      if (!response.ok) {
        let errorMessage = 'Failed to create filter';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}): Unable to parse error response`;
        }
        throw new Error(errorMessage);
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
    <div className="w-full max-w-2xl px-4 mx-auto">
      <div
        ref={containerRef}
        className="bg-white/95 dark:bg-black/95 backdrop-blur-xl backdrop-saturate-150 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-3 flex items-end gap-2 transition-all duration-300 hover:shadow-brand-primary/10"
      >
        <div className="flex-1 pl-4 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Describe a filter you want to create..."
            className="w-full bg-transparent focus:outline-none text-black dark:text-white resize-none overflow-y-hidden placeholder-gray-700 dark:placeholder-gray-300 text-base font-medium max-h-32"
            disabled={isLoading}
            style={{ minHeight: '24px' }}
          />
        </div>

        <div className="flex items-center gap-1 pr-1 pb-1">
          <button
            onClick={handleImprovePrompt}
            className="p-2 text-brand-primary dark:text-dark-brand-primary hover:bg-brand-primary/10 dark:hover:bg-dark-brand-primary/10 rounded-full transition-colors"
            disabled={isLoading || !text.trim()}
            title="Improve prompt with AI"
          >
            <SparklesIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleSend}
            className={`p-3 rounded-full flex items-center justify-center transition-all duration-300 ${text.trim()
              ? 'bg-brand-primary text-white hover:bg-brand-secondary shadow-lg hover:shadow-brand-primary/30'
              : 'bg-neutral-200 dark:bg-dark-neutral-200 text-content-300 dark:text-dark-content-300 cursor-not-allowed'
              }`}
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <SendIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
