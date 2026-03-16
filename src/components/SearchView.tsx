import React, { useDeferredValue, useMemo, useState } from 'react';
import { Hairstyle, Outfit, Template, User, VideoTemplate } from '../types';
import TemplateCard from './TemplateCard';
import OutfitCard from './OutfitCard';
import HairstyleCard from './HairstyleCard';
import VideoTemplateCard from './VideoTemplateCard';

interface SearchViewProps {
    templates: Template[];
    outfits: Outfit[];
    hairstyles: Hairstyle[];
    videoTemplates: VideoTemplate[];
    onSelectTemplate: (template: Template) => void;
    onSelectOutfit: (outfit: Outfit) => void;
    onSelectHairstyle: (hairstyle: Hairstyle) => void;
    onSelectVideo: (template: VideoTemplate) => void;
    user: User | null;
    onDeleteTemplate: (templateId: string) => Promise<void>;
    onEditTemplate: (template: Template) => void;
}

type SearchTab = 'all' | 'templates' | 'videos' | 'outfits' | 'hairstyles';

const SearchView: React.FC<SearchViewProps> = ({
    templates,
    outfits,
    hairstyles,
    videoTemplates,
    onSelectTemplate,
    onSelectOutfit,
    onSelectHairstyle,
    onSelectVideo,
    user,
    onDeleteTemplate,
    onEditTemplate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('all');
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const trimmedTerm = deferredSearchTerm.trim().toLowerCase();
    const isSearching = deferredSearchTerm !== searchTerm;

    const {
        filteredTemplates,
        filteredOutfits,
        filteredHairstyles,
        filteredVideos
    } = useMemo(() => {
        if (!trimmedTerm) {
            return {
                filteredTemplates: [],
                filteredOutfits: [],
                filteredHairstyles: [],
                filteredVideos: [],
            };
        }

        const matches = (value?: string) => (value || '').toLowerCase().includes(trimmedTerm);

        return {
            filteredTemplates: templates.filter((item) =>
                matches(item.name) ||
                matches(item.description) ||
                matches(item.prompt) ||
                matches(item.category) ||
                matches(item.username)
            ),
            filteredOutfits: outfits.filter((item) =>
                matches(item.name) ||
                matches(item.description) ||
                matches(item.prompt) ||
                matches(item.category) ||
                matches(item.username)
            ),
            filteredHairstyles: hairstyles.filter((item) =>
                matches(item.name) ||
                matches(item.description) ||
                matches(item.gender) ||
                matches(item.prompt) ||
                matches(item.username)
            ),
            filteredVideos: videoTemplates.filter((item) =>
                matches(item.name) ||
                matches(item.description) ||
                matches(item.prompt) ||
                matches(item.category) ||
                matches(item.username)
            ),
        };
    }, [hairstyles, outfits, templates, trimmedTerm, videoTemplates]);

    const resultCounts = {
        templates: filteredTemplates.length,
        videos: filteredVideos.length,
        outfits: filteredOutfits.length,
        hairstyles: filteredHairstyles.length,
    };

    const totalResults =
        resultCounts.templates +
        resultCounts.videos +
        resultCounts.outfits +
        resultCounts.hairstyles;

    const showTemplates = activeTab === 'all' || activeTab === 'templates';
    const showVideos = activeTab === 'all' || activeTab === 'videos';
    const showOutfits = activeTab === 'all' || activeTab === 'outfits';
    const showHairstyles = activeTab === 'all' || activeTab === 'hairstyles';
    const hasResults = totalResults > 0;

    const searchTabs: Array<{ key: SearchTab; label: string; count: number }> = [
        { key: 'all', label: 'All Results', count: totalResults },
        { key: 'templates', label: 'Templates', count: resultCounts.templates },
        { key: 'videos', label: 'Videos', count: resultCounts.videos },
        { key: 'outfits', label: 'Outfits', count: resultCounts.outfits },
        { key: 'hairstyles', label: 'Hairstyles', count: resultCounts.hairstyles },
    ];

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div className="mb-8 flex flex-col items-center">
                <div className="relative w-full max-w-2xl">
                    <input
                        type="text"
                        placeholder="Search templates, videos, outfits, and hairstyles..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="w-full rounded-full bg-gray-100 px-4 py-3 pl-11 text-base text-content-100 placeholder-content-300 shadow-sm transition-all focus:ring-2 focus:ring-brand-primary dark:bg-dark-base-200 dark:text-dark-content-100"
                        autoFocus
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-content-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {searchTerm ? (
                    <div className="mt-3 text-sm text-content-200 dark:text-dark-content-200">
                        {isSearching ? 'Updating results...' : `${totalResults} result${totalResults === 1 ? '' : 's'} found`}
                    </div>
                ) : null}

                {searchTerm && (
                    <div className="mt-6 flex w-full gap-3 overflow-x-auto pb-2">
                        {searchTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key
                                    ? 'bg-brand-primary text-white'
                                    : 'bg-gray-100 text-content-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-dark-content-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!searchTerm ? (
                <div className="py-20 text-center opacity-60">
                    <div className="mx-auto mb-4 h-16 w-16 text-content-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-lg text-content-200 dark:text-dark-content-200">
                        Start typing to search across the whole studio.
                    </p>
                </div>
            ) : !hasResults ? (
                <div className="py-20 text-center">
                    <p className="text-lg text-content-200 dark:text-dark-content-200">
                        No results found for &quot;{searchTerm}&quot;
                    </p>
                </div>
            ) : (
                <div className="space-y-12">
                    {showTemplates && filteredTemplates.length > 0 && (
                        <section>
                            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-content-100 dark:text-dark-content-100">
                                Templates
                                <span className="rounded-full bg-base-200 px-2 py-0.5 text-sm font-normal text-content-300 dark:bg-dark-base-200 dark:text-dark-content-300">
                                    {filteredTemplates.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
                                {filteredTemplates.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        onSelect={() => onSelectTemplate(template)}
                                        aspectRatio="aspect-[3/4]"
                                        user={user}
                                        onDelete={onDeleteTemplate}
                                        onEdit={onEditTemplate}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {showVideos && filteredVideos.length > 0 && (
                        <section>
                            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-content-100 dark:text-dark-content-100">
                                Videos
                                <span className="rounded-full bg-base-200 px-2 py-0.5 text-sm font-normal text-content-300 dark:bg-dark-base-200 dark:text-dark-content-300">
                                    {filteredVideos.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {filteredVideos.map((video) => (
                                    <VideoTemplateCard
                                        key={video.id}
                                        template={video}
                                        onClick={onSelectVideo}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {showOutfits && filteredOutfits.length > 0 && (
                        <section>
                            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-content-100 dark:text-dark-content-100">
                                Outfits
                                <span className="rounded-full bg-base-200 px-2 py-0.5 text-sm font-normal text-content-300 dark:bg-dark-base-200 dark:text-dark-content-300">
                                    {filteredOutfits.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                                {filteredOutfits.map((outfit) => (
                                    <OutfitCard
                                        key={outfit.id}
                                        outfit={outfit}
                                        onSelect={() => onSelectOutfit(outfit)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {showHairstyles && filteredHairstyles.length > 0 && (
                        <section>
                            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-content-100 dark:text-dark-content-100">
                                Hairstyles
                                <span className="rounded-full bg-base-200 px-2 py-0.5 text-sm font-normal text-content-300 dark:bg-dark-base-200 dark:text-dark-content-300">
                                    {filteredHairstyles.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
                                {filteredHairstyles.map((hairstyle) => (
                                    <HairstyleCard
                                        key={hairstyle.id}
                                        hairstyle={hairstyle}
                                        onSelect={() => onSelectHairstyle(hairstyle)}
                                        user={user}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchView;
