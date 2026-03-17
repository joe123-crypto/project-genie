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
      className="group studio-card-hover relative h-full cursor-pointer overflow-hidden rounded-[1.7rem] border border-border-color bg-base-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:border-dark-border-color dark:bg-dark-base-100"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={outfit.previewImageUrl}
          alt={outfit.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-65 transition-opacity duration-300 group-hover:opacity-85" />
        <div className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm backdrop-blur dark:bg-black/50 dark:text-white">
          Outfit
        </div>
        {outfit.type ? (
          <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm">
            {outfit.type}
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="truncate text-base font-bold drop-shadow-md">
            {outfit.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-white/75 sm:text-sm">
            {outfit.description}
          </p>
          <div className="mt-3 flex items-center justify-between text-[0.7rem] uppercase tracking-[0.18em] text-white/65">
            <span>{outfit.accessCount || 0} uses</span>
            {outfit.username ? <span className="truncate max-w-[50%]">by {outfit.username}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutfitCard;
