import { useState } from 'react';
import { useApp } from '../store/context';
import { suggestOutfits } from '../utils/analytics';
import { Occasion, Season, ClothingItem } from '../types';
import { Sparkles, Plus, Check, X } from 'lucide-react';
import { OutfitCard } from '../components/OutfitCard';

export function Outfits() {
  const { state, actions } = useApp();
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | ''>('');
  const [selectedSeason, setSelectedSeason] = useState<Season | ''>('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [outfitName, setOutfitName] = useState('');

  const occasions: Occasion[] = ['casual', 'work', 'formal', 'athletic', 'evening', 'vacation', 'date'];
  const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];

  const suggestions = suggestOutfits(
    state.items,
    selectedOccasion || undefined,
    selectedSeason || undefined
  );

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const saveOutfit = () => {
    if (outfitName && selectedItems.length >= 2) {
      actions.addOutfit({
        name: outfitName,
        itemIds: selectedItems,
        occasions: selectedOccasion ? [selectedOccasion] : ['casual'],
        seasons: selectedSeason ? [selectedSeason] : ['all'],
        favorite: false,
      });
      setIsCreating(false);
      setSelectedItems([]);
      setOutfitName('');
    }
  };

  if (isCreating) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Outfit</h2>
          <button
            onClick={() => {
              setIsCreating(false);
              setSelectedItems([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name Input */}
        <input
          type="text"
          placeholder="Outfit name..."
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
        />

        {/* Selected Count */}
        <p className="text-sm text-gray-500">
          {selectedItems.length} items selected (minimum 2)
        </p>

        {/* Items Grid */}
        <div className="grid grid-cols-3 gap-2">
          {state.items.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItemSelection(item.id)}
              className={`relative aspect-square rounded-lg overflow-hidden ${
                selectedItems.includes(item.id) ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {selectedItems.includes(item.id) && (
                <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Save Button */}
        <button
          onClick={saveOutfit}
          disabled={!outfitName || selectedItems.length < 2}
          className="w-full py-4 bg-primary-500 text-white font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Save Outfit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">
            OCCASION
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            <button
              onClick={() => setSelectedOccasion('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedOccasion === ''
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            {occasions.map((occasion) => (
              <button
                key={occasion}
                onClick={() => setSelectedOccasion(occasion)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                  selectedOccasion === occasion
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {occasion}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">
            SEASON
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSeason('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedSeason === ''
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            {seasons.map((season) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  selectedSeason === season
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {season}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Outfits */}
      {state.outfits.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Your Outfits</h2>
          <div className="space-y-4">
            {state.outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                items={state.items}
                onWear={() => {
                  outfit.itemIds.forEach((id) => actions.logWear(id));
                }}
                onDelete={() => actions.deleteOutfit(outfit.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Suggested Outfits</h2>
          </div>
          <div className="space-y-4">
            {suggestions.map((outfitItems, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {outfitItems.map((item) => (
                    <div
                      key={item.id}
                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    {outfitItems.length} pieces
                  </p>
                  <button
                    onClick={() => {
                      outfitItems.forEach((item) => actions.logWear(item.id));
                    }}
                    className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full hover:bg-primary-200 transition-colors"
                  >
                    Wear Today
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.items.length < 3 && (
        <div className="text-center py-8 text-gray-500">
          <p>Add at least 3 items to get outfit suggestions</p>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={() => setIsCreating(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
