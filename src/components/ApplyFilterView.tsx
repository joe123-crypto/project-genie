import React, { useState, useCallback, useEffect } from 'react';
import { applyImageFilter } from '../services/geminiService';
import { Filter, User, ViewState } from '../types';
import { UploadIcon, ShareIcon, DownloadIcon, BackArrowIcon } from './icons';
import ShareModal from './ShareModal';

interface ApplyFilterViewProps {
  filter: Filter;
  setViewState: (state: ViewState) => void;
  user: User | null;
}

const ApplyFilterView: React.FC<ApplyFilterViewProps> = ({ filter, setViewState, user }) => {
  const [uploadedImage1, setUploadedImage1] = useState<string | null>(null);
  const [uploadedImage2, setUploadedImage2] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageFilename, setGeneratedImageFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error' | 'shared'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const filterType = filter.type || 'single';

  const isWindows = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent);

  const handleApplyFilter = useCallback(async () => {
    setError(null);

    const imagesToProcess: string[] = [];
    if (uploadedImage1) imagesToProcess.push(uploadedImage1);
    if (filterType === 'merge' && uploadedImage2) imagesToProcess.push(uploadedImage2);

    if (imagesToProcess.length === 0 || (filterType === 'merge' && imagesToProcess.length < 2)) {
      setError(`Please upload ${filterType === 'merge' ? 'two images' : 'an image'} first.`);
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);
    setGeneratedImageFilename(null);

    try {
      const result = await applyImageFilter(imagesToProcess, filter.prompt);
      setGeneratedImage(result);
      
      // Extract filename from URL if it's an R2 URL
      if (result && result.includes('r2.dev')) {
        const urlParts = result.split('/');
        const filename = urlParts[urlParts.length - 1];
        setGeneratedImageFilename(filename);
      } else {
        // Generate a random filename for base64 URLs
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        setGeneratedImageFilename(`filtered-${timestamp}-${randomId}.png`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage1, uploadedImage2, filter.prompt, filterType]);

  const handleShare = useCallback(async () => {
    if (!generatedImage) return;

    setIsSharing(true);
    setShareStatus('idle');
    setError(null);

    try {
      // 1. Call the share API to get a shareId
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: generatedImage,
          filterName: filter.name,
          username: null, // No username in User type
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.shareId) {
        throw new Error(data.error || 'Failed to create share link');
      }
      const appUrl = window.location.origin;
      const shareUrl = `${appUrl}/shared/${data.shareId}`;
      const shareText = `Check out this image I created with the '${filter.name}' filter!\n${shareUrl}\nCreate your own here: ${appUrl}`;

      // Use Web Share API with file on supported/mobile
      if (!isWindows && navigator.share && navigator.canShare) {
        try {
          const res = await fetch(generatedImage);
          const blob = await res.blob();
          const filename = generatedImageFilename || `filtered-${Date.now()}.png`;
          const file = new File([blob], filename, { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Genie', text: shareText, url: shareUrl, files: [file] });
            setShareStatus('shared');
            setIsSharing(false);
            return;
          }
        } catch (shareErr) {
          // Fall through to modal/copy flow
          console.log('Web Share failed, falling back:', shareErr);
        }
      }

      // On Windows or when Web Share is unavailable, show WhatsApp-only modal
      setIsShareModalOpen(true);
      setShareStatus('idle');
      // Optionally, you can store the shareUrl in state and pass to ShareModal
    } catch (err: unknown) {
      setError(err instanceof Error ? `Sharing failed: ${err.message}` : 'An unknown error occurred while sharing.');
      setShareStatus('error');
    } finally {
      setIsSharing(false);
    }
  }, [generatedImage, filter.name, isWindows, generatedImageFilename, user]);

  const isApplyDisabled = isLoading || !uploadedImage1 || (filterType === 'merge' && !uploadedImage2);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setViewState({ view: 'marketplace' })}
          className="flex items-center gap-2 text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 transition-colors"
        >
          <BackArrowIcon />
          Back to Marketplace
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100">
          Apply &quot;{filter.name}&quot; Filter
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-4">
          <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-content-100 dark:text-dark-content-100 mb-4">
              Upload {filterType === 'merge' ? 'First' : ''} Image
            </h2>
            <div className="border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,.heif,.heic"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setUploadedImage1(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
                id="upload1"
              />
              <label
                htmlFor="upload1"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <UploadIcon />
                <span className="text-content-200 dark:text-dark-content-200">
                  {uploadedImage1 ? 'Change Image' : 'Click to upload'}
                </span>
              </label>
              {uploadedImage1 && (
                <img
                  src={uploadedImage1}
                  alt="Uploaded image 1"
                  className="mt-4 max-w-full max-h-48 object-contain rounded"
                />
              )}
            </div>
          </div>

          {filterType === 'merge' && (
            <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg">
              <h2 className="text-lg font-semibold text-content-100 dark:text-dark-content-100 mb-4">
                Upload Second Image
              </h2>
              <div className="border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.heif,.heic"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setUploadedImage2(event.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="upload2"
                />
                <label
                  htmlFor="upload2"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <UploadIcon />
                  <span className="text-content-200 dark:text-dark-content-200">
                    {uploadedImage2 ? 'Change Image' : 'Click to upload'}
                  </span>
                </label>
                {uploadedImage2 && (
                  <img
                    src={uploadedImage2}
                    alt="Uploaded image 2"
                    className="mt-4 max-w-full max-h-48 object-contain rounded"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-content-100 dark:text-dark-content-100 mb-4">
              Filtered Result
            </h2>
            <div className="border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg p-6 text-center min-h-[200px] flex items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                  <span className="text-content-200 dark:text-dark-content-200">Applying filter...</span>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Filtered result"
                  className="max-w-full max-h-64 object-contain rounded"
                />
              ) : (
                <span className="text-content-200 dark:text-dark-content-200">
                  Upload an image and click &quot;Apply Filter&quot; to see the result
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleApplyFilter}
              disabled={isApplyDisabled}
              className="w-full bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Applying Filter...' : 'Apply Filter'}
            </button>

            {generatedImage && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleShare}
                  disabled={isSharing || isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 dark:bg-dark-base-300 dark:hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ShareIcon />
                  {isWindows ? 'Share (WhatsApp)' : 'Share'}
                </button>
                <a
                  href={generatedImage}
                  download={generatedImageFilename || `filtered-${Date.now()}.png`}
                  className="w-full flex items-center justify-center gap-2 bg-base-200 hover:bg-base-300 dark:bg-dark-base-200 dark:hover:bg-dark-base-300 border border-border-color dark:border-dark-border-color text-content-100 dark:text-dark-content-100 font-bold py-3 px-4 rounded-lg transition-colors text-center"
                >
                  <DownloadIcon />
                  Download
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Windows/Desktop WhatsApp-only share modal */}
      {generatedImage && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          imageUrl={generatedImage}
          filterName={filter.name}
          filename={generatedImageFilename || undefined}
        />
      )}
    </div>
  );
};

export default ApplyFilterView;
