import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { User, Share, Outfit, Filter } from '../types';
import { updateUserProfile, uploadProfilePicture, fetchUserImages, fetchUserOutfits, fetchUserFilters, deleteUserImage } from '../services/userService';
import { getValidIdToken } from '../services/authService';
import Spinner from './Spinner';
import { DefaultUserIcon, TrashIcon } from './icons';
import OutfitCard from './OutfitCard';
import FilterCard from './FilterCard';
import ConfirmationDialog from './ConfirmationDialog';

interface ProfileViewProps {
  user: User;
  setViewState: (view: any) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setViewState }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [images, setImages] = useState<Share[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);

  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);


  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<Share | null>(null);

  const handleImageClick = (image: Share) => {
    setSelectedImage(image);
    setDownloadError(null); // Reset error when opening a new image
  };

  const closeModal = () => {
      setSelectedImage(null);
      setDownloadError(null);
  }

  const loadUserData = useCallback(async () => {
    try {
      const idToken = await getValidIdToken();
      if (!idToken) throw new Error('Session expired');
      
      if (typeof user.uid !== 'string' || !user.uid) {
        throw new Error('User UID is not available or is invalid');
      }

      const [userImages, userOutfits, userFilters] = await Promise.all([
        fetchUserImages(user.uid, idToken),
        fetchUserOutfits(user.uid, idToken),
        fetchUserFilters(user.uid, idToken)
      ]);

      setImages(userImages);
      setOutfits(userOutfits);
      setFilters(userFilters);

    } catch (err: any) {
      console.error(err);
      setError(prevError => prevError ? `${prevError}\n${err.message}` : `Failed to load your data: ${err.message}`);
    } finally {
      setIsLoadingImages(false);
      setIsLoadingOutfits(false);
      setIsLoadingFilters(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfilePic(e.target.files[0]);
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      const idToken = await getValidIdToken();
      if (!idToken) throw new Error('Session expired');

      let photoURL = user.photoURL;
      if (newProfilePic) {
        photoURL = await uploadProfilePicture(user.uid, newProfilePic, idToken);
      }

      await updateUserProfile(user.uid, { displayName, photoURL }, idToken);
      
      setViewState({ view: 'marketplace' });
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, displayName, newProfilePic, setViewState]);

  const handleDeleteImage = async (imageId: string) => {
    try {
      const idToken = await getValidIdToken();
      if (!idToken) throw new Error('Session expired');
      await deleteUserImage(imageId, idToken);
      setImages(images.filter(image => image.id !== imageId));
    } catch (err: any) {
      setError(`Failed to delete image: ${err.message}`);
    }
    setShowDeleteConfirm(null);
  };

  const handleDownload = async () => {
    if (!selectedImage) return;
  
    setIsDownloading(true);
    setDownloadError(null);
    try {
      // Use fetch to get the image data
      const response = await fetch(selectedImage.imageUrl);
      if (!response.ok) {
        // This will be triggered by network errors or non-2xx responses (like 404)
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      // Use the blob's type to be more accurate, or default to png
      const extension = blob.type.split('/')[1] || 'png';
      const filename = `image-${timestamp}-${randomId}.${extension}`;
  
      // Create a temporary link to trigger the download
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(a.href); // Clean up the object URL
    } catch (err) {
        console.error("Download failed:", err);
        // This is the crucial part: if fetch fails due to CORS, the error will be caught here.
        setDownloadError("Automatic download failed. This is likely due to a server security policy (CORS). Please use the 'Open in New Tab' button to save the image manually.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isSaveDisabled = 
    (displayName === (user.displayName || '') && !newProfilePic) || isSaving;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg shadow-lg">
      {showDeleteConfirm && (
        <ConfirmationDialog
          title="Delete Image"
          message="Are you sure you want to permanently delete this image? This action cannot be undone."
          onConfirm={() => {
              handleDeleteImage(showDeleteConfirm);
              closeModal();
          }}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="relative bg-base-100 dark:bg-dark-base-100 p-4 rounded-lg shadow-xl max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.imageUrl} alt="Full view" className="w-full h-auto object-contain max-h-[75vh] rounded"/>
            <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex justify-center gap-4">
                    <button onClick={handleDownload} disabled={isDownloading} className="px-6 py-2 bg-brand-primary text-white font-bold rounded-lg hover:bg-brand-secondary transition-colors flex items-center justify-center w-36">
                        {isDownloading ? <Spinner className="h-5 w-5" /> : 'Download'}
                    </button>
                    <a href={selectedImage.imageUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors inline-block text-center w-36">
                        Open in New Tab
                    </a>
                    <button onClick={() => {
                        setShowDeleteConfirm(selectedImage.id);
                    }} className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors w-36">
                        Delete
                    </button>
                </div>
                {downloadError && (
                    <p className="text-red-500 text-sm mt-2 text-center">{downloadError}</p>
                )}
            </div>
            <button onClick={closeModal} className="absolute top-2 right-2 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-6 text-center text-content-100 dark:text-dark-content-100">
        Your Profile
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline whitespace-pre-line">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Profile Info Section */}
        <div className="md:col-span-1 flex flex-col items-center gap-6">
          <div className="relative">
            {newProfilePic ? (
              <img src={URL.createObjectURL(newProfilePic)} alt="New profile preview" className="h-32 w-32 rounded-full object-cover shadow-md" />
            ) : user.photoURL ? (
              <img src={user.photoURL} alt="User profile" className="h-32 w-32 rounded-full object-cover shadow-md" />
            ) : (
              <div className="h-32 w-32 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-dark-neutral-200">
                <DefaultUserIcon className="h-24 w-24 text-content-100 dark:text-dark-content-100" />
              </div>
            )}
            <label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 bg-brand-primary text-white p-2 rounded-full cursor-pointer hover:bg-brand-secondary transition-colors shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input id="profile-pic-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <div className="w-full">
            <label htmlFor="displayName" className="block text-sm font-medium text-content-200 dark:text-dark-content-200 mb-1">Username</label>
            <input id="displayName" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-2 bg-base-100 dark:bg-dark-base-100 border border-border-color dark:border-dark-border-color rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow" placeholder="Enter your username" />
          </div>
          <div className="w-full">
            <label htmlFor="email" className="block text-sm font-medium text-content-200 dark:text-dark-content-200 mb-1">Email</label>
            <input id="email" type="email" value={user.email || ''} disabled className="w-full px-4 py-2 bg-base-300 dark:bg-dark-base-300 border border-border-color dark:border-dark-border-color rounded-lg cursor-not-allowed" />
          </div>
          <div className="w-full mt-4 flex justify-end gap-4">
            <button onClick={() => setViewState({ view: 'marketplace' })} className="px-6 py-2 bg-neutral-200 dark:bg-dark-neutral-200 text-content-100 dark:text-dark-content-100 font-bold rounded-lg hover:bg-neutral-300 dark:hover:bg-dark-neutral-300 transition-colors" disabled={isSaving}>Cancel</button>
            <button onClick={handleSave} className={`px-6 py-2 font-bold rounded-lg transition-all flex items-center justify-center ${isSaveDisabled ? 'bg-neutral-300 dark:bg-dark-neutral-300 text-content-200 dark:text-dark-content-200 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-secondary text-white'}`} disabled={isSaveDisabled}>
              {isSaving ? <Spinner className="h-5 w-5" /> : 'Save'}
            </button>
          </div>
        </div>

        {/* User Content Section */}
        <div className="md:col-span-3">
            {/* Outfits Section */}
            <div className="mb-8">
                <h3 className="text-xl font-bold font-heading mb-4 text-content-100 dark:text-dark-content-100">My Outfits</h3>
                {isLoadingOutfits ? <div className="flex justify-center items-center h-48"><Spinner className="h-8 w-8" /></div> : outfits.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {outfits.map((outfit) => (
                            <OutfitCard key={outfit.id} outfit={outfit} onSelect={() => setViewState({view: 'applyOutfit', outfit: outfit})} />
                        ))}
                    </div>
                ) : <p className="text-content-200 dark:text-dark-content-200">You haven&apos;t created any outfits yet.</p>}
            </div>

            {/* Filters Section */}
            <div className="mb-8">
                <h3 className="text-xl font-bold font-heading mb-4 text-content-100 dark:text-dark-content-100">My Filters</h3>
                {isLoadingFilters ? <div className="flex justify-center items-center h-48"><Spinner className="h-8 w-8" /></div> : filters.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {filters.map((filter) => (
                            <FilterCard key={filter.id} filter={filter} onSelect={() => setViewState({view: 'apply', filter: filter})} onEdit={() => setViewState({ view: 'edit', filter: filter })} user={user} onDelete={async () => {}} />
                        ))}
                    </div>
                ) : <p className="text-content-200 dark:text-dark-content-200">You haven&apos;t created any filters yet.</p>}
            </div>

            {/* Images Section */}
            <div>
                <h3 className="text-xl font-bold font-heading mb-4 text-content-100 dark:text-dark-content-100">My Images</h3>
                {isLoadingImages ? <div className="flex justify-center items-center h-48"><Spinner className="h-8 w-8" /></div> : images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <div key={image.id} className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleImageClick(image)}>
                                <img src={image.imageUrl} alt="User generated content" className="w-full h-auto object-cover"/>
                                <div className="absolute top-2 right-2">
                                    <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(image.id); }} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-content-200 dark:text-dark-content-200">You haven&apos;t created any images yet.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
