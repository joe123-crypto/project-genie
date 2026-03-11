import React, { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { applyImageTemplate } from '../services/geminiService';
import { shareImage, ShareResult } from '../services/shareService';
import { downscale } from '../utils/downscale';
import { getApiBaseUrlRuntime } from '../utils/api';
import { Template, User, ViewState } from '../types';
import { UploadIcon, ShareIcon, DownloadIcon } from './icons';
import ShareModal from './ShareModal';

interface ApplyTemplateViewProps {
  template: Template | null;
  templateId?: string;
  setViewState: (state: ViewState) => void;
  user: User | null;
}

const ApplyTemplateView: React.FC<ApplyTemplateViewProps> = ({ template, templateId, setViewState, user }) => {
  //const [template, setTemplate] = useState<Template | null>(initialTemplate || null);
  const [uploadedImage1, setUploadedImage1] = useState<string | null>(null);
  const [uploadedImage2, setUploadedImage2] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageFilename, setGeneratedImageFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [personalPrompt, setPersonalPrompt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string | null>(null);
  // Check if we are still waiting for the template to load from context
  const isTemplateLoading = !!templateId && (!template || template.id !== templateId);
  const templateType = template?.type ?? 'single';
  const templatePrompt = template?.prompt ?? '';
  //console.log("template in apply template view:", template);

  const handleApplyTemplate = useCallback(async () => {
    setError(null);
    setSaveStatus('idle');

    const imagesToProcess: string[] = [];
    if (uploadedImage1) imagesToProcess.push(uploadedImage1);
    if (templateType === 'merge' && uploadedImage2) imagesToProcess.push(uploadedImage2);

    if (imagesToProcess.length === 0 || (templateType === 'merge' && imagesToProcess.length < 2)) {
      setError(`Please upload ${templateType === 'merge' ? 'two images' : 'an image'} first.`);
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);
    setGeneratedImageFilename(null);

    try {
      const combinedPrompt = personalPrompt ? `${templatePrompt}\n${personalPrompt}` : templatePrompt;
      const result = await applyImageTemplate(imagesToProcess, combinedPrompt, 'templated');
      setGeneratedImage(result);

      // Generate a simple filename for all cases, now handled by native plugin if needed
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      setGeneratedImageFilename(`genie-${timestamp}-${randomId}.png`);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage1, uploadedImage2, templatePrompt, templateType, personalPrompt]);

  const fetchImageAsBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSave = useCallback(async () => {
    if (!generatedImage || !user) return null;
    if (generatedImageFilename?.startsWith('saved/')) {
      setSaveStatus('saved');
      return generatedImage;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);

    try {
      const baseUrl = getApiBaseUrlRuntime();

      // 1. Convert image to data URL if needed
      let imageDataUrl = generatedImage;
      if (!imageDataUrl.startsWith('data:')) {
        imageDataUrl = await fetchImageAsBase64(imageDataUrl);
      }

      // 2. Downscale the image to reduce size before uploading (max 1024px, WebP format with 0.8 quality)
      // This prevents payload size issues and speeds up uploads
      console.log('[Save] Downscaling image before upload...');
      let downscaledBase64: string;
      try {
        downscaledBase64 = await downscale(imageDataUrl, 1024, 'webp', 0.8);
        console.log('[Save] Image downscaled successfully');
      } catch (downscaleError) {
        console.error('[Save] Downscale failed:', downscaleError);
        // If WebP downscale fails, try PNG as fallback
        console.log('[Save] Trying PNG format as fallback...');
        downscaledBase64 = await downscale(imageDataUrl, 1024, 'png', 1.0);
        console.log('[Save] Image downscaled to PNG successfully');
      }

      const downscaledDataUrl = downscaledBase64.startsWith('data:')
        ? downscaledBase64
        : `data:image/webp;base64,${downscaledBase64}`;

      // 3. Generate filename with user ID for organization (same structure as Firebase had)
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const directoryName = `${user.uid}/${timestamp}-${randomId}`;

      // 4. Upload to R2 using /api/save-image endpoint with "saved" destination
      console.log('[Save] Uploading image to R2...');
      const uploadResponse = await fetch(`${baseUrl}/api/save-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: downscaledDataUrl,
          destination: 'saved',
          directoryName: directoryName
        }),
      });

      if (!uploadResponse.ok) {
        let errorText = 'Failed to upload image';
        try {
          const errorData = await uploadResponse.json();
          errorText = errorData.error || `Upload failed with status ${uploadResponse.status}`;
          console.error('[Save] Upload error:', errorData);
        } catch {
          const text = await uploadResponse.text().catch(() => 'Unknown error');
          console.error('[Save] Upload error response:', text);
          errorText = `Upload failed: ${text.substring(0, 200)}`;
        }
        throw new Error(errorText);
      }

      const uploadData = await uploadResponse.json();
      const savedImageUrl = uploadData.url;

      if (!savedImageUrl) {
        console.error('[Save] No URL in upload response:', uploadData);
        throw new Error('No URL returned from image upload');
      }

      console.log('[Save] Image saved successfully, URL:', savedImageUrl);

      // Update state with saved image URL and filename
      setGeneratedImage(savedImageUrl);
      const newFilename = savedImageUrl.substring(savedImageUrl.indexOf("saved/"));
      setGeneratedImageFilename(newFilename);
      setSaveStatus('saved');
      return savedImageUrl;

    } catch (err: unknown) {
      console.error('[Save] Save error:', err);
      setError(err instanceof Error ? `Save failed: ${err.message}` : 'An unknown error occurred while saving.');
      setSaveStatus('error');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, generatedImageFilename, user]);

  const handleShare = useCallback(async () => {
    if (!generatedImage || !template) return;

    setIsSharing(true);
    setError(null);

    try {
      let imageToShare = generatedImage;

      if (!imageToShare.startsWith('data:') && !imageToShare.startsWith('http')) {
        imageToShare = await fetchImageAsBase64(imageToShare);
      }

      const result: ShareResult = await shareImage(imageToShare, template, user);
      setShareUrl(result.shareUrl);
      if (result.templateUrl) {
        setTemplateUrl(result.templateUrl);
      }
      if (result.status === 'modal') {
        setIsShareModalOpen(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? `Sharing failed: ${err.message}` : 'Unknown error');
    } finally {
      setIsSharing(false);
    }
  }, [generatedImage, template, user]);

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;

    setIsDownloading(true);
    setError(null);

    try {
      let blob: Blob;

      if (generatedImage.startsWith('data:')) {
        const response = await fetch(generatedImage);
        blob = await response.blob();
      } else if (generatedImage.startsWith('http')) {
        const response = await fetch(generatedImage);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        blob = await response.blob();
      } else {
        throw new Error('Invalid image format for download');
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      let filename = generatedImageFilename || `genie-${timestamp}-${randomId}`;

      if (!filename.includes('.')) {
        const extension = blob.type.includes('webp') ? '.webp'
          : blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg'
            : '.png';
        filename = `${filename}${extension}`;
      }

      saveAs(blob, filename);
    } catch (err) {
      console.error("[Download] Download error:", err);
      console.error("[Download] Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      setError(err instanceof Error ? `Download failed: ${err.message}` : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  }, [generatedImage, generatedImageFilename]);


  const isApplyDisabled = isLoading || !uploadedImage1 || (templateType === 'merge' && !uploadedImage2);

  if (isTemplateLoading) {
    return (
      <div className="flex flex-col items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
        <p className="mt-4 text-lg">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500">Template not found.</p>
        <button
          onClick={() => setViewState({ view: 'marketplace' })}
          className="mt-4 bg-brand-primary text-white px-4 py-2 rounded-lg"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-6">
      <div className="p-4 bg-base-100 dark:bg-dark-base-100 rounded shadow">
        <h1 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100 mb-2">{template.name}</h1>
        <p className="text-content-200 dark:text-dark-content-200">{template.description}</p>
      </div>

      <div className="bg-base-200 dark:bg-dark-base-200 p-6 rounded-lg flex flex-col items-center gap-4">
        <div className="w-full flex flex-col sm:flex-row gap-4 justify-center">
          <div className="flex-1 flex flex-col items-center">
            <label htmlFor="upload1" className="cursor-pointer flex flex-col items-center gap-2 w-full">
              <UploadIcon />
              <span className="text-content-200 dark:text-dark-content-200">
                {uploadedImage1 ? 'Change Image' : 'Click or drag to upload'}
              </span>
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
            </label>
            {uploadedImage1 && (
              <img
                src={uploadedImage1}
                alt="Uploaded image 1"
                className="mt-4 max-w-full max-h-64 object-contain rounded shadow"
              />
            )}
          </div>
          {templateType === 'merge' && (
            <div className="flex-1 flex flex-col items-center">
              <label htmlFor="upload2" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                <UploadIcon />
                <span className="text-content-200 dark:text-dark-content-200">
                  {uploadedImage2 ? 'Change Image' : 'Click or drag to upload'}
                </span>
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
              </label>
              {uploadedImage2 && (
                <img
                  src={uploadedImage2}
                  alt="Uploaded image 2"
                  className="mt-4 max-w-full max-h-64 object-contain rounded shadow"
                />
              )}
            </div>
          )}
        </div>

        <div className="w-full flex flex-col items-center mt-6">
          <div className="border-2 border-dashed border-border-color dark:border-dark-border-color rounded-lg p-6 min-h-[200px] w-full flex items-center justify-center bg-base-100 dark:bg-dark-base-100">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                <span className="text-content-200 dark:text-dark-content-200">Applying template...</span>
              </div>
            ) : generatedImage ? (
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Templated result"
                  className="max-w-full max-h-96 object-contain rounded shadow-lg"
                />
                <div
                  className="absolute inset-0 bg-transparent"
                  onContextMenu={(e) => e.preventDefault()}
                ></div>
              </div>
            ) : (
              <span className="text-content-200 dark:text-dark-content-200">
                {uploadedImage1 ? 'Ready to apply template!' : 'Upload an image to get started.'}
              </span>
            )}
          </div>
          {generatedImage && (
            <div className="flex gap-3 mt-4 flex-wrap justify-center">
              <button
                onClick={handleShare}
                disabled={isSharing || isLoading || isDownloading}
                className="flex items-center gap-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:hover:bg-dark-neutral-300 text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <ShareIcon />
                Share
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading || isLoading || isSharing}
                className="flex items-center gap-2 bg-base-200 hover:bg-base-300 dark:bg-dark-base-200 dark:hover:bg-dark-base-300 border border-border-color dark:border-dark-border-color text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg transition-colors text-center"
              >
                <DownloadIcon />
                {isDownloading ? 'Downloading...' : 'Download'}
              </button>
              {user && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || isLoading || saveStatus === 'saved'}
                  className="flex items-center gap-2 bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-100 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (saveStatus === 'saved' ? 'Saved!' : 'Save')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded fixed bottom-4 right-4 shadow-lg z-50">
          <p className='font-bold'>Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-content-100 dark:text-dark-content-100 mb-2">Personalization Prompt</h2>
        <textarea
          className="w-full p-2 border border-border-color dark:border-dark-border-color rounded resize-none text-content-100 dark:text-dark-content-100 bg-base-100 dark:bg-dark-base-100"
          rows={3}
          placeholder="Add your own twist to the template prompt (optional)"
          value={personalPrompt}
          onChange={e => setPersonalPrompt(e.target.value)}
        />
        <p className="text-xs text-content-200 dark:text-dark-content-200 mt-1">This will be added to the template&apos;s base prompt for this image only.</p>
        <button
          onClick={handleApplyTemplate}
          disabled={isApplyDisabled}
          className="w-full bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'Applying Template...' : 'Apply Template'}
        </button>
      </div>

      {generatedImage && template && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          imageUrl={generatedImage}
          templateName={template.name}
          shareUrl={shareUrl || undefined}
          templateUrl={templateUrl || undefined}
        />
      )}
    </div>
  );
};

export default ApplyTemplateView;
