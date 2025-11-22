import React, { useState, useMemo } from 'react';
import { Filter, Outfit, User } from '../types';
import FilterCard from './FilterCard';
import OutfitCard from './OutfitCard';


interface SearchViewProps {
    filters: Filter[];
    outfits: Outfit[];
    onSelectFilter: (filter: Filter) => void;
    onSelectOutfit: (outfit: Outfit) => void;
    user: User | null;
    onDeleteFilter: (filterId: string) => Promise<void>;
    onEditFilter: (filter: Filter) => void;
}

const SearchView: React.FC<SearchViewProps> = ({
    filters,
    outfits,
    onSelectFilter,
    onSelectOutfit,
    user,
    onDeleteFilter,
    onEditFilter
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'filters' | 'outfits'>('all');

    const { filteredFilters, filteredOutfits } = useMemo(() => {
        if (!searchTerm.trim()) {
            return { filteredFilters: [], filteredOutfits: [] };
        }

        const term = searchTerm.toLowerCase();

        const f = filters.filter(item =>
            (item.name || '').toLowerCase().includes(term) ||
            (item.description || '').toLowerCase().includes(term) ||
            (item.prompt || '').toLowerCase().includes(term) ||
            (item.category || '').toLowerCase().includes(term) ||
            (item.username && item.username.toLowerCase().includes(term))
        );

        const o = outfits.filter(item =>
            (item.name || '').toLowerCase().includes(term) ||
            (item.description || '').toLowerCase().includes(term) ||
            (item.prompt || '').toLowerCase().includes(term) ||
            (item.category || '').toLowerCase().includes(term) ||
            (item.username && item.username.toLowerCase().includes(term))
        );

        return { filteredFilters: f, filteredOutfits: o };
    }, [searchTerm, filters, outfits]);

    const showFilters = activeTab === 'all' || activeTab === 'filters';
    const showOutfits = activeTab === 'all' || activeTab === 'outfits';
    const hasResults = filteredFilters.length > 0 || filteredOutfits.length > 0;

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col items-center">
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 text-base rounded-full bg-gray-100 dark:bg-dark-base-200 border-none focus:ring-2 focus:ring-brand-primary transition-all shadow-sm text-content-100 dark:text-dark-content-100 placeholder-content-300"
                        autoFocus
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {searchTerm && (
                    <div className="flex gap-4 mt-6 overflow-x-auto pb-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'all'
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-content-200 dark:text-dark-content-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            All Results ({filteredFilters.length + filteredOutfits.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('filters')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'filters'
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-content-200 dark:text-dark-content-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            Filters ({filteredFilters.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('outfits')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'outfits'
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-content-200 dark:text-dark-content-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            Outfits ({filteredOutfits.length})
                        </button>
                    </div>
                )}
            </div>

            {!searchTerm ? (
                <div className="text-center py-20 opacity-50">
                    <div className="mx-auto w-16 h-16 mb-4 text-content-300">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-lg text-content-200 dark:text-dark-content-200">Type to start searching...</p>
                </div>
            ) : !hasResults ? (
                <div className="text-center py-20">
                    <p className="text-lg text-content-200 dark:text-dark-content-200">No results found for &quot;{searchTerm}&quot;</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {showFilters && filteredFilters.length > 0 && (
                        <section>
                            <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-6 flex items-center gap-2">
                                Filters
                                <span className="text-sm font-normal text-content-300 dark:text-dark-content-300 bg-base-200 dark:bg-dark-base-200 px-2 py-0.5 rounded-full">
                                    {filteredFilters.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                {filteredFilters.map((filter) => (
                                    <FilterCard
                                        key={filter.id}
                                        filter={filter}
                                        onSelect={() => onSelectFilter(filter)}
                                        aspectRatio="aspect-[3/4]"
                                        user={user}
                                        onDelete={onDeleteFilter}
                                        onEdit={onEditFilter}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {showOutfits && filteredOutfits.length > 0 && (
                        <section>
                            <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-6 flex items-center gap-2">
                                Outfits
                                <span className="text-sm font-normal text-content-300 dark:text-dark-content-300 bg-base-200 dark:bg-dark-base-200 px-2 py-0.5 rounded-full">
                                    {filteredOutfits.length}
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                {filteredOutfits.map(outfit => (
                                    <OutfitCard
                                        key={outfit.id}
                                        outfit={outfit}
                                        onSelect={() => onSelectOutfit(outfit)}
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
