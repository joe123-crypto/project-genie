
import React, { useState } from 'react';
import { Hairstyle, User } from '../types';
import { TrashIcon, EditIcon } from './icons';
import { Spinner } from './Spinner';

interface HairstyleCardProps {
    hairstyle: Hairstyle;
    onSelect: () => void;
    aspectRatio?: string;
    user?: User | null;
    onDelete?: (id: string) => Promise<void>;
    onEdit?: (hairstyle: Hairstyle) => void;
}

const HairstyleCard: React.FC<HairstyleCardProps> = ({
    hairstyle,
    onSelect,
    aspectRatio = 'aspect-square',
    user,
    onDelete,
    onEdit
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    // Simple admin check for now, can be expanded
    const canEdit = user?.email === 'munemojoseph332@gmail.com' || user?.uid === hairstyle.userId;

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onDelete) return;
        if (!window.confirm(`Are you sure you want to delete "${hairstyle.name}"?`)) return;

        setIsDeleting(true);
        try {
            await onDelete(hairstyle.id);
        } catch (error) {
            console.error('Failed to delete hairstyle:', error);
            setIsDeleting(false);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit(hairstyle);
    };

    return (
        <div
            className={`group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:shadow-none bg-base-200 dark:bg-dark-base-200`}
            onClick={onSelect}
        >
            <div className={`${aspectRatio} relative overflow-hidden bg-base-300 dark:bg-dark-base-300`}>
                {canEdit && (onDelete || onEdit) && (
                    <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {onEdit && (
                            <button
                                onClick={handleEdit}
                                disabled={isDeleting}
                                className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-white dark:hover:bg-black rounded-full text-content-100 dark:text-dark-content-100 shadow-lg disabled:opacity-50 transition-colors"
                            >
                                <EditIcon />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 bg-white/90 dark:bg-black/90 backdrop-blur-sm hover:bg-red-500 hover:text-white dark:hover:bg-red-600 rounded-full text-red-500 shadow-lg disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? <Spinner className="w-4 h-4" /> : <TrashIcon />}
                            </button>
                        )}
                    </div>
                )}

                <img
                    src={hairstyle.previewImageUrl}
                    alt={hairstyle.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Gender Badge */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full capitalize">
                    {hairstyle.gender}
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform">
                <h3 className="font-bold text-sm sm:text-base truncate drop-shadow-md">{hairstyle.name}</h3>
                <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 opacity-90">{hairstyle.description}</p>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-300">
                        {hairstyle.accessCount || 0} uses
                    </span>
                    {hairstyle.username && (
                        <span className="text-xs text-gray-400 truncate max-w-[50%]">
                            by {hairstyle.username}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HairstyleCard;
