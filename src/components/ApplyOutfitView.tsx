import React, { useState, useCallback } from 'react';
import { mergeImages,applyImageFilter } from '../services/geminiService';
import { Outfit, User, ViewState } from '../types';
import { UploadIcon, ShareIcon, DownloadIcon } from './icons';
import ShareModal from './ShareModal';

interface ApplyOutfitViewProps {
  outfit: Outfit; // includes previewImageUrl, name, description, prompt
  setViewState: (state: ViewState) => void;
  user: User | null;
}

const ApplyOutfitView: React.FC<ApplyOutfitViewProps> = ({ outfit, setViewState, user }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageFilename, setGeneratedImageFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

  /**
   * Merge the uploaded image with the outfit preview using the outfit prompt
   */
  const handleApplyOutfit = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImageFilename(null);

    try {
      //console.log(outfit.previewImageUrl);
      //console.log(outfit.prompt);
       //Merge user's uploaded image + outfit preview + outfit's prompt
      const result = await mergeImages(
        [uploadedImage, outfit.previewImageUrl],
        outfit.prompt
      );

      setGeneratedImage(result);

      // Extract filename if result is hosted
      if (result && result.includes('r2.dev')) {
        const urlParts = result.split('/');
        const filename = urlParts[urlParts.length - 1];
        setGeneratedImageFilename(filename);
      } else {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        setGeneratedImageFilename(`outfit-${timestamp}-${randomId}.png`);
      }
    } catch (err: unknown) {
    //  setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, outfit.previewImageUrl, outfit.prompt]);

  /**
   * Share generated image
   */
  const handleShare = useCallback(async () => {
    if (!generatedImage) return;
    setIsSharing(true);
    setError(null);
    setShareStatus('idle');

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: generatedImage, filterName: outfit.name, username: user?.email ?? null })
      });

      const data = await response.json();
      if (!response.ok || !data.shareId) throw new Error(data.error || 'Failed to create share link');

      const appUrl = window.location.origin;
      const shareUrl = `${appUrl}/shared/${data.shareId}`;
      const shareText = `Check out this outfit I made with '${outfit.name}'!\n${shareUrl}\nTry it on: ${appUrl}`;

      // Try native sharing first
      if (!isWindows && navigator.share && navigator.canShare) {
        try {
          const res = await fetch(generatedImage);
          const blob = await res.blob();
          const filename = generatedImageFilename || `outfit-${Date.now()}.png`;
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Genie', text: shareText, url: shareUrl, files: [file] });
            setShareStatus('shared');
            return;
          }
        } catch (shareErr) {
          console.log('Web Share failed, falling back:', shareErr);
        }
      }

      setIsShareModalOpen(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? `Sharing failed: ${err.message}` : 'An unknown error occurred while sharing.');
      setShareStatus('error');
    } finally {
      setIsSharing(false);
    }
  }, [generatedImage, outfit.name, user, generatedImageFilename, isWindows]);

  /**
   * Save generated image for user (optional future use)
   */
  const handleSave = useCallback(async () => {
    if (!generatedImage) return;
    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);

    try {
      await applyImageFilter([generatedImage], outfit.prompt, "saved");
      setSaveStatus('saved');
    } catch (err: unknown) {
      setError(err instanceof Error ? `Save failed: ${err.message}` : 'An unknown error occurred while saving.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, outfit.prompt]);

  const isApplyDisabled = isLoading || !uploadedImage;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-6">
      {/* Outfit Information */}
      <div className="p-4 bg-base-100 dark:bg-dark-base-100 rounded shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100 mb-2">{outfit.name}</h1>
        <p className="text-content-200 dark:text-dark-content-200">{outfit.description}</p>
      </div>

      {/* Outfit Preview */}
      <div className="bg-base-200 dark:bg-dark-base-200 p-6 rounded-lg flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold text-content-100 dark:text-dark-content-100">Filter Preview</h2>
        <img
          src={outfit.previewImageUrl}
          alt="Filter Preview"
          className="rounded-lg max-h-72 object-contain shadow-lg"
        />

        {/* User Upload */}
        <div className="flex flex-col items-center mt-4">
          <label htmlFor="upload" className="cursor-pointer flex flex-col items-center gap-2 w-full">
            <UploadIcon />
            <span className="text-content-200 dark:text-dark-content-200">
              {uploadedImage ? 'Change Image' : 'Click or drag to upload your photo'}
            </span>
            <input
              type="file"
              accept="image/*,.heif,.heic"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setUploadedImage(event.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="upload"
            />
          </label>

          {uploadedImage && (
            <img
              src={uploadedImage}
              alt="Uploaded image"
              className="mt-4 max-w-full max-h-64 object-contain rounded shadow"
            />
          )}
        </div>

        {/* Generate Button + Output */}
        <button
          onClick={handleApplyOutfit}
          disabled={isApplyDisabled}
          className="w-full mt-4 bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Applying Outfit...' : 'Apply Outfit'}
        </button>

        <div className="border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg p-6 min-h-[200px] w-full flex items-center justify-center bg-base-100 dark:bg-dark-base-100 mt-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
              <span className="text-content-200 dark:text-dark-content-200">Generating image...</span>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt="Generated outfit result"
              className="max-w-full max-h-96 object-contain rounded shadow-lg"
            />
          ) : (
            <span className="text-content-200 dark:text-dark-content-200">
              {uploadedImage ? 'Ready to apply outfit!' : 'Upload your photo to get started.'}
            </span>
          )}
        </div>

        {generatedImage && (
          <div className="flex gap-3 mt-4 flex-wrap justify-center">
            <button
              onClick={handleShare}
              disabled={isSharing || isLoading}
              className="flex items-center gap-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:hover:bg-dark-neutral-300 text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <ShareIcon />
              {isWindows ? 'Share (WhatsApp)' : 'Share'}
            </button>
            <a
              href={generatedImage}
              download={generatedImageFilename || `outfit-${Date.now()}.png`}
              className="flex items-center gap-2 bg-base-200 hover:bg-base-300 dark:bg-dark-base-200 dark:hover:bg-dark-base-300 border border-border-color dark:border-dark-border-color text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg transition-colors text-center"
            >
              <DownloadIcon />
              Download
            </a>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex items-center gap-2 bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-100 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {saveStatus === 'saved' && <span className="text-green-600 dark:text-green-300 ml-2">Saved!</span>}
            {saveStatus === 'error' && <span className="text-red-600 dark:text-red-300 ml-2">Save failed</span>}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {generatedImage && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          imageUrl={generatedImage}
          filterName={outfit.name}
          filename={generatedImageFilename || undefined}
        />
      )}
    </div>
  );
};

export default ApplyOutfitView;
