
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { DefaultUserIcon } from './icons';

interface UserIconProps {
  user: User;
  onSignOut: () => void;
  onGoToProfile: () => void;
  onRemoveAccount: () => void;
}

const UserIcon: React.FC<UserIconProps> = ({ user, onSignOut, onGoToProfile, onRemoveAccount }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="focus:outline-none">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt="User profile"
            className="h-8 w-8 rounded-full cursor-pointer"
          />
        ) : (
          <div className="h-8 w-8 rounded-full cursor-pointer flex items-center justify-center bg-neutral-200 dark:bg-dark-neutral-200 hover:bg-neutral-300 dark:hover:bg-dark-neutral-300 transition-colors">
            <DefaultUserIcon className="h-6 w-6 text-content-100 dark:text-dark-content-100" />
          </div>
        )}
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-base-100 dark:bg-dark-base-100 rounded-md shadow-lg py-1 z-50">
          <button
            onClick={() => {
              onGoToProfile();
              setDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-content-100 dark:text-dark-content-100 hover:bg-base-200 dark:hover:bg-dark-base-200"
          >
            Profile
          </button>
          <button
            onClick={() => {
              onSignOut();
              setDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-content-100 dark:text-dark-content-100 hover:bg-base-200 dark:hover:bg-dark-base-200"
          >
            Sign Out
          </button>
          <div className="border-t border-border-color dark:border-dark-border-color my-1"></div>
          <button
            onClick={() => {
              onRemoveAccount();
              setDropdownOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-base-200 dark:hover:bg-dark-base-200"
          >
            Remove Account
          </button>
        </div>
      )}
    </div>
  );
};

export default UserIcon;
