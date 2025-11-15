'use client';

import { useEffect, useState } from 'react';
import SharedImageClientPage from '@/components/SharedImageClientPage';

export default function SharedImagePage() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    // For Capacitor/static export, we need to extract the ID from the URL
    // Since static export can't handle dynamic routes, we use query parameters
    // or extract from the full URL pathname
    
    if (typeof window === 'undefined') return;

    // Method 1: Try query parameter (e.g., /shared?id=abc123)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    if (queryId) {
      setId(queryId);
      return;
    }

    // Method 2: Extract from pathname (e.g., /shared/abc123)
    // This works for client-side navigation in Capacitor apps
    const pathname = window.location.pathname;
    const match = pathname.match(/\/shared\/([^/]+)/);
    if (match && match[1]) {
      setId(match[1]);
      return;
    }

    // Method 3: Extract from hash (e.g., /shared#abc123) - fallback option
    const hash = window.location.hash;
    if (hash && hash.startsWith('#')) {
      const hashId = hash.substring(1);
      if (hashId) {
        setId(hashId);
        return;
      }
    }

    setId(null);
  }, []);

  if (!id) {
    return (
      <div className="text-center bg-base-200 dark:bg-dark-base-200 p-8 rounded-lg max-w-xl mx-auto mt-20">
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100">Invalid Share Link</h3>
        <p className="text-red-400 mt-2">No image ID provided in the URL.</p>
        <p className="text-content-200 dark:text-dark-content-200 mt-4 text-sm">
          Please use a valid share link format: /shared?id=... or /shared/...
        </p>
      </div>
    );
  }

  return <SharedImageClientPage id={id} />;
}

