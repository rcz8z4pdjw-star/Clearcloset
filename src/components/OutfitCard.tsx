import { ClothingItem, Outfit } from '../types';
import { Heart, Calendar, Trash2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface OutfitCardProps {
  outfit: Outfit;
  items: ClothingItem[];
  onWear: () => void;
  onDelete: () => void;
}

export function OutfitCard({ outfit, items, onWear, onDelete }: OutfitCardProps) {
  const outfitItems = outfit.itemIds
    .map(id => items.find(item => item.id === id))
    .filter(Boolean) as ClothingItem[];

  const lastWornText = outfit.lastWorn
    ? formatDistanceToNow(parseISO(outfit.lastWorn), { addSuffix: true })
    : 'Never worn';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Images Grid */}
      <div className="grid grid-cols-3 gap-1 aspect-[3/2]">
        {outfitItems.slice(0, 3).map((item, index) => (
          <div key={item.id} className="relative overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {outfitItems.length > 3 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            +{outfitItems.length - 3} more
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium text-gray-900">{outfit.name}</h3>
            <p className="text-sm text-gray-500">
              {outfitItems.length} items
            </p>
          </div>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {outfit.occasions.map(occasion => (
            <span
              key={occasion}
              className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full capitalize"
            >
              {occasion}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {lastWornText}
          </span>
          <button
            onClick={onWear}
            className="px-3 py-1 bg-primary-500 text-white text-sm font-medium rounded-full hover:bg-primary-600 transition-colors"
          >
            Wear Today
          </button>
        </div>
      </div>
    </div>
  );
}
