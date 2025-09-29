import * as React from "react";
import { Outfit } from "../types";

interface OutfitCardProps {
  outfit: Outfit;
  onSelect: () => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({ outfit, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="bg-base-200 dark:bg-dark-base-200 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow group"
    >
      <div className="relative overflow-hidden rounded mb-4">
        <img 
          src={outfit.previewImageUrl} 
          alt={outfit.name} 
          className="w-full h-48 object-cover rounded transition-transform duration-300 group-hover:scale-105" 
        />
      </div>
      <h3 className="text-xl font-semibold text-content-100 dark:text-dark-content-100 mb-2 group-hover:text-brand-primary dark:group-hover:text-dark-brand-primary transition-colors">
        {outfit.name}
      </h3>
      <p className="text-content-200 dark:text-dark-content-200 text-sm leading-relaxed">
        {outfit.description}
      </p>
      {outfit.accessCount && outfit.accessCount > 0 && (
        <div className="mt-3 text-xs text-content-300 dark:text-dark-content-300">
          Used {outfit.accessCount} times
        </div>
      )}
    </div>
  );
};

export default OutfitCard;
