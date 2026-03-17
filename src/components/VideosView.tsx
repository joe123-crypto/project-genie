import React, { useMemo } from 'react';
import { VideoTemplate, User } from '../types';
import VideoTemplateCard from './VideoTemplateCard';
import { studioClasses } from '../utils/theme';

interface VideosViewProps {
    videos: VideoTemplate[];
    onSelectVideo: (template: VideoTemplate) => void;
    user: User | null;
}

const ASPECT_RATIOS = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/3]'];

const VideosView: React.FC<VideosViewProps> = ({ videos, onSelectVideo }) => {
    const { trendingSection, otherSections } = useMemo(() => {
        const sortedVideos = [...videos].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
        const trendingVideos = sortedVideos.slice(0, 5).filter((video) => (video.accessCount || 0) > 0);
        const trendingIds = new Set(trendingVideos.map((video) => video.id));
        const otherVideos = videos.filter((video) => !trendingIds.has(video.id));

        const categoriesMap = new Map<string, VideoTemplate[]>();

        otherVideos.forEach((video) => {
            const category = video.category?.trim() || 'Other';

            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, []);
            }

            categoriesMap.get(category)!.push(video);
        });

        const sortedCategoryNames = Array.from(categoriesMap.keys()).sort((a, b) => {
            if (a === 'Other') return 1;
            if (b === 'Other') return -1;
            return a.localeCompare(b);
        });

        const categorizedSections = sortedCategoryNames.map((categoryName) => ({
            name: categoryName,
            videos: categoriesMap.get(categoryName) || [],
        }));

        return {
            trendingSection: { name: 'Trending', videos: trendingVideos },
            otherSections: categorizedSections,
        };
    }, [videos]);

    const infiniteTrendingVideos = trendingSection.videos.length > 0
        ? [...trendingSection.videos, ...trendingSection.videos]
        : [];

    return (
        <div className="animate-fade-in pb-20">
            {videos.length === 0 && (
                <div className={`${studioClasses.emptyState} mx-4 mt-8 p-12 text-center`}>
                    <h3 className="landing-display text-4xl text-content-100 dark:text-dark-content-100">
                        No video templates yet
                    </h3>
                    <p className="mt-3 text-content-200 dark:text-dark-content-200">
                        Be the first to create and share a new video template with the community.
                    </p>
                </div>
            )}

            <div className="space-y-14">
                {trendingSection.videos.length > 0 && (
                    <section className="overflow-hidden">
                        <div className="mb-6 px-4 sm:px-6 lg:px-8">
                            <div className="mb-2">
                                <span className={studioClasses.badge}>Popular now</span>
                            </div>
                            <h3 className="landing-display text-4xl text-content-100 dark:text-dark-content-100">
                                {trendingSection.name}
                            </h3>
                        </div>

                        <div className="relative w-full overflow-hidden">
                            <div className="flex w-max animate-scroll">
                                {infiniteTrendingVideos.map((video, index) => (
                                    <div key={`${video.id}-${index}`} className="mx-2 w-[170px] shrink-0 sm:mx-3 sm:w-[210px]">
                                        <VideoTemplateCard
                                            template={video}
                                            onClick={onSelectVideo}
                                            aspectRatio={ASPECT_RATIOS[index % ASPECT_RATIOS.length]}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <div className="space-y-12 px-4 sm:px-6 lg:px-8">
                    {otherSections.map((categorySection) => {
                        if (categorySection.videos.length === 0) return null;

                        return (
                            <section key={categorySection.name}>
                                <div className="mb-6 flex items-center gap-3">
                                    <h3 className="landing-display text-3xl text-content-100 dark:text-dark-content-100">
                                        {categorySection.name}
                                    </h3>
                                    <span className="studio-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-content-300 dark:text-dark-content-300">
                                        {categorySection.videos.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                                    {categorySection.videos.map((video, index) => (
                                        <VideoTemplateCard
                                            key={video.id}
                                            template={video}
                                            onClick={onSelectVideo}
                                            aspectRatio={ASPECT_RATIOS[index % ASPECT_RATIOS.length]}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VideosView;
