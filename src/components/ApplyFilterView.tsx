import React, { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { saveAs } from 'file-saver';
import { applyImageFilter } from '../services/geminiService';
import { shareImage, ShareResult, getFilterUrl } from '../services/shareService';
import { downscale } from '../utils/downscale';
import { getApiBaseUrlRuntime } from '../utils/api';
import { getFilterById } from '../services/firebaseService';
import { Filter, User, ViewState } from '../types';
import { UploadIcon, ShareIcon, DownloadIcon } from './icons';
import ShareModal from './ShareModal';
import FileSaver from '../plugins/file-saver'; // Use the new plugin

interface ApplyFilterViewProps {
  filter?: Filter;
  filterId?: string;
  setViewState: (state: ViewState) => void;
  user: User | null;
}

const ApplyFilterView: React.FC<ApplyFilterViewProps> = ({ filter: initialFilter, filterId, setViewState, user }) => {
  const [filter, setFilter] = useState<Filter | null>(initialFilter || null);
  const [loadingFilter, setLoadingFilter] = useState<boolean>(!!filterId && !initialFilter);
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
  const [isPosting, setIsPosting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [filterUrl, setFilterUrl] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const filterType = filter?.type ?? 'single';
  const filterPrompt = filter?.prompt ?? '';

  useEffect(() => {
    const fetchFilter = async () => {
      if (filterId && !filter) {
        setLoadingFilter(true);
        try {
          const fetchedFilter = await getFilterById(filterId);
          if (fetchedFilter) {
            setFilter(fetchedFilter);
          } else {
            throw new Error("Filter not found");
          }
        } catch (err) {
          console.error("❌ Error fetching filter:", err);
          setError(err instanceof Error ? err.message : "Could not fetch filter");
        } finally {
          setLoadingFilter(false);
        }
      }
    };
    fetchFilter();
  }, [filterId, filter]);

  const handleApplyFilter = useCallback(async () => {
    setError(null);
    setSaveStatus('idle');

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
      const combinedPrompt = personalPrompt ? `${filterPrompt}\n${personalPrompt}` : filterPrompt;
      const result = await applyImageFilter(imagesToProcess, combinedPrompt, isNative ? undefined : "filtered");
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
  }, [uploadedImage1, uploadedImage2, filterPrompt, filterType, personalPrompt, isNative]);

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
        } catch (parseError) {
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
    if (!generatedImage) return;

    setIsSharing(true);
    setError(null);

    try {
      if (isNative) {
        // Generate filter URL for sharing
        if (!filter) { console.error("No filter given"); return; }
        const generatedFilterUrl = getFilterUrl(filter.id);
        setFilterUrl(generatedFilterUrl);
        
        // Convert image to base64 if needed (handle both data URLs and HTTP URLs)
        let base64Data: string;
        if (generatedImage.startsWith('data:')) {
          base64Data = generatedImage.split(',')[1];
        } else if (generatedImage.startsWith('http')) {
          // Fetch HTTP URL and convert to base64
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
        
        // Write image file to cache directory so it can be shared
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        // Create an inviting message with the filter link
        // The text will include the filter link so both image and link are shared
        const shareText = `🎨 Check out this image I created with the "${filter.name}" filter on Genie!\n\n✨ Try this filter yourself:\n${generatedFilterUrl}\n\nCreate amazing images with AI filters! 🚀`;
        
        // On Android, use the file URI so the image is attached AND include the filter link in the text
        // This ensures both the image and the filter link are shared together
        await Share.share({
          title: `Try the "${filter.name}" Filter on Genie`,
          text: shareText, // Filter link is included in the text
          url: result.uri, // Use file URI so the image is attached to the share
          dialogTitle: 'Share Image & Filter',
        });

      } else {
        // Use the generated image directly - shareImage can handle both data URLs and HTTP URLs
        // No need to save to Firebase first, as shareImage will upload to R2 anyway
        if (!filter) { console.error("No filter given"); return; }
        
        // Ensure we have a usable image URL
        let imageToShare = generatedImage;
        
        // If the image is already a URL (from R2/Firebase), use it directly
        // If it's a data URL, shareImage will handle it
        // If it needs to be converted, convert it
        if (!imageToShare.startsWith('data:') && !imageToShare.startsWith('http')) {
          // This shouldn't happen, but convert to data URL just in case
          imageToShare = await fetchImageAsBase64(imageToShare);
        }

        const result: ShareResult = await shareImage(imageToShare, filter, user);
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
  }, [generatedImage, filter, user, handleSave, isNative]);

  const handleDownload = useCallback(async () => {
    if (!generatedImage) return;

    setIsDownloading(true);
    setError(null);

    try {
      if (isNative) {
        console.log('[Download] Starting download on native platform');
        console.log('[Download] Generated image type:', generatedImage.startsWith('data:') ? 'data URL' : 'URL');
        console.log('[Download] Generated image preview:', generatedImage.substring(0, 100));
        
        // Convert URL to data URL if needed (for Android download)
        let dataUrl = generatedImage;
        if (!generatedImage.startsWith('data:')) {
          console.log('[Download] Fetching image from URL to convert to data URL...');
          dataUrl = await fetchImageAsBase64(generatedImage);
          console.log('[Download] Image converted to data URL, length:', dataUrl.length);
        }
        
        console.log('[Download] Calling FileSaver plugin...');
        const result = await FileSaver.saveBase64ToDownloads({
          dataUrl: dataUrl,
        });
        console.log('[Download] FileSaver plugin success:', result);
        alert("Image saved to Downloads!");
        
      } else {
        // Web download using file-saver
        // Convert image to Blob if needed (saveAs requires Blob/File, not data URL or HTTP URL)
        let blob: Blob;
        
        if (generatedImage.startsWith('data:')) {
          // Convert data URL to Blob
          const response = await fetch(generatedImage);
          blob = await response.blob();
        } else if (generatedImage.startsWith('http')) {
          // Fetch HTTP URL and convert to Blob
          const response = await fetch(generatedImage);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }
          blob = await response.blob();
        } else {
          // If it's already a Blob (unlikely), use it directly
          throw new Error('Invalid image format for download');
        }
        
        // Generate filename with proper extension based on blob type
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        let filename = generatedImageFilename || `genie-${timestamp}-${randomId}`;
        
        // Ensure filename has proper extension
        if (!filename.includes('.')) {
          // Determine extension from blob MIME type
          const extension = blob.type.includes('webp') ? '.webp' 
            : blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg'
            : '.png';
          filename = `${filename}${extension}`;
        }
        
        saveAs(blob, filename);
      }
    } catch (err) {
      console.error("[Download] Download error:", err);
      console.error("[Download] Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      setError(err instanceof Error ? `Download failed: ${err.message}` : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  }, [generatedImage, generatedImageFilename, isNative]);


  const isApplyDisabled = isLoading || !uploadedImage1 || (filterType === 'merge' && !uploadedImage2);

  if (loadingFilter) {
    return <div className="text-center mt-10">Loading filter...</div>;
  }

  if (!filter) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500">Filter not found.</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-content-100 dark:text-dark-content-100 mb-2">{filter.name}</h1>
        <p className="text-content-200 dark:text-dark-content-200">{filter.description}</p>
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
          {filterType === 'merge' && (
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
                <span className="text-content-200 dark:text-dark-content-200">Applying filter...</span>
              </div>
            ) : generatedImage ? (
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Filtered result"
                  className="max-w-full max-h-96 object-contain rounded shadow-lg"
                />
                <div 
                  className="absolute inset-0 bg-transparent"
                  onContextMenu={(e) => e.preventDefault()}
                ></div>
              </div>
            ) : (
              <span className="text-content-200 dark:text-dark-content-200">
                {uploadedImage1 ? 'Ready to apply filter!' : 'Upload an image to get started.'}
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
                {isNative ? (isDownloading ? 'Saving...' : 'Save') : (isDownloading ? 'Downloading...' : 'Download')}
              </button>
              {!isNative && (
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
          placeholder="Add your own twist to the filter prompt (optional)"
          value={personalPrompt}
          onChange={e => setPersonalPrompt(e.target.value)}
        />
        <p className="text-xs text-content-200 dark:text-dark-content-200 mt-1">This will be added to the filter&apos;s base prompt for this image only.</p>
        <button
          onClick={handleApplyFilter}
          disabled={isApplyDisabled}
          className="w-full bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? 'Applying Filter...' : 'Apply Filter'}
        </button>
      </div>

      {generatedImage && filter && !isNative && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          imageUrl={generatedImage}
          filterName={filter.name}
          shareUrl={shareUrl || undefined}
          filterUrl={filterUrl || undefined}
        />
      )}
    </div>
  );
};

export default ApplyFilterView;
