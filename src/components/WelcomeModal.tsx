import React from 'react';
import { DollarIcon } from './icons';
import { commonClasses, themeColors } from '../utils/theme';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`${themeColors.base.light[200]} ${themeColors.base.dark[200]} rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md text-center transform transition-all duration-300`}
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
        style={{ animation: 'scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        {/* Icon container */}
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${themeColors.brand.light.primary.replace('bg-', 'bg-opacity-20')} ${themeColors.brand.dark.primary.replace('dark:bg-', 'dark:bg-opacity-20')} mb-4`}>
          <DollarIcon className={`h-8 w-8 ${themeColors.brand.light.primary.replace('bg-', 'text-')} ${themeColors.brand.dark.primary.replace('dark:bg-', 'dark:text-')}`} />
        </div>

        {/* Title */}
        <h3 className={`text-2xl ${commonClasses.text.heading} mb-3`}>
          Welcome to the Creator Program!
        </h3>

        {/* Description */}
        <p className={`${commonClasses.text.body} mb-6`}>
          If your filter stays in the{' '}
          <span className={commonClasses.text.heading}>Trending</span> section for 10 days,
          you get a commission of{' '}
          <span className={commonClasses.text.heading}>$0.25</span> per day.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className={`w-full sm:w-auto ${commonClasses.button.primary} py-3 px-8 transform hover:scale-105 shadow-lg`}
          aria-label="Close welcome message"
        >
          Start Creating!
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeModal;