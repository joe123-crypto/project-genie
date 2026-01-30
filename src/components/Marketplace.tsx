import React, { useMemo } from 'react';
import { Template, User } from '../types';
import TemplateCard from './TemplateCard';

interface MarketplaceProps {
    templates: Template[];
    onSelectTemplate: (template: Template) => void;
    user: User | null;
    onDeleteTemplate: (templateId: string) => Promise<void>;
    onEditTemplate: (template: Template) => void;
}

const ASPECT_RATIOS = ['aspect-square', 'aspect-[3/4]', 'aspect-[4/3]'];

const Marketplace: React.FC<MarketplaceProps> = ({ templates, onSelectTemplate, user, onDeleteTemplate, onEditTemplate }) => {

    const { trendingSection, otherSections } = useMemo(() => {
        const sortedTemplates = [...templates].sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0));
        const trendingTemplates = sortedTemplates.slice(0, 5).filter(t => (t.accessCount || 0) > 0);
        const trendingIds = new Set(trendingTemplates.map(t => t.id));
        const otherTemplates = templates.filter(t => !trendingIds.has(t.id));

        const categoriesMap = new Map<string, Template[]>();
        const validCategories = new Set(['Fun', 'Useful', 'Futuristic', 'Hair Styles', 'Other']);

        otherTemplates.forEach(template => {
            let category = template.category;
            if (!category || !validCategories.has(category)) {
                category = 'Other';
            }

            if (!categoriesMap.has(category)) {
                categoriesMap.set(category, []);
            }
            categoriesMap.get(category)!.push(template);
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
            templates: categoriesMap.get(categoryName) || [],
        }));

        return { trendingSection: { name: 'Trending', templates: trendingTemplates }, otherSections };
    }, [templates]);

    // Duplicate templates for infinite scroll effect if there are enough items
    const infiniteTrendingTemplates = trendingSection.templates.length > 0
        ? [...trendingSection.templates, ...trendingSection.templates]
        : [];

    return (
        <div className="animate-fade-in pb-20"> {/* Added padding bottom for mobile nav if exists */}

            {templates.length === 0 && (
                <div className="text-center bg-base-200 dark:bg-dark-base-200 p-12 rounded-3xl mx-4 mt-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">The Marketplace is Empty!</h3>
                    <p className="text-content-200 dark:text-dark-content-200 mt-2 mb-6">Be the first to create and share a new template with the community.</p>
                </div>
            )}

            <div className="space-y-12">
                {trendingSection.templates.length > 0 && (
                    <section className="overflow-hidden">
                        <div className="px-4 sm:px-6 lg:px-8 mb-6">
                            <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">
                                {trendingSection.name} 🔥
                            </h3>
                        </div>

                        {/* Scroll Container */}
                        <div className="relative w-full overflow-hidden">
                            <div className="flex animate-scroll w-max hover:pause">
                                {infiniteTrendingTemplates.map((template, index) => (
                                    <div key={`${template.id}-${index}`} className="w-[160px] sm:w-[200px] mx-2 sm:mx-3 shrink-0">
                                        <TemplateCard
                                            template={template}
                                            onSelect={() => onSelectTemplate(template)}
                                            aspectRatio={ASPECT_RATIOS[index % ASPECT_RATIOS.length]}
                                            user={user}
                                            onDelete={onDeleteTemplate}
                                            onEdit={onEditTemplate}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <div className="space-y-12 px-4 sm:px-6 lg:px-8">
                    {otherSections.map(categorySection => {
                        if (categorySection.templates.length === 0) return null;
                        return (
                            <section key={categorySection.name}>
                                <h3 className="text-xl font-bold text-content-100 dark:text-dark-content-100 mb-6 flex items-center gap-2">
                                    {categorySection.name}
                                    <span className="text-sm font-normal text-content-300 dark:text-dark-content-300 bg-base-200 dark:bg-dark-base-200 px-2 py-0.5 rounded-full">
                                        {categorySection.templates.length}
                                    </span>
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                    {categorySection.templates.map((template, index) => (
                                        <TemplateCard
                                            key={template.id}
                                            template={template}
                                            onSelect={() => onSelectTemplate(template)}
                                            aspectRatio={ASPECT_RATIOS[index % ASPECT_RATIOS.length]}
                                            user={user}
                                            onDelete={onDeleteTemplate}
                                            onEdit={onEditTemplate}
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
