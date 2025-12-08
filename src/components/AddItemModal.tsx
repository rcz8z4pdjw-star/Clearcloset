import { useState, useRef, ChangeEvent } from 'react';
import { X, Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { ClothingCategory, ClothingColor, Season, Occasion, ClothingItem } from '../types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<ClothingItem, 'id' | 'createdAt' | 'wearCount'>) => void;
}

const categories: { value: ClothingCategory; label: string }[] = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'activewear', label: 'Activewear' },
  { value: 'formalwear', label: 'Formalwear' },
  { value: 'sleepwear', label: 'Sleepwear' },
  { value: 'swimwear', label: 'Swimwear' },
];

const colors: { value: ClothingColor; label: string; hex: string }[] = [
  { value: 'black', label: 'Black', hex: '#000000' },
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'gray', label: 'Gray', hex: '#6B7280' },
  { value: 'navy', label: 'Navy', hex: '#1E3A5F' },
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'pink', label: 'Pink', hex: '#EC4899' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'green', label: 'Green', hex: '#22C55E' },
  { value: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { value: 'orange', label: 'Orange', hex: '#F97316' },
  { value: 'brown', label: 'Brown', hex: '#92400E' },
  { value: 'beige', label: 'Beige', hex: '#D4B896' },
  { value: 'multicolor', label: 'Multi', hex: 'linear-gradient(90deg, #EF4444, #EAB308, #22C55E, #3B82F6)' },
];

const seasons: Season[] = ['spring', 'summer', 'fall', 'winter', 'all'];
const occasions: Occasion[] = ['casual', 'work', 'formal', 'athletic', 'evening', 'vacation', 'date'];

export function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('tops');
  const [color, setColor] = useState<ClothingColor>('black');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>(['all']);
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>(['casual']);
  const [condition, setCondition] = useState<ClothingItem['condition']>('good');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!name || !imageUrl) return;

    onAdd({
      name,
      category,
      color,
      brand: brand || undefined,
      size: size || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      imageUrl,
      seasons: selectedSeasons,
      occasions: selectedOccasions,
      favorite: false,
      condition,
    });

    // Reset form
    setImageUrl('');
    setName('');
    setCategory('tops');
    setColor('black');
    setBrand('');
    setSize('');
    setPurchasePrice('');
    setSelectedSeasons(['all']);
    setSelectedOccasions(['casual']);
    setCondition('good');
    onClose();
  };

  const toggleSeason = (season: Season) => {
    if (season === 'all') {
      setSelectedSeasons(['all']);
    } else {
      setSelectedSeasons(prev => {
        const without = prev.filter(s => s !== 'all' && s !== season);
        if (prev.includes(season)) {
          return without.length ? without : ['all'];
        }
        return [...without, season];
      });
    }
  };

  const toggleOccasion = (occasion: Occasion) => {
    setSelectedOccasions(prev => {
      if (prev.includes(occasion)) {
        return prev.length > 1 ? prev.filter(o => o !== occasion) : prev;
      }
      return [...prev, occasion];
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            {imageUrl ? (
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Take Photo</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">Upload</span>
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Blue Cotton T-Shirt"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    category === value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map(({ value, label, hex }) => (
                <button
                  key={value}
                  onClick={() => setColor(value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    color === value
                      ? 'ring-2 ring-primary-500 ring-offset-2'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{
                      background: hex.startsWith('linear') ? hex : hex,
                    }}
                  />
                  <span className="text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purchase Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
          </div>

          {/* Seasons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seasons
            </label>
            <div className="flex flex-wrap gap-2">
              {seasons.map((season) => (
                <button
                  key={season}
                  onClick={() => toggleSeason(season)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                    selectedSeasons.includes(season)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {/* Occasions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occasions
            </label>
            <div className="flex flex-wrap gap-2">
              {occasions.map((occasion) => (
                <button
                  key={occasion}
                  onClick={() => toggleOccasion(occasion)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                    selectedOccasions.includes(occasion)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {occasion}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <div className="flex gap-2">
              {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => (
                <button
                  key={cond}
                  onClick={() => setCondition(cond)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    condition === cond
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!name || !imageUrl}
            className="w-full py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add to Wardrobe
          </button>
        </div>
      </div>
    </div>
  );
}
