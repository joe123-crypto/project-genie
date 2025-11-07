import React from 'react';
import { Outfit } from '../types';
import OutfitCard from './OutfitCard';

interface OutfitsViewProps {
  outfits: Outfit[];
  onSelectOutfit: (outfit: Outfit) => void;
}

const OutfitsView: React.FC<OutfitsViewProps> = ({ outfits, onSelectOutfit }) => {

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
    <div className="animate-fade-in">
      {brandSections.map(brandName => (
        <section key={brandName} className="mb-8">
          <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-4">{brandName}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
          <h3 className="text-2xl font-bold text-content-100 dark:text-dark-content-100 mb-4">Others</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
