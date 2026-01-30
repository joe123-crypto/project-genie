import React, { useState } from 'react';
import { Template, User } from '../types';
import { Spinner } from './Spinner'; // Changed to named import
import { TrashIcon, EditIcon } from './icons';
import Image from 'next/image';

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
  aspectRatio?: string; // made optional since we’re standardizing it
  user: User | null;
  onDelete: (templateId: string) => Promise<void>;
  onEdit: (template: Template) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  aspectRatio = 'aspect-square',
  user,
  onDelete,
  onEdit,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isAdmin = user?.email === 'munemojoseph332@gmail.com';

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(template);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete “${template.name}”?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(template.id);
    } catch (error) {
      console.error('Deletion failed for template:', template.id, error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onSelect}
      className="
        group relative w-full
        bg-base-200 dark:bg-dark-base-200
        rounded-2xl overflow-hidden
        shadow-sm hover:shadow-xl
        cursor-pointer transition-all duration-300 ease-out
        hover:-translate-y-1
      "
    >
      {/* Image section */}
      <div className={`relative w-full ${aspectRatio} overflow-hidden bg-base-300 dark:bg-dark-base-300`}>
        {isAdmin && (
          <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleEdit}
              disabled={isDeleting}
              className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-white dark:hover:bg-black rounded-full text-content-100 dark:text-dark-content-100 shadow-lg disabled:opacity-50 transition-colors"
              aria-label={`Edit ${template.name} template`}
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-red-500 hover:text-white dark:hover:bg-red-600 rounded-full text-red-500 shadow-lg disabled:opacity-50 transition-colors"
              aria-label={`Delete ${template.name} template`}
            >
              {isDeleting ? <Spinner className="w-4 h-4" /> : <TrashIcon />}
            </button>
          </div>
        )}

        <Image
          src={template.previewImageUrl}
          alt={`Preview of ${template.name} template`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 text-left transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-white font-bold text-sm sm:text-base truncate drop-shadow-md mb-0.5">
            {template.name}
          </h3>

          <div className="flex items-center gap-1 text-white/80 text-xs sm:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            {template.username && (
              <span className="truncate">by {template.username}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
