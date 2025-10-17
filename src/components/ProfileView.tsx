
import React, { useState, useCallback, ChangeEvent } from 'react';
import { User } from '../types';
import { updateUserProfile, uploadProfilePicture } from '../services/userService';
import { getValidIdToken } from '../services/authService';
import Spinner from './Spinner';
import { DefaultUserIcon } from './icons';

interface ProfileViewProps {
  user: User;
  setViewState: (view: any) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setViewState }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      // TODO: Update user session with new info

      setViewState({ view: 'marketplace' });
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [user, displayName, newProfilePic, setViewState]);

  const isSaveDisabled = 
    (displayName === (user.displayName || '') && !newProfilePic) || isSaving;

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 md:p-8 bg-base-200 dark:bg-dark-base-200 rounded-lg shadow-lg">
      <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-6 text-center text-content-100 dark:text-dark-content-100">
        Your Profile
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {newProfilePic ? (
            <img
              src={URL.createObjectURL(newProfilePic)}
              alt="New profile preview"
              className="h-32 w-32 rounded-full object-cover shadow-md"
            />
          ) : user.photoURL ? (
            <img
              src={user.photoURL}
              alt="User profile"
              className="h-32 w-32 rounded-full object-cover shadow-md"
            />
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
          <label htmlFor="displayName" className="block text-sm font-medium text-content-200 dark:text-dark-content-200 mb-1">
            Username
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 bg-base-100 dark:bg-dark-base-100 border border-border-color dark:border-dark-border-color rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-shadow"
            placeholder="Enter your username"
          />
        </div>
        
        <div className="w-full">
          <label htmlFor="email" className="block text-sm font-medium text-content-200 dark:text-dark-content-200 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user.email || ''}
            disabled
            className="w-full px-4 py-2 bg-base-300 dark:bg-dark-base-300 border border-border-color dark:border-dark-border-color rounded-lg cursor-not-allowed"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={() => setViewState({ view: 'marketplace' })}
          className="px-6 py-2 bg-neutral-200 dark:bg-dark-neutral-200 text-content-100 dark:text-dark-content-100 font-bold rounded-lg hover:bg-neutral-300 dark:hover:bg-dark-neutral-300 transition-colors"
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className={`px-6 py-2 font-bold rounded-lg transition-all flex items-center justify-center ${isSaveDisabled ? 'bg-neutral-300 dark:bg-dark-neutral-300 text-content-200 dark:text-dark-content-200 cursor-not-allowed' : 'bg-brand-primary hover:bg-brand-secondary text-white'}`}
          disabled={isSaveDisabled}
        >
          {isSaving ? <Spinner className="h-5 w-5" /> : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
