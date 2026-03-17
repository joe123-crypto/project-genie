import React from 'react';
import { Outfit } from '../types';
import OutfitCard from './OutfitCard';
import { studioClasses } from '../utils/theme';

interface OutfitsViewProps {
  outfits: Outfit[];
  onSelectOutfit: (outfit: Outfit) => void;
}

const OutfitsView: React.FC<OutfitsViewProps> = ({ outfits, onSelectOutfit }) => {
  if (outfits.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className={`${studioClasses.emptyState} mx-4 mt-8 p-12 text-center`}>
          <h3 className="landing-display text-4xl text-content-100 dark:text-dark-content-100">
            No Outfits Yet!
          </h3>
          <p className="mt-2 mb-6 text-content-200 dark:text-dark-content-200">
            Save the first outfit to start building this section.
          </p>
        </div>
      </div>
    );
  }

  const groupedOutfits = outfits.reduce((acc, outfit) => {
    const key = outfit.name || 'Others';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(outfit);
    return acc;
  }, {} as Record<string, Outfit[]>);

  const brandSections = Object.keys(groupedOutfits).filter(name => name !== 'Others');
  const otherSection = groupedOutfits['Others'];

  return (
    <div className="animate-fade-in pb-20">
      {brandSections.map(brandName => (
        <section key={brandName} className="mb-8">
          <h3 className="landing-display mb-4 text-3xl text-content-100 dark:text-dark-content-100">{brandName}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {groupedOutfits[brandName].map(outfit => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onSelect={() => onSelectOutfit(outfit)}
              />
            ))}
          </div>
        </section>
      ))}

      {otherSection && otherSection.length > 0 && (
        <section className="mb-8">
          <h3 className="landing-display mb-4 text-3xl text-content-100 dark:text-dark-content-100">Others</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {otherSection.map(outfit => (
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
  );
};

export default OutfitsView;
