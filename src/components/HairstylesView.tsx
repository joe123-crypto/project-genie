
import React from 'react';
import { Hairstyle, User } from '../types';
import HairstyleCard from './HairstyleCard';

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
                <div className="text-center bg-base-200 dark:bg-dark-base-200 p-12 rounded-3xl mx-4 mt-8 shadow-sm">
                    <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100">No Hairstyles Yet!</h3>
                    <p className="text-content-200 dark:text-dark-content-200 mt-2 mb-6">Create the first hairstyle.</p>
                </div>
            )}

            {sections.map(sectionName => (
                <section key={sectionName} className="mb-8">
                    <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-4 capitalize">{sectionName} Styles</h3>
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
