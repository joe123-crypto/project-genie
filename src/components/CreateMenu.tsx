import React, { useState } from "react";
import { SparklesIcon } from "./icons";
import CreateFilterView from "./CreateFilterView";
import CreateOutfitView from "./CreateOutfitView";
import { ViewState, User, Filter } from "../types";

interface CreateMenuProps {
  setViewState: (viewState: ViewState) => void;
  user: User | null;
  addFilter?: (newFilter: Filter) => void;
  onBack?: () => void;
}

const CreateMenu: React.FC<CreateMenuProps> = ({ setViewState, user, addFilter }) => {
  const [mode, setMode] = useState<"menu" | "filter" | "studio" | "outfit">("menu");

  // Decide what to render
  if (mode === "filter") {
    return <CreateFilterView setViewState={setViewState} user={user} addFilter={addFilter} onBack={()=>setMode("menu")} />;
  }

  if (mode === "outfit") {
    return <CreateOutfitView setViewState={setViewState} user={user} onBack={()=>setMode("menu")} />;
  }

  if (mode === "studio") {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">
          Filter Studio - Coming Soon
        </h2>
        <button
          onClick={() => setMode("menu")}
          className="mt-4 px-4 py-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Default: show selection menu (your original design)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      <button
        onClick={() => setMode("filter")}
        className="flex flex-col items-center justify-center p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all hover:shadow-lg"
      >
        <div className="h-16 w-16 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-full flex items-center justify-center mb-4">
          <SparklesIcon className="h-8 w-8 text-brand-primary dark:text-dark-brand-primary" />
        </div>
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-2">Instant Filter</h3>
        <p className="text-content-200 dark:text-dark-content-200 text-center">
          Create a filter quickly with AI assistance for prompts and image generation
        </p>
      </button>

      <button
        onClick={() => setMode("studio")}
        className="flex flex-col items-center justify-center p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all hover:shadow-lg"
      >
        <div className="h-16 w-16 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg
            className="h-8 w-8 text-brand-primary dark:text-dark-brand-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-2">Filter Studio</h3>
        <p className="text-content-200 dark:text-dark-content-200 text-center">
          Advanced tools for creating sophisticated filters with complete control
        </p>
      </button>

      <button
        onClick={() => setMode("outfit")}
        className="flex flex-col items-center justify-center p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg border-2 border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all hover:shadow-lg"
      >
        <div className="h-16 w-16 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-full flex items-center justify-center mb-4">
          <SparklesIcon className="h-8 w-8 text-brand-primary dark:text-dark-brand-primary" />
        </div>
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-2">Create Outfit</h3>
        <p className="text-content-200 dark:text-dark-content-200 text-center">
          Create an outfit with AI assistance for prompts and image generation
        </p>
      </button>
    </div>
  );
};

export default CreateMenu;
