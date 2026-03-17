import React, { useDeferredValue, useMemo, useState } from 'react';
import { Template, User, VideoTemplate } from '../types';
import TemplateCard from './TemplateCard';
import VideoTemplateCard from './VideoTemplateCard';
import { studioClasses } from '../utils/theme';

interface SearchViewProps {
    templates: Template[];
    videoTemplates: VideoTemplate[];
    onSelectTemplate: (template: Template) => void;
    onSelectVideo: (template: VideoTemplate) => void;
    user: User | null;
    onDeleteTemplate: (templateId: string) => Promise<void>;
    onEditTemplate: (template: Template) => void;
}

type SearchTab = 'all' | 'templates' | 'videos';

const SearchView: React.FC<SearchViewProps> = ({
    templates,
    videoTemplates,
    onSelectTemplate,
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
        filteredVideos
    } = useMemo(() => {
        if (!trimmedTerm) {
            return {
                filteredTemplates: [],
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
            filteredVideos: videoTemplates.filter((item) =>
                matches(item.name) ||
                matches(item.description) ||
                matches(item.prompt) ||
                matches(item.category) ||
                matches(item.username)
            ),
        };
    }, [templates, trimmedTerm, videoTemplates]);

    const resultCounts = {
        templates: filteredTemplates.length,
        videos: filteredVideos.length,
    };

    const totalResults =
        resultCounts.templates +
        resultCounts.videos;

    const showTemplates = activeTab === 'all' || activeTab === 'templates';
    const showVideos = activeTab === 'all' || activeTab === 'videos';
    const hasResults = totalResults > 0;

    const searchTabs: Array<{ key: SearchTab; label: string; count: number }> = [
        { key: 'all', label: 'All Results', count: totalResults },
        { key: 'templates', label: 'Templates', count: resultCounts.templates },
        { key: 'videos', label: 'Videos', count: resultCounts.videos },
    ];

    return (
        <div className="animate-fade-in mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col items-center text-center">
                <span className={studioClasses.badge}>Search</span>
                <h2 className="landing-display mt-4 text-4xl text-content-100 dark:text-dark-content-100 sm:text-5xl">
                    Find anything in your studio
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-content-200 dark:text-dark-content-200 sm:text-base">
                    Search across templates and videos from one place.
                </p>

                <div className="studio-panel relative mt-8 w-full max-w-3xl rounded-[2rem] p-3">
                    <input
                        type="text"
                        placeholder="Search templates and videos..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="studio-input pl-11"
                        autoFocus
                    />
                    <div className="absolute left-7 top-1/2 -translate-y-1/2 text-content-300">
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
                    <div className="studio-panel-soft scrollbar-hidden mt-6 flex w-full max-w-4xl gap-2 overflow-x-auto rounded-full p-2">
                        {searchTabs.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={activeTab === tab.key ? studioClasses.tabActive : studioClasses.tabInactive}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!searchTerm ? (
                <div className={`${studioClasses.emptyState} py-20 text-center`}>
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
                <div className={`${studioClasses.emptyState} py-20 text-center`}>
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
                                <span className="studio-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-content-300 dark:text-dark-content-300">
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
                                <span className="studio-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-content-300 dark:text-dark-content-300">
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
                </div>
            )}
        </div>
    );
};

export default SearchView;
