'use client';

import { useState } from 'react';
//import { SparklesIcon } from "@/app/components/icons";
/*import CreateTemplateView from "@app/components/CreateMenu/templateTemplate";
import CreateOutfitView from "./templateTemplate/Outfit/CreateOutfitView";
import CreateHairstyleView from "../CreateHairstyleView";
import CreateVideoView from "../CreateVideoView/route";
import { ViewState, User, Template, Hairstyle } from "../../types";*/
import { commonClasses } from "../../../utils/theme";
import Link from "next/link";
import { useParams } from 'next/navigation';

/*interface CreateMenuProps {
  setViewState: (viewState: ViewState) => void;
  user: User | null;
  addTemplate?: (newTemplate: Template) => void;
  addHairstyle?: (newHairstyle: Hairstyle) => void;
  onBack?: () => void;
}

const CreateMenu: React.FC<CreateMenuProps> = ({ setViewState, user, addTemplate, addHairstyle }) => {
  const [mode, setMode] = useState<"menu" | "template" | "studio" | "outfit" | "hairstyle" | "video">("menu");*/
export default function Page() {
  const params = useParams()
  // Decide what to render
  /*if (mode === "filter") {
    return <CreateFilterView setViewState={setViewState} user={user} addFilter={addFilter} onBack={() => setMode("menu")} />;
  }

  if (mode === "outfit") {
    return <CreateOutfitView setViewState={setViewState} user={user} onBack={() => setMode("menu")} />;
  }

  if (mode === "hairstyle") {
    return <CreateHairstyleView setViewState={setViewState} user={user} addHairstyle={addHairstyle} onBack={() => setMode("menu")} />;
  }

  if (mode === "video") {
    return <CreateVideoView setViewState={setViewState} user={user} onBack={() => setMode("menu")} />;
  }*/

  /*if (mode === "studio") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-base-200/50 dark:bg-dark-base-200/50 backdrop-blur-md p-8 rounded-2xl border border-border-color dark:border-dark-border-color text-center max-w-md mx-4">
          <div className="h-16 w-16 bg-brand-primary/10 dark:bg-dark-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
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
          <h2 className={`text-2xl ${commonClasses.text.heading} mb-2`}>
            Template Studio
          </h2>
          <p className={`${commonClasses.text.body} mb-6`}>
            Advanced tools for creating sophisticated templates are coming soon.
          </p>
          <button
            onClick={() => setMode("menu")}
            className={commonClasses.button.secondary}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }*/

  // Default: show selection menu
  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h2 className={`text-3xl md:text-4xl ${commonClasses.text.heading} mb-4`}>
          Create New
        </h2>
        <p className={`text-lg ${commonClasses.text.body} max-w-2xl mx-auto`}>
          Choose what you want to create today. Unleash your creativity with AI-powered tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {/* Instant Template Card 
        <button
          onClick={() => setMode("template")}
          className="group relative flex flex-col items-center p-8 bg-base-100/50 dark:bg-dark-base-100/50 backdrop-blur-sm rounded-2xl border border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="h-20 w-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <SparklesIcon className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" />
          </div>
          <h3 className={`text-xl ${commonClasses.text.heading} mb-3`}>Instant Template</h3>
          <p className={`${commonClasses.text.body} text-center text-sm leading-relaxed`}>
            Create a template quickly with AI assistance for prompts and image generation.
          </p>
        </button>
*/}
        {/* Template Studio Card */}
        <Link
          href={`/${params.username}/createmenu/templateStudio`}
          //onClick={() => setMode("studio")}
          className="group relative flex flex-col items-center p-8 bg-base-100/50 dark:bg-dark-base-100/50 backdrop-blur-sm rounded-2xl border border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="h-20 w-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg
              className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary"
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
          <h3 className={`text-xl ${commonClasses.text.heading} mb-3`}>Template Studio</h3>
          <p className={`${commonClasses.text.body} text-center text-sm leading-relaxed`}>
            Advanced tools for creating sophisticated templates with complete control.
          </p>
        </Link>

        {/* Create Outfit Card 
        <button
          onClick={() => setMode("outfit")}
          className="group relative flex flex-col items-center p-8 bg-base-100/50 dark:bg-dark-base-100/50 backdrop-blur-sm rounded-2xl border border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="h-20 w-20 bg-gradient-to-br from-orange-500/10 to-pink-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <SparklesIcon className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" />
          </div>
          <h3 className={`text-xl ${commonClasses.text.heading} mb-3`}>Create Outfit</h3>
          <p className={`${commonClasses.text.body} text-center text-sm leading-relaxed`}>
            Create an outfit with AI assistance for prompts and image generation.
          </p>
        </button>

        <button
          onClick={() => setMode("hairstyle")}
          className="group relative flex flex-col items-center p-8 bg-base-100/50 dark:bg-dark-base-100/50 backdrop-blur-sm rounded-2xl border border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="h-20 w-20 bg-gradient-to-br from-pink-500/10 to-purple-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <SparklesIcon className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" />
          </div>
          <h3 className={`text-xl ${commonClasses.text.heading} mb-3`}>Create Hairstyle</h3>
          <p className={`${commonClasses.text.body} text-center text-sm leading-relaxed`}>
            Create a new hairstyle with AI assistance.
          </p>
        </button>

        <button
          onClick={() => setMode("video")}
          className="group relative flex flex-col items-center p-8 bg-base-100/50 dark:bg-dark-base-100/50 backdrop-blur-sm rounded-2xl border border-border-color dark:border-dark-border-color hover:border-brand-primary dark:hover:border-dark-brand-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="h-20 w-20 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.818v6.364a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className={`text-xl ${commonClasses.text.heading} mb-3`}>Create Video</h3>
          <p className={`${commonClasses.text.body} text-center text-sm leading-relaxed`}>
            Create a video template with AI-powered video generation.
          </p>
        </button>
             */}
      </div>
    </div>
  );
};
