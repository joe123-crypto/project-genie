import React, { useState, useCallback } from 'react';
import { Share } from '../types';
import Spinner from './Spinner';
import ConfirmationDialog from './ConfirmationDialog';
import { TrashIcon } from './icons';
import { getValidIdToken } from '../services/authService';
import { deleteUserImage } from '../services/userService';

interface PostViewProps {
  selectedImage: Share;
  onClose: () => void;
  isOwner: boolean;
  onDelete: (imageId: string) => void;
  onCreateYourOwn: (filterId: string) => void;
}

const PostView: React.FC<PostViewProps> = ({ selectedImage, onClose, isOwner, onDelete, onCreateYourOwn }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);


  const handleDeleteImage = async (imageId: string) => {
    try {
      const idToken = await getValidIdToken();
      if (!idToken) throw new Error('Session expired');
      await deleteUserImage(imageId, idToken);
      onDelete(imageId);
    } catch (err: any) {
      // How to handle error display here? Maybe pass a callback
      console.error(`Failed to delete image: ${err.message}`);
    }
    setShowDeleteConfirm(null);
  };

  const handleDownload = useCallback(async () => {
    if (!selectedImage) return;

    setIsDownloading(true);
    setDownloadError(null);
    
    let objectUrl: string | null = null;

    try {
      const response = await fetch('/api/v2/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: selectedImage.imageUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download.png';
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=\"?(.+)\"?/i);
          if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
          }
      }

      const link = document.createElement('a');
      objectUrl = URL.createObjectURL(blob);
      
      link.href = objectUrl;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error("Download failed:", err);
      setDownloadError(err instanceof Error ? err.message : "An unknown error occurred during download.");
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIsDownloading(false);
    }
  }, [selectedImage]);

  return (
    <>
      {showDeleteConfirm && (
        <ConfirmationDialog
          title="Delete Image"
          message="Are you sure you want to permanently delete this image? This action cannot be undone."
          onConfirm={() => {
              if(selectedImage) {
                handleDeleteImage(selectedImage.id);
              }
              onClose();
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
        <div className="relative bg-base-100 dark:bg-dark-base-100 p-4 rounded-lg shadow-xl max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
          <img src={selectedImage.imageUrl} alt="Full view" className="w-full h-auto object-contain max-h-[75vh] rounded"/>
          <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex justify-center gap-4">
                  <button onClick={handleDownload} disabled={isDownloading} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors flex items-center justify-center w-36">
                      {isDownloading ? <Spinner className="h-5 w-5" /> : 'Download'}
                  </button>
                  <button 
                    onClick={() => selectedImage.filterId && onCreateYourOwn(selectedImage.filterId)}
                    disabled={!selectedImage.filterId}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors w-36 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={!selectedImage.filterId ? "This post was not created with a reusable filter." : "Create your own image with this filter"}
                  >
                      Create Your Own
                  </button>
                  {isOwner && (
                    <button onClick={() => {
                        setShowDeleteConfirm(selectedImage.id);
                    }} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors w-36">
                        Delete
                    </button>
                  )}
              </div>
              {downloadError && (
                  <p className="text-red-500 text-sm mt-2 text-center">{downloadError}</p>
              )}
          </div>
          <button onClick={onClose} className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default PostView;