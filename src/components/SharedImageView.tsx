'use client';

import React from 'react';
import SharedImageClientPage from './SharedImageClientPage';
import { ViewState } from '../types';

interface SharedImageViewProps {
  shareId: string;
  setViewState: (state: ViewState) => void;
}

export default function SharedImageView({ shareId, setViewState }: SharedImageViewProps) {
  return (
    <div>
      <button
        onClick={() => setViewState({ view: 'feed' })}
        className="mb-4 px-4 py-2 bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-300 rounded-lg text-content-100 dark:text-dark-content-100 transition-colors"
      >
        ← Back to Feed
      </button>
      <SharedImageClientPage id={shareId} />
    </div>
  );
}

