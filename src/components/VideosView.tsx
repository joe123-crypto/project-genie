import React from 'react';
import { VideoTemplate, User } from '../types';
import VideoTemplateCard from './VideoTemplateCard';
import { commonClasses } from '../utils/theme';

interface VideosViewProps {
    videos: VideoTemplate[];
    onSelectVideo: (template: VideoTemplate) => void;
    user: User | null;
}

const VideosView: React.FC<VideosViewProps> = ({ videos, onSelectVideo, user }) => {
    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-24">
            <div className="mb-8">
                <h2 className={`text-2xl ${commonClasses.text.heading} mb-2`}>
                    Video Templates
                </h2>
                <p className={commonClasses.text.body}>
                    Transform your photos into amazing videos with AI.
                </p>
            </div>

            {videos.length === 0 ? (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 dark:bg-dark-base-200 mb-4">
                        <svg className="w-8 h-8 text-content-300 dark:text-dark-content-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.818v6.364a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className={`text-lg font-medium ${commonClasses.text.heading} mb-2`}>
                        No video templates yet
                    </h3>
                    <p className={commonClasses.text.body}>
                        Be the first to create a video template!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {videos.map((video) => (
                        <VideoTemplateCard
                            key={video.id}
                            template={video}
                            onClick={onSelectVideo}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideosView;
