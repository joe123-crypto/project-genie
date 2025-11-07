
import React, { useMemo } from 'react';
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
    
    const preferredOrder = ['Fun', 'Useful', 'Futuristic', 'Hair Styles','Other'];
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


  return (
    <div className="animate-fade-in">

      {filters.length === 0 && (
         <div className="text-center bg-base-200 dark:bg-dark-base-200 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">The Marketplace is Empty!</h3>
            <p className="text-content-200 dark:text-dark-content-200 mt-2 mb-4">Be the first to create and share a new filter with the community.</p>
        </div>
      )}

        <div className="space-y-10">
            {trendingSection.filters.length > 0 && (
                <section>
                    <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-4 pb-2">{trendingSection.name}</h3>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 sm:gap-4 justify-items-center">
                        {trendingSection.filters.map((filter, index) => (
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
        )}
        {otherSections.map(categorySection => {
            if (categorySection.filters.length === 0) return null;
            return (
                <section key={categorySection.name}>
                    <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-4">{categorySection.name}</h3>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 sm:gap-4 justify-items-center">
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
  );
};

export default Marketplace;
