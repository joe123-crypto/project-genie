
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
            className="studio-icon-button h-11 w-11 cursor-pointer rounded-full object-cover p-0"
          />
        ) : (
          <div className="studio-icon-button h-11 w-11 cursor-pointer">
            <DefaultUserIcon className="h-6 w-6" />
          </div>
        )}
      </button>
      {dropdownOpen && (
        <div className="studio-panel absolute right-0 z-50 mt-3 w-56 rounded-[1.5rem] p-2">
          <div className="px-4 py-3">
            <p className="truncate text-sm font-semibold text-content-100 dark:text-dark-content-100">
              {user.displayName || user.username || 'Your profile'}
            </p>
            <p className="truncate text-xs text-content-300 dark:text-dark-content-300">
              {user.email}
            </p>
          </div>
          <button
            onClick={() => {
              onGoToProfile();
              setDropdownOpen(false);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-content-100 transition-colors hover:bg-base-200 dark:text-dark-content-100 dark:hover:bg-dark-base-200"
          >
            Profile
          </button>
          <button
            onClick={() => {
              onSignOut();
              setDropdownOpen(false);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-content-100 transition-colors hover:bg-base-200 dark:text-dark-content-100 dark:hover:bg-dark-base-200"
          >
            Sign Out
          </button>
          <div className="my-2 border-t border-border-color dark:border-dark-border-color"></div>
          <button
            onClick={() => {
              onRemoveAccount();
              setDropdownOpen(false);
            }}
            className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Remove Account
          </button>
        </div>
      )}
    </div>
  );
};

export default UserIcon;
