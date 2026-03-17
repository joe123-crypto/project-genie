import React, { useMemo } from 'react';
import { Template, User } from '../types';
import TemplateCard from './TemplateCard';
import { studioClasses } from '../utils/theme';

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
        const trendingTemplates = sortedTemplates.slice(0, 5).filter((template) => (template.accessCount || 0) > 0);
        const trendingIds = new Set(trendingTemplates.map((template) => template.id));
        const otherTemplates = templates.filter((template) => !trendingIds.has(template.id));

        const categoriesMap = new Map<string, Template[]>();
        const validCategories = new Set(['Fun', 'Useful', 'Futuristic', 'Hair Styles', 'Other']);

        otherTemplates.forEach((template) => {
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

        const otherSections = sortedCategoryNames.map((categoryName) => ({
            name: categoryName,
            templates: categoriesMap.get(categoryName) || [],
        }));

        return { trendingSection: { name: 'Trending', templates: trendingTemplates }, otherSections };
    }, [templates]);

    const infiniteTrendingTemplates = trendingSection.templates.length > 0
        ? [...trendingSection.templates, ...trendingSection.templates]
        : [];

    return (
        <div className="animate-fade-in pb-20">
            {templates.length === 0 && (
                <div className={`${studioClasses.emptyState} mx-4 mt-8 p-12 text-center`}>
                    <h3 className="landing-display text-4xl text-content-100 dark:text-dark-content-100">
                        The marketplace is empty
                    </h3>
                    <p className="mt-3 text-content-200 dark:text-dark-content-200">
                        Be the first to create and share a new template with the community.
                    </p>
                </div>
            )}

            <div className="space-y-14">
                {trendingSection.templates.length > 0 && (
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
                                {infiniteTrendingTemplates.map((template, index) => (
                                    <div key={`${template.id}-${index}`} className="mx-2 w-[170px] shrink-0 sm:mx-3 sm:w-[210px]">
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
                    {otherSections.map((categorySection) => {
                        if (categorySection.templates.length === 0) return null;
                        return (
                            <section key={categorySection.name}>
                                <div className="mb-6 flex items-center gap-3">
                                    <h3 className="landing-display text-3xl text-content-100 dark:text-dark-content-100">
                                        {categorySection.name}
                                    </h3>
                                    <span className="studio-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-content-300 dark:text-dark-content-300">
                                        {categorySection.templates.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
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
