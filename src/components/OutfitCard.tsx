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
      className="bg-base-200 dark:bg-dark-base-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-brand-primary/20 flex flex-col h-full"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={outfit.previewImageUrl}
          alt={outfit.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 left-2 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm uppercase tracking-wider">
          Free
        </div>
        {outfit.type && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md border border-white/10">
            {outfit.type}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-bold text-content-100 dark:text-dark-content-100 line-clamp-1 group-hover:text-brand-primary dark:group-hover:text-dark-brand-primary transition-colors">
            {outfit.name}
          </h3>
        </div>

        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-xs">
            {'★'.repeat(5)}
          </div>
          <span className="text-[10px] text-content-300 dark:text-dark-content-300 ml-1">
            ({outfit.accessCount || Math.floor(Math.random() * 50) + 10})
          </span>
        </div>

        <p className="text-content-200 dark:text-dark-content-200 text-xs line-clamp-2 mb-3 flex-grow">
          {outfit.description}
        </p>

        <button className="w-full bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white text-xs font-bold py-2 rounded-lg transition-colors duration-200 mt-auto">
          GET
        </button>
      </div>
    </div>
  );
};

export default OutfitCard;
