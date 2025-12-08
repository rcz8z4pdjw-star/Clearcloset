import { ClothingItem } from '../types';
import { Heart, Calendar, Tag, MoreVertical } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useState } from 'react';

interface ClothingCardProps {
  item: ClothingItem;
  onToggleFavorite: () => void;
  onLogWear: () => void;
  onClick: () => void;
  onDelete?: () => void;
}

export function ClothingCard({
  item,
  onToggleFavorite,
  onLogWear,
  onClick,
  onDelete,
}: ClothingCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const lastWornText = item.lastWorn
    ? formatDistanceToNow(parseISO(item.lastWorn), { addSuffix: true })
    : 'Never worn';

  const categoryColors: Record<string, string> = {
    tops: 'bg-blue-100 text-blue-700',
    bottoms: 'bg-green-100 text-green-700',
    dresses: 'bg-pink-100 text-pink-700',
    outerwear: 'bg-orange-100 text-orange-700',
    shoes: 'bg-purple-100 text-purple-700',
    accessories: 'bg-yellow-100 text-yellow-700',
    activewear: 'bg-red-100 text-red-700',
    formalwear: 'bg-indigo-100 text-indigo-700',
    sleepwear: 'bg-gray-100 text-gray-700',
    swimwear: 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="relative aspect-square cursor-pointer" onClick={onClick}>
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${
              item.favorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
        {item.wearCount === 0 && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
            Never worn
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
            {item.brand && (
              <p className="text-sm text-gray-500">{item.brand}</p>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[120px] z-10">
                <button
                  onClick={() => {
                    onLogWear();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Log wear
                </button>
                <button
                  onClick={() => {
                    onClick();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Edit details
                </button>
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              categoryColors[item.category] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {item.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Tag className="w-3 h-3" />
            {item.color}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {lastWornText}
          </span>
          <span className="text-xs font-medium text-gray-600">
            Worn {item.wearCount}x
          </span>
        </div>
      </div>
    </div>
  );
}
