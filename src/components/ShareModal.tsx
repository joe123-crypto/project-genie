import React from "react";
import { DownloadIcon, WhatsAppIcon } from "./icons";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;       // 👈 preview image (R2 link or base64)
  filterName: string;
  shareUrl?: string;       // 👈 canonical share link (/shared/:id)
  filename?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  filterName,
  shareUrl,
  filename,
}) => {
  if (!isOpen) return null;
  //console.log(shareUrl);
  const shareText = `Check out this image I created with the "${filterName}" filter!\n${shareUrl}`;
  const encodedText = encodeURIComponent(shareText);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

  const downloadFilename =
    filename ||
    `filtered-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.png`;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-base-200 dark:bg-dark-base-200 rounded-2xl shadow-2xl p-6 w-full max-w-md text-center transform transition-all duration-300 scale-95 hover:scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">
            Share Image
          </h3>
          <button
            onClick={onClose}
            className="text-content-200 dark:text-dark-content-200 hover:text-content-100 dark:hover:text-dark-content-100 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <img
          src={imageUrl}
          alt={`Image with ${filterName} filter applied`}
          className="w-full aspect-square object-contain rounded-lg mb-4 bg-base-300 dark:bg-dark-base-300"
        />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
          >
            <WhatsAppIcon />
            Share to WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
