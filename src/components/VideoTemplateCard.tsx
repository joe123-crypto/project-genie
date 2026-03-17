import React from 'react';
import Image from 'next/image';
import { VideoTemplate } from '../types';

interface VideoTemplateCardProps {
    template: VideoTemplate;
    onClick: (template: VideoTemplate) => void;
    aspectRatio?: string;
}

const VideoTemplateCard: React.FC<VideoTemplateCardProps> = ({
    template,
    onClick,
    aspectRatio = 'aspect-[3/4]',
}) => {
    return (
        <div
            onClick={() => onClick(template)}
            className="group relative w-full cursor-pointer overflow-hidden rounded-[1.7rem] border border-border-color bg-base-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(15,23,42,0.14)] dark:border-dark-border-color dark:bg-dark-base-100"
        >
            <div className={`relative w-full ${aspectRatio} overflow-hidden bg-base-300 dark:bg-dark-base-300`}>
                <Image
                    src={template.previewImageUrl}
                    alt={`Preview of ${template.name} video template`}
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

export default VideoTemplateCard;
