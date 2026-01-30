'use client';

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Spinner } from '@/components/Spinner';

// Define the shape of the data we expect
interface SharedImage {
  imageUrl: string;
  templateName: string;
  username?: string;
}

// This is the Client Component. It contains all the browser-side logic.
export default function SharedImageClientPage({ id }: { id: string }) {
  const [shareData, setShareData] = useState<SharedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No image ID provided.");
      setIsLoading(false);
      return;
    }

    const fetchShareData = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "sharedImages", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setShareData(docSnap.data() as SharedImage);
        } else {
          setError("This shared image could not be found.");
        }
      } catch (err) {
        console.error("Error fetching shared image:", err);
        setError("An error occurred while trying to load this image.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchShareData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <Spinner className="h-10 w-10 text-brand-primary dark:text-dark-brand-primary" />
        <p className="mt-4 text-lg text-content-200 dark:text-dark-content-200">Loading Shared Image...</p>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="text-center bg-base-200 dark:bg-dark-base-200 p-8 rounded-lg max-w-xl mx-auto">
        <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100">Could Not Load Image</h3>
        <p className="text-red-400 mt-2">{error || "The requested image does not exist."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in text-center">
      <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100">
          Image created with &quot;{shareData.templateName || (shareData as any).filterName}&quot; template
        </h2>
        {shareData.username && (
          <p className="text-content-200 dark:text-dark-content-200 mt-2">Shared by {shareData.username}</p>
        )}
        <div className="my-6 w-full aspect-square bg-base-300 dark:bg-dark-base-300 rounded-lg flex items-center justify-center overflow-hidden">
          <img src={shareData.imageUrl} alt={`Image created with ${shareData.templateName || (shareData as any).filterName} template`} className="object-contain w-full h-full" />
        </div>
      </div>
    </div>
  );
}
