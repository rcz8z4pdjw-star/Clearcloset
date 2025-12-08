import { useApp } from '../store/context';
import { calculateAnalytics, suggestOutfits, getResaleRecommendations } from '../utils/analytics';
import { Link } from 'react-router-dom';
import {
  Shirt,
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronRight,
  Sparkles,
  DollarSign,
  Plus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { generateSampleItems } from '../utils/sample-data';
import { useState } from 'react';

export function Dashboard() {
  const { state, actions } = useApp();
  const [loadingSample, setLoadingSample] = useState(false);

  const analytics = calculateAnalytics(state.items, state.wearLogs);
  const suggestedOutfits = suggestOutfits(state.items, 'casual');
  const resaleItems = getResaleRecommendations(state.items).slice(0, 3);

  const recentlyWorn = state.items
    .filter(item => item.lastWorn)
    .sort((a, b) => new Date(b.lastWorn!).getTime() - new Date(a.lastWorn!).getTime())
    .slice(0, 4);

  const loadSampleData = async () => {
    setLoadingSample(true);
    const samples = generateSampleItems();
    samples.forEach(item => {
      actions.addItem(item);
    });
    setLoadingSample(false);
  };

  if (state.items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Welcome to ClosetClear
        </h2>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Start by adding items from your wardrobe. We'll help you track what you wear
          and make smarter fashion decisions.
        </p>
        <div className="space-y-3">
          <Link
            to="/wardrobe"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Item
          </Link>
          <div>
            <button
              onClick={loadSampleData}
              disabled={loadingSample}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {loadingSample ? 'Loading...' : 'Or load sample data to explore'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Shirt className="w-4 h-4" />
            <span className="text-xs font-medium">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.totalItems}</p>
          <p className="text-xs text-gray-500 mt-1">
            ${analytics.totalValue.toLocaleString()} value
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Utilization</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(analytics.utilizationRate)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            worn in 90 days
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Never Worn</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analytics.neverWorn}</p>
          <p className="text-xs text-gray-500 mt-1">items waiting</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Resale Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${Math.round(analytics.potentialResaleValue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">potential</p>
        </div>
      </div>

      {/* Recently Worn */}
      {recentlyWorn.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Recently Worn</h2>
            <Link
              to="/wardrobe"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {recentlyWorn.map((item) => (
              <div key={item.id} className="aspect-square rounded-lg overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outfit Suggestion */}
      {suggestedOutfits.length > 0 && (
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h2 className="font-semibold text-gray-900">Try This Outfit</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestedOutfits[0]?.map((item) => (
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
          <Link
            to="/outfits"
            className="inline-flex items-center gap-1 text-sm text-primary-600 font-medium mt-2"
          >
            See more outfit ideas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Items to Consider Selling */}
      {resaleItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Consider Selling</h2>
            <Link
              to="/analytics"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {resaleItems.map((rec) => {
              const item = state.items.find((i) => i.id === rec.itemId);
              if (!item) return null;
              return (
                <div
                  key={rec.itemId}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{rec.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      ~${rec.estimatedPrice}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wear History Mini Calendar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">This Week</h2>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = format(date, 'yyyy-MM-dd');
            const wornItems = state.wearLogs.filter(
              (log) => log.date.split('T')[0] === dateStr
            );
            const hasWear = wornItems.length > 0;

            return (
              <div
                key={i}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs ${
                  hasWear ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <span className="font-medium">{format(date, 'EEE')}</span>
                <span>{format(date, 'd')}</span>
                {hasWear && (
                  <span className="text-[10px] font-bold mt-0.5">
                    {wornItems.length}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
