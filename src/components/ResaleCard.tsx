import { ClothingItem, ResaleRecommendation } from '../types';
import { DollarSign, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ResaleCardProps {
  item: ClothingItem;
  recommendation: ResaleRecommendation;
}

export function ResaleCard({ item, recommendation }: ResaleCardProps) {
  const [copied, setCopied] = useState(false);

  const copyListing = () => {
    const text = `${recommendation.listingTitle}\n\n${recommendation.listingDescription}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const marketplaceColors: Record<string, string> = {
    poshmark: 'bg-red-100 text-red-700',
    thredup: 'bg-green-100 text-green-700',
    depop: 'bg-orange-100 text-orange-700',
    ebay: 'bg-blue-100 text-blue-700',
    mercari: 'bg-purple-100 text-purple-700',
  };

  const marketplaceLogos: Record<string, string> = {
    poshmark: 'Poshmark',
    thredup: 'ThredUp',
    depop: 'Depop',
    ebay: 'eBay',
    mercari: 'Mercari',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex gap-4 p-4">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{recommendation.reason}</p>
          <div className="flex items-center gap-2 mt-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">
              ~${recommendation.estimatedPrice}
            </span>
            <span className="text-xs text-gray-400">estimated</span>
          </div>
        </div>
      </div>

      {/* Marketplace Recommendations */}
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs font-medium text-gray-500 mb-2">BEST PLATFORMS</p>
        <div className="space-y-2">
          {recommendation.recommendedMarketplaces.slice(0, 2).map((mp) => (
            <div
              key={mp.marketplace}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${marketplaceColors[mp.marketplace]}`}>
                  {marketplaceLogos[mp.marketplace]}
                </span>
                <span className="text-sm text-gray-600">{mp.timeToSell}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">${mp.estimatedSalePrice}</p>
                <p className="text-xs text-gray-400">-${mp.estimatedFees} fees</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-generated Listing */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">AUTO-GENERATED LISTING</p>
          <button
            onClick={copyListing}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {recommendation.listingTitle}
          </p>
          <p className="text-xs text-gray-600 line-clamp-2">
            {recommendation.listingDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
