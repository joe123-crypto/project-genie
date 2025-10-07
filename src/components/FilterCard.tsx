import React, { useState } from 'react';
import { Filter, User } from '../types';
import Spinner from './Spinner';
import { TrashIcon, EditIcon } from './icons';
import Image from 'next/image';

interface FilterCardProps {
  filter: Filter;
  onSelect: () => void;
  aspectRatio?: string; // made optional since we’re standardizing it
  user: User | null;
  onDelete: (filterId: string) => Promise<void>;
  onEdit: (filter: Filter) => void;
}

const FilterCard: React.FC<FilterCardProps> = ({
  filter,
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
    onEdit(filter);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete “${filter.name}”?`)) return;

    setIsDeleting(true);
    try {
      await onDelete(filter.id);
    } catch (error) {
      console.error('Deletion failed for filter:', filter.id, error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onSelect}
      className="
        bg-base-200 dark:bg-dark-base-200
        rounded-xl overflow-hidden
        shadow-sm border border-border-color dark:border-dark-border-color
        cursor-pointer group transition-all duration-300
        hover:shadow-md hover:border-brand-primary/40
        flex flex-col justify-between
        text-center
      "
      style={{
        width: '100%', // ensures it scales in grid
        maxWidth: '180px', // prevents it from stretching on large screens
      }}
    >
      {/* Image section */}
      <div className={`relative w-full ${aspectRatio} overflow-hidden`}>
        {isAdmin && (
          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleEdit}
              disabled={isDeleting}
              className="p-1.5 bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary rounded-full text-white disabled:opacity-50"
              aria-label={`Edit ${filter.name} filter`}
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 bg-brand-primary hover:bg-brand-secondary dark:bg-dark-brand-primary dark:hover:bg-dark-brand-secondary rounded-full text-white disabled:opacity-50"
              aria-label={`Delete ${filter.name} filter`}
            >
              {isDeleting ? <Spinner className="w-4 h-4" /> : <TrashIcon />}
            </button>
          </div>
        )}

        <Image
          src={filter.previewImageUrl}
          alt={`Preview of ${filter.name} filter`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 25vw, 180px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-2 left-0 w-full text-center text-sm font-semibold text-white px-2 truncate">
          {filter.name}
        </h3>
      </div>

      {/* Text section */}
      <div className="p-2 flex flex-col gap-1">
        <p className="text-xs text-content-200 dark:text-dark-content-200 line-clamp-2">
          {filter.description}
        </p>
        {filter.username && (
          <p className="text-[10px] text-content-300 dark:text-dark-content-300 truncate">
            by {filter.username}
          </p>
        )}
      </div>
    </div>
  );
};

export default FilterCard;
