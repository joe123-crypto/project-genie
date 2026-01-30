import React, { useState } from "react";
import { WhatsAppIcon, XIcon, LinkedInIcon, FacebookIcon, InstagramIcon } from "./icons";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;       // 👈 preview image (R2 link or base64)
  templateName: string;
  shareUrl?: string;       // 👈 canonical share link (/shared/:id)
  templateUrl?: string;      // 👈 URL to the template that created the image
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  templateName,
  shareUrl,
  templateUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Use template URL if available, otherwise fall back to share URL or image URL
  const primaryUrl = templateUrl || shareUrl || imageUrl;
  const shareText = templateUrl
    ? `Check out this image I created with the "${templateName}" template! Try it yourself: ${templateUrl}`
    : `Check out this image I created with the "${templateName}" template!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(primaryUrl);

  const handleCopyTemplateLink = async () => {
    if (templateUrl) {
      try {
        await navigator.clipboard.writeText(templateUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const instagramUrl = `https://www.instagram.com/`;

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
          alt={`Image with ${templateName} template applied`}
          className="w-full aspect-square object-contain rounded-lg mb-4 bg-base-300 dark:bg-dark-base-300"
        />

        {/* Template Link (if available) */}
        {templateUrl && (
          <div className="mb-4 p-3 bg-base-100 dark:bg-dark-base-100 rounded-lg border border-border-color dark:border-dark-border-color">
            <p className="text-sm text-content-200 dark:text-dark-content-200 mb-2">
              Try this template yourself:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={templateUrl}
                className="flex-1 px-3 py-2 text-xs bg-base-200 dark:bg-dark-base-200 text-content-100 dark:text-dark-content-100 rounded border border-border-color dark:border-dark-border-color font-mono truncate"
              />
              <button
                onClick={handleCopyTemplateLink}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${copied
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-brand-primary hover:bg-brand-secondary text-white'
                  }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

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
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
          >
            <XIcon />
            Share to X
          </a>
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
          >
            <LinkedInIcon />
            Share to LinkedIn
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
          >
            <FacebookIcon />
            Share to Facebook
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#E1306C] hover:bg-[#C13584] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
          >
            <InstagramIcon />
            Share to Instagram
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
