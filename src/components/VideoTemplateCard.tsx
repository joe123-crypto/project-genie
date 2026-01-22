import React from 'react';
import { VideoTemplate } from '../types';
import { commonClasses } from '../utils/theme';
import { SparklesIcon } from './icons';

interface VideoTemplateCardProps {
    template: VideoTemplate;
    onClick: (template: VideoTemplate) => void;
}

const VideoTemplateCard: React.FC<VideoTemplateCardProps> = ({ template, onClick }) => {
    return (
        <div
            onClick={() => onClick(template)}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-border-color dark:border-dark-border-color bg-base-100 dark:bg-dark-base-100"
        >
            {/* Image */}
            <img
                src={template.previewImageUrl}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 drop-shadow-md">
                    {template.name}
                </h3>
                <p className="text-gray-200 text-xs line-clamp-2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                    {template.description}
                </p>

                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                        <SparklesIcon className="w-3 h-3" />
                        {template.category}
                    </span>
                    {template.username && (
                        <span className="text-gray-300 text-xs">by {template.username}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoTemplateCard;
