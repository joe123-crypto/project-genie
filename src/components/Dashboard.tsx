import React, { useState, useRef, useEffect } from 'react';
import { SparklesIcon, UploadIcon, SendIcon } from './icons';

const Dashboard: React.FC = () => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <div className="w-full max-w-xl px-4">
      <div className="bg-base-100 dark:bg-dark-base-100 rounded-2xl shadow-2xl p-2 flex items-end gap-2 border border-base-300 dark:border-dark-base-300">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Make the person in the image look old"
          className="w-full bg-transparent focus:outline-none text-content-100 dark:text-dark-content-100 px-4 placeholder-content-300 dark:placeholder-dark-content-300 resize-none overflow-y-hidden"
        />
        <button className="p-2 text-content-200 hover:text-brand-primary dark:text-dark-content-200 dark:hover:text-dark-brand-primary rounded-full transition-colors">
          <UploadIcon className="h-5 w-5" />
        </button>
        <button className="p-2 text-content-200 hover:text-brand-primary dark:text-dark-content-200 dark:hover:text-dark-brand-primary rounded-full transition-colors">
          <SparklesIcon className="h-4 w-4" />
        </button>
        <button className="p-3 bg-brand-primary text-white rounded-full flex items-center justify-center hover:bg-brand-secondary dark:hover:bg-dark-brand-secondary transition-colors">
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
