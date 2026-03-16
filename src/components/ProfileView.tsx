import React, { useState, useCallback, useEffect } from 'react';
import { User, Share, Outfit, Template } from '../types';
// import { updateUserProfile, uploadProfilePicture, fetchUserOutfits, fetchUserTemplates, fetchUserImages } from '../services/userService';
import { fetchUserOutfits, fetchUserTemplates, fetchUserImages } from '../services/userService';
import { Spinner } from './Spinner'; // Changed to named import
import { DefaultUserIcon, TrashIcon } from './icons';
import OutfitCard from './OutfitCard';
import TemplateCard from './TemplateCard';

interface ProfileViewProps {
  user: User;
  currentUser: User | null;
  onBackToDashboard: () => void;
  onSelectOutfit: (outfit: Outfit) => void;
  onOpenTemplate: (template: Template) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  onBackToDashboard,
  onSelectOutfit,
  onOpenTemplate,
}) => {
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<Share[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [isLoadingOutfits, setIsLoadingOutfits] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const [selectedImage, setSelectedImage] = useState<Share | null>(null);
  const [activeTab, setActiveTab] = useState('outfits');

  const isOwner = currentUser?.uid === user.uid;

  const handleImageClick = (image: Share) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const loadUserData = useCallback(async () => {
    try {
      if (typeof user.uid !== 'string' || !user.uid) {
        throw new Error('User UID is not available or is invalid');
      }

      const [userImages, userOutfits, userTemplates] = await Promise.all([
        fetchUserImages(user.uid),
        fetchUserOutfits(user.uid),
        fetchUserTemplates(user.uid)
      ]);

      setImages(userImages);
      setOutfits(userOutfits);
      setTemplates(userTemplates);

    } catch (err: any) {
      console.error(err);
      setError(prevError => prevError ? `${prevError}\n${err.message}` : `Failed to load your data: ${err.message}`);
    } finally {
      setIsLoadingImages(false);
      setIsLoadingOutfits(false);
      setIsLoadingTemplates(false);
    }
  }, [user.uid]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const getSafeImageUrl = (url: string | undefined): string | undefined => {
    if (!url) {
      return undefined;
    }
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return `data:image/png;base64,${url}`;
  };

  const renderTabs = () => (
    <div className="mb-8 border-b border-border-color dark:border-dark-border-color">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        <button onClick={() => setActiveTab('outfits')} className={`${activeTab === 'outfits' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-content-200 hover:text-content-100 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Outfits</button>
        <button onClick={() => setActiveTab('templates')} className={`${activeTab === 'templates' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-content-200 hover:text-content-100 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Templates</button>
        <button onClick={() => setActiveTab('images')} className={`${activeTab === 'images' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-content-200 hover:text-content-100 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Images</button>
      </nav>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'outfits':
        return (
          <div>
            {(isLoadingImages || isLoadingOutfits) ? <div className="flex justify-center items-center h-48"><Spinner className="h-8 w-8" /></div> : outfits.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {outfits.map((outfit) => (
                  <OutfitCard key={outfit.id} outfit={outfit} onSelect={() => onSelectOutfit(outfit)} />
                ))}
              </div>
            ) : <p className="text-content-200 dark:text-dark-content-200 text-center py-10">This user hasn&apos;t created any outfits yet.</p>}
          </div>
        );
      case 'templates':
        return (
          <div>
            {isLoadingTemplates ? <div className="flex justify-center items-center h-48"><Spinner className="h-8 w-8" /></div> : templates.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => onOpenTemplate(template)}
                    user={currentUser}
                    allowAdminActions={false}
                  />
                ))}
              </div>
            ) : <p className="text-content-200 dark:text-dark-content-200 text-center py-10">This user hasn&apos;t created any templates yet.</p>}
          </div>
        );
      case 'images':
        return (
          <div>
            {isLoadingImages ? <div className="flex justify-center items-center h-48"><Spinner className="h-8 w-8" /></div> : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image) => {
                  const imageUrl = getSafeImageUrl(image.imageUrl || image.image || image.url);
                  if (!imageUrl) return null;

                  return (
                    <div key={image.id} className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleImageClick(image)}>
                      <img src={imageUrl} alt="User generated content" className="w-full h-auto object-cover" />
                      {isOwner && (
                        <div className="absolute top-2 right-2">
                          <button onClick={(e) => { e.stopPropagation(); console.warn("Delete disabled"); }} className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-content-200 dark:text-dark-content-200 text-center py-10">This user hasn&apos;t saved any images yet.</p>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg shadow-lg">

      <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-6 text-center text-content-100 dark:text-dark-content-100">
        {isOwner ? 'Your Profile' : `${user.displayName || 'Anonymous'}'s Profile`}
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
            {user.photoURL ? (
              <img src={user.photoURL} alt="User profile" className="h-32 w-32 rounded-full object-cover shadow-md" />
            ) : (
              <div className="h-32 w-32 rounded-full flex items-center justify-center bg-neutral-200 dark:bg-dark-neutral-200">
                <DefaultUserIcon className="h-24 w-24 text-content-100 dark:text-dark-content-100" />
              </div>
            )}
          </div>
          <div className="w-full">
            <label htmlFor="displayName" className="block text-sm font-medium text-content-200 dark:text-dark-content-200 mb-1">Username</label>
            <input id="displayName" type="text" value={user.displayName || ''} className="w-full px-4 py-2 bg-base-100 dark:bg-dark-base-100 border border-border-color dark:border-dark-border-color rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow" placeholder="Enter your username" disabled />
          </div>
          <div className="w-full">
            <label htmlFor="email" className="block text-sm font-medium text-content-200 dark:text-dark-content-200 mb-1">Email</label>
            <input id="email" type="email" value={user.email || ''} disabled className="w-full px-4 py-2 bg-base-300 dark:bg-dark-base-300 border border-border-color dark:border-dark-border-color rounded-lg cursor-not-allowed" />
          </div>
          {isOwner && (
            <div className="w-full mt-4 space-y-3">
              <p className="text-sm text-content-200 dark:text-dark-content-200">
                Profile editing is read-only for now. You can still browse your templates, outfits, and saved images here.
              </p>
              <div className="flex justify-end">
                <button onClick={onBackToDashboard} className="px-6 py-2 bg-neutral-200 dark:bg-dark-neutral-200 text-content-100 dark:text-dark-content-100 font-bold rounded-lg hover:bg-neutral-300 dark:hover:bg-dark-neutral-300 transition-colors">
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Content Section */}
        <div className="md:col-span-3">
          {renderTabs()}
          {renderContent()}
        </div>
      </div>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={getSafeImageUrl(selectedImage.imageUrl || selectedImage.image || selectedImage.url)}
              alt="Selected user generated content"
              className="max-h-[90vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProfileView;
