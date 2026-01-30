'use client'

import { commonClasses } from "@/utils/theme";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();

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
        <Link
          href={`/${params.username}/createmenu`}
          className={commonClasses.button.secondary}
        >
          Go Back
        </Link>
      </div>
    </div>
  )
}