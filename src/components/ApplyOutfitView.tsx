import React, { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { saveAs } from 'file-saver';
import { mergeImages } from '../services/geminiService';
import { shareImage, ShareResult, getFilterUrl } from '../services/shareService';
import { downscale } from '../utils/downscale';
import { getApiBaseUrlRuntime } from '../utils/api';
import { Outfit, User } from '../types';
import { UploadIcon, ShareIcon, DownloadIcon } from './icons';
import ShareModal from './ShareModal';
import FileSaver from '../plugins/file-saver';
import { scheduleNotification } from '../utils/notificationUtils';

interface ApplyOutfitViewProps {
  outfit: Outfit;
  user: User | null;
}

const ApplyOutfitView: React.FC<ApplyOutfitViewProps> = ({ outfit, user }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageFilename, setGeneratedImageFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [isNative, setIsNative] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [filterUrl, setFilterUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

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

  const handleApplyOutfit = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedImageFilename(null);
    setSaveStatus('idle');

    try {
      const result = await mergeImages([uploadedImage, outfit.previewImageUrl], outfit.prompt, "filtered");
      setGeneratedImage(result);

      await scheduleNotification('Outfit Ready', `Your outfit using "${outfit.name}" is ready!`);

      if (result && result.includes('r2.dev')) {
        const keyStart = result.indexOf("filtered/");
        if (keyStart !== -1) {
          const key = result.substring(keyStart);
          setGeneratedImageFilename(key);
        } else {
          const urlParts = result.split('/');
          setGeneratedImageFilename(urlParts[urlParts.length - 1]);
        }
      } else {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        setGeneratedImageFilename(`filtered-${timestamp}-${randomId}.png`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedImage, outfit.previewImageUrl, outfit.prompt]);

  const handleSave = useCallback(async () => {
    if (!generatedImage || !user) return;
    if (generatedImageFilename?.startsWith('saved/')) {
      setSaveStatus('saved');
      return;
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

      // 2. Downscale the image
      console.log('[Save] Downscaling image before upload...');
      let downscaledBase64: string;
      try {
        downscaledBase64 = await downscale(imageDataUrl, 1024, 'webp', 0.8);
      } catch (downscaleError) {
        console.error('[Save] Downscale failed:', downscaleError);
        downscaledBase64 = await downscale(imageDataUrl, 1024, 'png', 1.0);
      }

      const downscaledDataUrl = downscaledBase64.startsWith('data:')
        ? downscaledBase64
        : `data:image/webp;base64,${downscaledBase64}`;

      // 3. Generate filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const directoryName = `${user.uid}/${timestamp}-${randomId}`;

      // 4. Upload to R2
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
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      const savedImageUrl = uploadData.url;

      if (savedImageUrl) {
        setGeneratedImage(savedImageUrl);
        setGeneratedImageFilename(savedImageUrl.substring(savedImageUrl.indexOf("saved/")));
        setSaveStatus('saved');
      }

    } catch (err: unknown) {
      console.error('[Save] Save error:', err);
      setError(err instanceof Error ? `Save failed: ${err.message}` : 'An unknown error occurred while saving.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [generatedImage, generatedImageFilename, user]);

  const handleShare = useCallback(async () => {
    if (!generatedImage) return;

    setIsSharing(true);
    setError(null);

    try {
      if (isNative) {
        const generatedFilterUrl = getFilterUrl(outfit.id);
        setFilterUrl(generatedFilterUrl);

        let base64Data: string;
        if (generatedImage.startsWith('data:')) {
          base64Data = generatedImage.split(',')[1];
        } else if (generatedImage.startsWith('http')) {
          const response = await fetch(generatedImage);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          base64Data = dataUrl.split(',')[1];
        } else {
          base64Data = generatedImage;
        }

        const fileName = `genie-share-${Date.now()}.png`;

        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        const shareText = `🎨 Check out this outfit I created with "${outfit.name}" on Genie!\n\n✨ Try it yourself:\n${generatedFilterUrl}\n\nCreate amazing images with AI! 🚀`;

        await Share.share({
          title: `Try "${outfit.name}" on Genie`,
          text: shareText,
          url: result.uri,
          dialogTitle: 'Share Outfit',
        });

      } else {
        // Web share
        const result: ShareResult = await shareImage(generatedImage, outfit as any, user);
        setShareUrl(result.shareUrl);
        if (result.filterUrl) {
          setFilterUrl(result.filterUrl);
        }
        if (result.status === 'modal') {
          setIsShareModalOpen(true);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? `Sharing failed: ${err.message}` : 'Unknown error');
    } finally {
      setIsSharing(false);
    }
  }, [generatedImage, outfit, user, isNative]);

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;

    setIsDownloading(true);
    setError(null);

    try {
      if (isNative) {
        let dataUrl = generatedImage;
        if (!generatedImage.startsWith('data:')) {
          dataUrl = await fetchImageAsBase64(generatedImage);
        }

        const result = await FileSaver.saveBase64ToDownloads({
          dataUrl: dataUrl,
        });
        console.log('[Download] FileSaver plugin success:', result);
        alert("Image saved to Downloads!");

      } else {
        // Web download
        let blob: Blob;
        if (generatedImage.startsWith('data:')) {
          const response = await fetch(generatedImage);
          blob = await response.blob();
        } else if (generatedImage.startsWith('http')) {
          const response = await fetch(generatedImage);
          blob = await response.blob();
        } else {
          throw new Error('Invalid image format');
        }

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        let filename = generatedImageFilename || `genie-outfit-${timestamp}-${randomId}`;

        if (!filename.includes('.')) {
          const extension = blob.type.includes('webp') ? '.webp'
            : blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg'
              : '.png';
          filename = `${filename}${extension}`;
        }

        saveAs(blob, filename);
      }
    } catch (err) {
      console.error("[Download] Download error:", err);
      setError(err instanceof Error ? `Download failed: ${err.message}` : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  }, [generatedImage, generatedImageFilename, isNative]);

  const isApplyDisabled = isLoading || !uploadedImage;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in flex flex-col gap-6 p-4">

      {/* Main content card */}
      <div className="bg-base-200 dark:bg-dark-base-200 p-4 sm:p-6 rounded-lg shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100 mb-2">
          {outfit.name}
          {outfit.type && <span className="text-lg font-light">-{outfit.type}</span>}
        </h1>
        {outfit.description && <p className="text-content-200 dark:text-dark-content-200 mb-4">{outfit.description}</p>}

        <div className="aspect-video w-full bg-base-300 dark:bg-dark-base-300 rounded-lg flex items-center justify-center overflow-hidden mb-4">
          <img src={outfit.previewImageUrl} alt="Filter Preview" className="object-contain max-h-full max-w-full" />
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
          {uploadedImage && <img src={uploadedImage} alt="User upload preview" className="mt-4 max-w-full max-h-48 object-contain rounded-md shadow" />}
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
              <img src={generatedImage} alt="Generated outfit result" className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg" />
            )}
          </div>

          {generatedImage && (
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              <button
                onClick={handleShare}
                disabled={isSharing || isLoading || isDownloading}
                className="flex items-center gap-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-dark-neutral-200 dark:hover:bg-dark-neutral-300 text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg shadow disabled:opacity-50"
              >
                <ShareIcon /> Share
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading || isLoading || isSharing}
                className="flex items-center gap-2 bg-base-300 hover:bg-base-400 dark:bg-dark-base-300 dark:hover:bg-dark-base-400 text-content-100 dark:text-dark-content-100 font-bold py-2 px-4 rounded-lg shadow disabled:opacity-50"
              >
                <DownloadIcon />
                {isNative ? (isDownloading ? 'Saving...' : 'Save') : (isDownloading ? 'Downloading...' : 'Download')}
              </button>
              {!isNative && user && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || saveStatus === 'saved'}
                  className="flex items-center gap-2 bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700 text-green-900 dark:text-green-100 font-bold py-2 px-4 rounded-lg shadow disabled:opacity-60"
                >
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
          shareUrl={shareUrl || undefined}
          filterUrl={filterUrl || undefined}
        />
      )}
    </div>
  );
};

export default ApplyOutfitView;
