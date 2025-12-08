import { ClothingItem, WearLog, ClosetAnalytics, ClothingCategory, ClothingColor, Marketplace, ResaleRecommendation } from '../types';
import { differenceInDays, subDays, parseISO } from 'date-fns';

export function calculateAnalytics(items: ClothingItem[], wearLogs: WearLog[]): ClosetAnalytics {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const ninetyDaysAgo = subDays(now, 90);

  // Category breakdown
  const categoryBreakdown = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<ClothingCategory, number>);

  // Color breakdown
  const colorBreakdown = items.reduce((acc, item) => {
    acc[item.color] = (acc[item.color] || 0) + 1;
    return acc;
  }, {} as Record<ClothingColor, number>);

  // Items worn in last 30/90 days
  const wornLast30Days = items.filter(item => {
    if (!item.lastWorn) return false;
    return parseISO(item.lastWorn) >= thirtyDaysAgo;
  }).length;

  const wornLast90Days = items.filter(item => {
    if (!item.lastWorn) return false;
    return parseISO(item.lastWorn) >= ninetyDaysAgo;
  }).length;

  // Never worn items
  const neverWorn = items.filter(item => item.wearCount === 0).length;

  // Most worn items (top 5)
  const mostWorn = [...items]
    .sort((a, b) => b.wearCount - a.wearCount)
    .slice(0, 5);

  // Least worn items (excluding never worn, bottom 5)
  const leastWorn = [...items]
    .filter(item => item.wearCount > 0)
    .sort((a, b) => a.wearCount - b.wearCount)
    .slice(0, 5);

  // Cost per wear calculation
  const costPerWear = items
    .filter(item => item.purchasePrice && item.wearCount > 0)
    .map(item => ({
      item,
      cpw: item.purchasePrice! / item.wearCount,
    }))
    .sort((a, b) => b.cpw - a.cpw);

  // Total value
  const totalValue = items.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

  // Utilization rate (percentage of items worn in last 90 days)
  const utilizationRate = items.length > 0 ? (wornLast90Days / items.length) * 100 : 0;

  // Potential resale value (items not worn in 6 months)
  const sixMonthsAgo = subDays(now, 180);
  const potentialResaleValue = items
    .filter(item => {
      if (!item.lastWorn) return true;
      return parseISO(item.lastWorn) < sixMonthsAgo;
    })
    .reduce((sum, item) => sum + (item.estimatedValue || item.purchasePrice || 0) * 0.3, 0);

  return {
    totalItems: items.length,
    totalValue,
    categoryBreakdown,
    colorBreakdown,
    wornLast30Days,
    wornLast90Days,
    neverWorn,
    mostWorn,
    leastWorn,
    costPerWear,
    utilizationRate,
    potentialResaleValue,
  };
}

export function getResaleRecommendations(items: ClothingItem[]): ResaleRecommendation[] {
  const now = new Date();
  const sixMonthsAgo = subDays(now, 180);

  const candidates = items.filter(item => {
    if (item.wearCount === 0) return true;
    if (!item.lastWorn) return true;
    const lastWornDate = parseISO(item.lastWorn);
    return lastWornDate < sixMonthsAgo;
  });

  return candidates.map(item => {
    const basePrice = item.estimatedValue || (item.purchasePrice || 50) * 0.3;
    const conditionMultiplier = {
      excellent: 1.0,
      good: 0.8,
      fair: 0.5,
      poor: 0.3,
    }[item.condition];

    const estimatedPrice = Math.round(basePrice * conditionMultiplier);

    const reason = item.wearCount === 0
      ? "Never worn - perfect for resale"
      : `Not worn in ${differenceInDays(now, parseISO(item.lastWorn!))} days`;

    const marketplaces: ResaleRecommendation['recommendedMarketplaces'] = [
      {
        marketplace: 'poshmark' as Marketplace,
        estimatedSalePrice: estimatedPrice,
        estimatedFees: Math.round(estimatedPrice * 0.2),
        timeToSell: '1-2 weeks',
      },
      {
        marketplace: 'thredup' as Marketplace,
        estimatedSalePrice: Math.round(estimatedPrice * 0.7),
        estimatedFees: 0,
        timeToSell: '2-4 weeks',
      },
      {
        marketplace: 'depop' as Marketplace,
        estimatedSalePrice: Math.round(estimatedPrice * 1.1),
        estimatedFees: Math.round(estimatedPrice * 0.1),
        timeToSell: '1-3 weeks',
      },
    ];

    return {
      itemId: item.id,
      reason,
      estimatedPrice,
      recommendedMarketplaces: marketplaces,
      listingTitle: `${item.brand ? item.brand + ' ' : ''}${item.name} - ${item.condition} condition`,
      listingDescription: `Beautiful ${item.color} ${item.category.slice(0, -1)} in ${item.condition} condition. ${item.brand ? `Brand: ${item.brand}. ` : ''}${item.size ? `Size: ${item.size}. ` : ''}Perfect for ${item.occasions.join(', ')} occasions.`,
    };
  });
}

