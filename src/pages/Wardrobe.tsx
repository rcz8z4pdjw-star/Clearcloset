import { useState, useMemo } from 'react';
import { useApp } from '../store/context';
import { ClothingCard } from '../components/ClothingCard';
import { AddItemModal } from '../components/AddItemModal';
import { Plus, Search, Filter, SlidersHorizontal } from 'lucide-react';
import { ClothingCategory, ClothingColor } from '../types';

type SortOption = 'recent' | 'mostWorn' | 'leastWorn' | 'newest' | 'price';

export function Wardrobe() {
  const { state, actions } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');
  const [selectedColor, setSelectedColor] = useState<ClothingColor | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const categories: { value: ClothingCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'tops', label: 'Tops' },
    { value: 'bottoms', label: 'Bottoms' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'outerwear', label: 'Outerwear' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'activewear', label: 'Activewear' },
  ];

  const colors: { value: ClothingColor | 'all'; label: string }[] = [
    { value: 'all', label: 'All Colors' },
    { value: 'black', label: 'Black' },
    { value: 'white', label: 'White' },
    { value: 'gray', label: 'Gray' },
    { value: 'navy', label: 'Navy' },
    { value: 'blue', label: 'Blue' },
    { value: 'red', label: 'Red' },
    { value: 'pink', label: 'Pink' },
    { value: 'green', label: 'Green' },
    { value: 'brown', label: 'Brown' },
    { value: 'beige', label: 'Beige' },
  ];

  const filteredAndSortedItems = useMemo(() => {
    let items = [...state.items];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by color
    if (selectedColor !== 'all') {
      items = items.filter((item) => item.color === selectedColor);
    }

    // Sort
    switch (sortBy) {
      case 'recent':
        items.sort((a, b) => {
          if (!a.lastWorn && !b.lastWorn) return 0;
          if (!a.lastWorn) return 1;
          if (!b.lastWorn) return -1;
          return new Date(b.lastWorn).getTime() - new Date(a.lastWorn).getTime();
        });
        break;
      case 'mostWorn':
        items.sort((a, b) => b.wearCount - a.wearCount);
        break;
      case 'leastWorn':
        items.sort((a, b) => a.wearCount - b.wearCount);
        break;
      case 'newest':
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'price':
        items.sort((a, b) => (b.purchasePrice || 0) - (a.purchasePrice || 0));
        break;
    }

    return items;
  }, [state.items, searchQuery, selectedCategory, selectedColor, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="sticky top-14 bg-gray-50 pt-2 pb-3 -mx-4 px-4 z-30">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search your wardrobe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showFilters
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 space-y-3">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {categories.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedCategory(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === value
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Color & Sort */}
            <div className="flex gap-2">
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value as ClothingColor | 'all')}
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm"
              >
                {colors.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 px-3 py-2 bg-white rounded-xl border border-gray-200 text-sm"
              >
                <option value="recent">Recently Worn</option>
                <option value="mostWorn">Most Worn</option>
                <option value="leastWorn">Least Worn</option>
                <option value="newest">Newest Added</option>
                <option value="price">Highest Price</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Item Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filteredAndSortedItems.length} items
          {searchQuery || selectedCategory !== 'all' || selectedColor !== 'all'
            ? ' found'
            : ' in wardrobe'}
        </p>
      </div>

      {/* Items Grid */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filteredAndSortedItems.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              onToggleFavorite={() => actions.toggleFavorite(item.id)}
              onLogWear={() => actions.logWear(item.id)}
              onClick={() => {
                // TODO: Open detail modal
              }}
              onDelete={() => actions.deleteItem(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {state.items.length === 0
              ? 'Your wardrobe is empty'
              : 'No items match your filters'}
          </p>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-600 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Modal */}
      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={actions.addItem}
      />
    </div>
  );
}
