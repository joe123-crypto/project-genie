import React, { useState } from 'react';
import Image from 'next/image';
import { Template, User } from '../types';
import { Spinner } from './Spinner';
import { EditIcon, TrashIcon } from './icons';

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
  aspectRatio?: string;
  user: User | null;
  onDelete?: (templateId: string) => Promise<void>;
  onEdit?: (template: Template) => void;
  allowAdminActions?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  aspectRatio = 'aspect-square',
  user,
  onDelete,
  onEdit,
  allowAdminActions = true,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const isAdmin = user?.email === 'munemojoseph332@gmail.com';
  const showAdminActions = allowAdminActions && isAdmin && (onEdit || onDelete);

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onEdit) return;
    onEdit(template);
  };

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!onDelete) return;
    if (!window.confirm(`Delete "${template.name}"?`)) return;

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
        cursor-pointer overflow-hidden rounded-2xl
        bg-base-200 shadow-sm transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl
        dark:bg-dark-base-200
      "
    >
      <div className={`relative w-full ${aspectRatio} overflow-hidden bg-base-300 dark:bg-dark-base-300`}>
        {showAdminActions ? (
          <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {onEdit ? (
              <button
                onClick={handleEdit}
                disabled={isDeleting}
                className="rounded-full bg-white/90 p-2 text-content-100 shadow-lg transition-colors hover:bg-white disabled:opacity-50 dark:bg-black/90 dark:text-dark-content-100 dark:hover:bg-black"
                aria-label={`Edit ${template.name} template`}
              >
                <EditIcon />
              </button>
            ) : null}
            {onDelete ? (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-full bg-white/90 p-2 text-red-500 shadow-lg transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 dark:bg-black/90 dark:hover:bg-red-600"
                aria-label={`Delete ${template.name} template`}
              >
                {isDeleting ? <Spinner className="h-4 w-4" /> : <TrashIcon />}
              </button>
            ) : null}
          </div>
        ) : null}

        <Image
          src={template.previewImageUrl}
          alt={`Preview of ${template.name} template`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />

        <div className="absolute bottom-0 left-0 w-full translate-y-2 p-3 text-left transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
          <h3 className="mb-0.5 truncate text-sm font-bold text-white drop-shadow-md sm:text-base">
            {template.name}
          </h3>

          <div className="flex items-center gap-1 text-xs text-white/80 opacity-0 transition-opacity duration-300 delay-75 group-hover:opacity-100 sm:text-sm">
            {template.username ? <span className="truncate">by {template.username}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