export function suggestOutfits(
  items: ClothingItem[],
  occasion?: string,
  season?: string
): ClothingItem[][] {
  let filteredItems = items;

  if (occasion) {
    filteredItems = filteredItems.filter(item =>
      item.occasions.includes(occasion as ClothingItem['occasions'][0])
    );
  }

  if (season) {
    filteredItems = filteredItems.filter(item =>
      item.seasons.includes(season as ClothingItem['seasons'][0]) ||
      item.seasons.includes('all')
    );
  }

  const tops = filteredItems.filter(item => item.category === 'tops');
  const bottoms = filteredItems.filter(item => item.category === 'bottoms');
  const dresses = filteredItems.filter(item => item.category === 'dresses');
  const shoes = filteredItems.filter(item => item.category === 'shoes');
  const outerwear = filteredItems.filter(item => item.category === 'outerwear');

  const outfits: ClothingItem[][] = [];

  // Add dress-based outfits
  dresses.forEach(dress => {
    const matchingShoes = shoes.filter(shoe =>
      colorCompatible(dress.color, shoe.color)
    );
    if (matchingShoes.length > 0) {
      outfits.push([dress, matchingShoes[0]]);
    }
  });

  // Add top + bottom outfits
  tops.forEach(top => {
    bottoms.forEach(bottom => {
      if (colorCompatible(top.color, bottom.color)) {
        const outfit = [top, bottom];
        const matchingShoes = shoes.filter(shoe =>
          colorCompatible(top.color, shoe.color) || colorCompatible(bottom.color, shoe.color)
        );
        if (matchingShoes.length > 0) {
          outfit.push(matchingShoes[0]);
        }
        outfits.push(outfit);
      }
    });
  });

  // Limit and prioritize less-worn items
  return outfits
    .sort((a, b) => {
      const aWearScore = a.reduce((sum, item) => sum + item.wearCount, 0);
      const bWearScore = b.reduce((sum, item) => sum + item.wearCount, 0);
      return aWearScore - bWearScore;
    })
    .slice(0, 10);
}

function colorCompatible(color1: ClothingColor, color2: ClothingColor): boolean {
  const neutrals: ClothingColor[] = ['black', 'white', 'gray', 'beige', 'navy'];

  if (neutrals.includes(color1) || neutrals.includes(color2)) {
    return true;
  }

  const complementary: Record<ClothingColor, ClothingColor[]> = {
    blue: ['orange', 'brown', 'beige'],
    red: ['green', 'beige'],
    pink: ['gray', 'navy', 'green'],
    purple: ['yellow', 'green'],
    green: ['red', 'pink', 'purple', 'brown'],
    yellow: ['purple', 'blue', 'gray'],
    orange: ['blue', 'navy'],
    brown: ['blue', 'green', 'beige'],
    black: [],
    white: [],
    gray: [],
    navy: [],
    beige: [],
    multicolor: [],
  };

  return complementary[color1]?.includes(color2) || color1 === color2;
}

export function generateShareableStats(analytics: ClosetAnalytics): {
  headline: string;
  stats: { label: string; value: string }[];
  insight: string;
} {
  const unwornPercent = analytics.totalItems > 0
    ? Math.round((analytics.neverWorn / analytics.totalItems) * 100)
    : 0;

  const worn30Percent = analytics.totalItems > 0
    ? Math.round((analytics.wornLast30Days / analytics.totalItems) * 100)
    : 0;

  const topCategory = Object.entries(analytics.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)[0];

  const headline = unwornPercent > 50
    ? `I haven't worn ${unwornPercent}% of my closet!`
    : `I actively wear ${Math.round(analytics.utilizationRate)}% of my wardrobe`;

  const insight = unwornPercent > 30
    ? `Time to declutter! ${analytics.neverWorn} items could find a new home.`
    : analytics.utilizationRate > 70
    ? "You're a wardrobe efficiency pro!"
    : "There's room to rediscover some forgotten gems.";

  return {
    headline,
    stats: [
      { label: 'Total Items', value: analytics.totalItems.toString() },
      { label: 'Worn This Month', value: `${worn30Percent}%` },
      { label: 'Never Worn', value: analytics.neverWorn.toString() },
      { label: 'Top Category', value: topCategory ? topCategory[0] : 'N/A' },
      { label: 'Closet Value', value: `$${analytics.totalValue.toLocaleString()}` },
      { label: 'Resale Potential', value: `$${Math.round(analytics.potentialResaleValue).toLocaleString()}` },
    ],
    insight,
  };
}
