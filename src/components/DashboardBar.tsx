import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, SendIcon } from './icons';
import { Template } from '../types';
import { getValidIdToken } from '../services/authService';
import { improvePrompt } from '../services/geminiService';
import { getApiBaseUrlRuntime } from '../utils/api';
import StatusBanner from './StatusBanner';

interface DashboardProps {
  addTemplate: (template: Template) => void;
  username: string;
}

const DashboardBar: React.FC<DashboardProps> = ({ addTemplate, username }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    kind: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim()) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      const idToken = await getValidIdToken();
      if (!idToken) {
        throw new Error("Session expired. Please sign in again.");
      }

      const baseUrl = getApiBaseUrlRuntime();
      const targetUrl = `${baseUrl}/api/generateTemplate`;

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
        let errorMessage = 'Failed to create template';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error (${response.status}): Unable to parse error response`;
        }
        throw new Error(errorMessage);
      }

      const newTemplate: Template = await response.json();
      addTemplate(newTemplate);
      setText('');
      setFeedback({
        kind: 'success',
        message: 'Template created. Opening it now so you can start applying it.',
      });
      router.push(`/${username}/dashboard/${newTemplate.id}`);
    } catch (error) {
      console.error('Error creating template:', error);
      setFeedback({
        kind: 'error',
        message: `Error creating template: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImprovePrompt = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setFeedback(null);
    try {
      const improved = await improvePrompt(text);
      setText(improved);
      setFeedback({
        kind: 'success',
        message: 'Prompt refined. Review it and send when you are ready.',
      });
    } catch (error) {
      console.error('Error improving prompt:', error);
      setFeedback({
        kind: 'error',
        message: `Error improving prompt: ${(error as Error).message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      {feedback ? (
        <StatusBanner
          kind={feedback.kind}
          message={feedback.message}
          className="mb-3"
        />
      ) : null}

      <div
        className="studio-panel flex items-end gap-3 rounded-[2rem] p-3 sm:p-4"
      >
        <div className="flex flex-1 items-start gap-3 rounded-[1.5rem] bg-base-200 px-4 py-3 dark:bg-dark-base-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-100 text-content-300 shadow-sm dark:bg-dark-base-100 dark:text-dark-content-300">
            <SparklesIcon className="h-4 w-4" />
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="Describe a template you want to create..."
            className="max-h-32 w-full resize-none overflow-y-hidden bg-transparent text-base font-medium text-content-100 placeholder-content-300 focus:outline-none dark:text-dark-content-100"
            disabled={isLoading}
            style={{ minHeight: '24px' }}
          />
        </div>

        <div className="flex items-center gap-2 pb-1">
          <button
            onClick={handleImprovePrompt}
            className="studio-soft-button h-11 w-11 rounded-full p-0"
            disabled={isLoading || !text.trim()}
            title="Improve prompt with AI"
          >
            <SparklesIcon className="h-5 w-5" />
          </button>

          <button
            onClick={handleSend}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${text.trim()
              ? 'studio-primary-button p-0'
              : 'cursor-not-allowed bg-neutral-200 text-content-300 dark:bg-dark-neutral-200 dark:text-dark-content-300'
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

export default DashboardBar;

