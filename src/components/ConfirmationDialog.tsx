
import React from 'react';

interface ConfirmationDialogProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 dark:bg-dark-base-100 p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        {title && <h3 className="text-lg font-bold mb-4 text-content-100 dark:text-dark-content-100">{title}</h3>}
        <p className="text-content-100 dark:text-dark-content-100 mb-4">{message}</p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 bg-neutral-200 dark:bg-dark-neutral-200 text-content-100 dark:text-dark-content-100 font-bold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
