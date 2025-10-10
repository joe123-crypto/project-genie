import React, { useState, useCallback, useEffect } from 'react';
import { mergeImages } from '../services/geminiService';
import { Outfit, User, ViewState } from '../types';
import { UploadIcon, ShareIcon, DownloadIcon, SaveIcon } from './icons'; // Assuming SaveIcon exists
import ShareModal from './ShareModal';

// Helper to call our API
async function callApi(action: string, body: object) {
  const response = await fetch(`/api/firebase?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `API action '${action}' failed`);
  }
  return data;
}

interface ApplyOutfitViewProps {
  outfit: Outfit;
  setViewState: (state: ViewState) => void;
  user: User | null;
}

const ApplyOutfitView: React.FC<ApplyOutfitViewProps> = ({ outfit, setViewState, user }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // This will now store the persistent URL
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // When a new image is generated and saved, we might want to show a success message briefly.
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleApplyOutfit = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setSaveStatus('idle');

    try {
      // Step 1: Get the base64 image from the AI service
      const base64Image = await mergeImages([uploadedImage, outfit.previewImageUrl], outfit.prompt);

      // Step 2: Store this temporary image in the 'filtered/' directory via our API
      const { imageUrl: persistentUrl } = await callApi('storeFilteredImage', { image: base64Image });

      // Step 3: Update the view to display the new, persistent image URL
      setGeneratedImage(persistentUrl);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, outfit.previewImageUrl, outfit.prompt]);

  const handleSave = useCallback(async () => {
    if (!generatedImage || !user) {
      setError('You must be logged in to save an image.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveStatus('idle');

    try {
      const creationData = {
        userId: user.uid,
        originalFilterId: outfit.id, // Link back to the outfit used
        filterName: outfit.name,
        previewImageUrl: generatedImage, // The persistent URL from the 'filtered/' folder
      };
      
      // This API call will handle copying the image to 'saved/' and creating the DB record.
      await callApi('saveCreation', { creation: creationData });
      
      setSaveStatus('saved');

    } catch (err: unknown) {
      setError(err instanceof Error ? `Save failed: ${err.message}` : 'An unknown error occurred while saving.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, outfit.id, outfit.name, user]);

  const isApplyDisabled = isLoading || !uploadedImage;
  const generatedImageFilename = generatedImage ? generatedImage.split('/').pop() : 'creation.png';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-6 p-4">

      {/* Main content card */}
      <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100 mb-2">{outfit.name}</h1>
        <p className="text-content-200 dark:text-dark-content-200 mb-4">{outfit.description}</p>
        
        <div className="aspect-video w-full bg-base-300 dark:bg-dark-base-300 rounded-lg flex items-center justify-center overflow-hidden mb-4">
            <img src={outfit.previewImageUrl} alt="Filter Preview" className="object-contain max-h-full max-w-full"/>
        </div>

        {/* User Upload Section */}
        <div className="flex flex-col items-center p-4 border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg">
          <label htmlFor="upload-input" className="cursor-pointer flex flex-col items-center gap-2 text-center">
            <UploadIcon />
            <span className="text-content-200 dark:text-dark-content-200">
              {uploadedImage ? 'Change your photo' : 'Upload your photo to begin'}
            </span>
          </label>
          <input
            id="upload-input"
            type="file"
            accept="image/*,.heif,.heic"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => setUploadedImage(event.target?.result as string);
                reader.readAsDataURL(file);
              }
            }}
          />
          {uploadedImage && <img src={uploadedImage} alt="User upload preview" className="mt-4 max-w-full max-h-48 object-contain rounded-md shadow"/>}
        </div>

        {/* Action Button */}
        <button
          onClick={handleApplyOutfit}
          disabled={isApplyDisabled}
          className="w-full mt-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {isLoading ? 'Applying...' : 'Apply Outfit'}
        </button>
      </div>

      {/* Results Section */}
      {(isLoading || generatedImage) && (
        <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-content-100 dark:text-dark-content-100 mb-4 text-center">Your Creation</h2>
          <div className="min-h-[250px] w-full flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                <span className="text-content-200 dark:text-dark-content-200">Generating image...</span>
              </div>
            ) : generatedImage && (
              <img src={generatedImage} alt="Generated outfit result" className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"/>
            )}
          </div>

          {generatedImage && (
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              <button onClick={() => setIsShareModalOpen(true)} className="flex items-center gap-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:hover:bg-dark-neutral-300 text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg shadow">
                <ShareIcon /> Share
              </button>
              <a href={generatedImage} download={generatedImageFilename} className="flex items-center gap-2 bg-base-300 hover:bg-base-400 dark:bg-dark-base-300 dark:hover:bg-dark-base-400 text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg shadow">
                <DownloadIcon /> Download
              </a>
              {user && (
                <button onClick={handleSave} disabled={isSaving || saveStatus === 'saved'} className="flex items-center gap-2 bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-100 font-bold py-2 px-4 rounded-lg shadow disabled:opacity-60">
                  {isSaving ? 'Saving...' : (saveStatus === 'saved' ? 'Saved!' : 'Save Creation')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg fixed bottom-4 right-4 shadow-lg">
          <p className='font-bold'>Error</p>
          <p>{error}</p>
        </div>
      )}

      {generatedImage && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          imageUrl={generatedImage}
          filterName={outfit.name}
          filterId={outfit.id}
        />
      )}
    </div>
  );
};

export default ApplyOutfitView;
