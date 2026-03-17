
import React from 'react';
import { Hairstyle, User } from '../types';
import HairstyleCard from './HairstyleCard';
import { studioClasses } from '../utils/theme';

interface HairstylesViewProps {
    hairstyles: Hairstyle[];
    onSelectHairstyle: (hairstyle: Hairstyle) => void;
    user?: User | null;
    onDeleteHairstyle?: (id: string) => Promise<void>;
    onEditHairstyle?: (hairstyle: Hairstyle) => void;
}

const HairstylesView: React.FC<HairstylesViewProps> = ({
    hairstyles,
    onSelectHairstyle,
    user,
    onDeleteHairstyle,
    onEditHairstyle
}) => {

    const groupedHairstyles = hairstyles.reduce((acc, hairstyle) => {
        const key = hairstyle.gender || 'Others';
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(hairstyle);
        return acc;
    }, {} as Record<string, Hairstyle[]>);

    const sections = Object.keys(groupedHairstyles).sort();

    return (
        <div className="animate-fade-in pb-20">
            {hairstyles.length === 0 && (
                <div className={`${studioClasses.emptyState} mx-4 mt-8 p-12 text-center`}>
                    <h3 className="landing-display text-4xl text-content-100 dark:text-dark-content-100">No Hairstyles Yet!</h3>
                    <p className="text-content-200 dark:text-dark-content-200 mt-2 mb-6">Create the first hairstyle.</p>
                </div>
            )}

            {sections.map(sectionName => (
                <section key={sectionName} className="mb-8">
                    <h3 className="landing-display mb-4 text-3xl capitalize text-content-100 dark:text-dark-content-100">{sectionName} Styles</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                        {groupedHairstyles[sectionName].map(hairstyle => (
                            <HairstyleCard
                                key={hairstyle.id}
                                hairstyle={hairstyle}
                                onSelect={() => onSelectHairstyle(hairstyle)}
                                user={user}
                                onDelete={onDeleteHairstyle}
                                onEdit={onEditHairstyle}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
};

export default HairstylesView;
