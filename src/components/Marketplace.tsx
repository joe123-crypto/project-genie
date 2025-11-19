
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Filter, User } from '../types';
import FilterCard from './FilterCard';

interface MarketplaceProps {
    filters: Filter[];
    onSelectFilter: (filter: Filter) => void;
    user: User | null;
    onDeleteFilter: (filterId: string) => Promise<void>;
    onEditFilter: (filter: Filter) => void;
}

const ASPECT_RATIOS = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/3]'];

const Marketplace: React.FC<MarketplaceProps> = ({ filters, onSelectFilter, user, onDeleteFilter, onEditFilter }) => {

    const { trendingSection, otherSections } = useMemo(() => {
        const sortedFilters = [...filters].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
        const trendingFilters = sortedFilters.slice(0, 5).filter(f => (f.accessCount || 0) > 0);
        const trendingIds = new Set(trendingFilters.map(f => f.id));
        const otherFilters = filters.filter(f => !trendingIds.has(f.id));

        const categoriesMap = new Map<string, Filter[]>();
        const validCategories = new Set(['Fun', 'Useful', 'Futuristic', 'Hair Styles', 'Other']);

        otherFilters.forEach(filter => {
            let category = filter.category;
            if (!category || !validCategories.has(category)) {
                category = 'Other';
            }

            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, []);
            }
            categoriesMap.get(category)!.push(filter);
        });

        const preferredOrder = ['Fun', 'Useful', 'Futuristic', 'Hair Styles', 'Other'];
        const sortedCategoryNames = Array.from(categoriesMap.keys()).sort((a, b) => {
            const indexA = preferredOrder.indexOf(a);
            const indexB = preferredOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        const otherSections = sortedCategoryNames.map(categoryName => ({
            name: categoryName,
            filters: categoriesMap.get(categoryName) || [],
        }));

        return { trendingSection: { name: 'Trending', filters: trendingFilters }, otherSections };
    }, [filters]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || isPaused || trendingSection.filters.length === 0) return;

        let animationFrameId: number;
        let scrollAmount = scrollContainer.scrollLeft;
        const speed = 1.5; // Increased speed

        const animate = () => {
            if (scrollContainer) {
                scrollAmount += speed;
                // If we've scrolled past the first set of items (halfway point of the duplicated list)
                // reset to 0 to create the seamless loop effect
                if (scrollAmount >= scrollContainer.scrollWidth / 2) {
                    scrollAmount = 0;
                    scrollContainer.scrollLeft = 0;
                } else {
                    scrollContainer.scrollLeft = scrollAmount;
                }
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused, trendingSection.filters]);

    // Duplicate filters for infinite scroll effect if there are enough items
    const infiniteTrendingFilters = trendingSection.filters.length > 0
        ? [...trendingSection.filters, ...trendingSection.filters]
        : [];

    return (
        <div className="animate-fade-in pb-20"> {/* Added padding bottom for mobile nav if exists */}

            {filters.length === 0 && (
                <div className="text-center bg-base-200 dark:bg-dark-base-200 p-12 rounded-3xl mx-4 mt-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">The Marketplace is Empty!</h3>
                    <p className="text-content-200 dark:text-dark-content-200 mt-2 mb-6">Be the first to create and share a new filter with the community.</p>
                </div>
            )}

            <div className="space-y-12">
                {trendingSection.filters.length > 0 && (
                    <section className="pl-4 sm:pl-6 lg:pl-8">
                        <div className="flex items-center justify-between mb-6 pr-4 sm:pr-6 lg:pr-8">
                            <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">
                                {trendingSection.name} 🔥
                            </h3>
                        </div>

                        <div
                            ref={scrollRef}
                            className="flex overflow-x-auto pb-6 -ml-4 px-4 sm:-ml-6 sm:px-6 lg:-ml-8 lg:px-8 gap-4 scrollbar-hide snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                            onTouchStart={() => setIsPaused(true)}
                            onTouchEnd={() => setIsPaused(false)}
                        >
                            {infiniteTrendingFilters.map((filter, index) => (
                                <div key={`${filter.id}-${index}`} className="snap-start shrink-0 w-[160px] sm:w-[200px]">
                                    <FilterCard
                                        filter={filter}
                                        onSelect={() => onSelectFilter(filter)}
                                        aspectRatio={ASPECT_RATIOS[index % ASPECT_RATIOS.length]}
                                        user={user}
                                        onDelete={onDeleteFilter}
                                        onEdit={onEditFilter}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <div className="space-y-12 px-4 sm:px-6 lg:px-8">
                    {otherSections.map(categorySection => {
                        if (categorySection.filters.length === 0) return null;
                        return (
                            <section key={categorySection.name}>
                                <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-6 flex items-center gap-2">
                                    {categorySection.name}
                                    <span className="text-sm font-normal text-content-300 dark:text-dark-content-300 bg-base-200 dark:bg-dark-base-200 px-2 py-0.5 rounded-full">
                                        {categorySection.filters.length}
                                    </span>
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                    {categorySection.filters.map((filter, index) => (
                                        <FilterCard
                                            key={filter.id}
                                            filter={filter}
                                            onSelect={() => onSelectFilter(filter)}
                                            aspectRatio={ASPECT_RATIOS[index % ASPECT_RATIOS.length]}
                                            user={user}
                                            onDelete={onDeleteFilter}
                                            onEdit={onEditFilter}
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

export default Marketplace;
