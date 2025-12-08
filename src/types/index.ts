export type ClothingCategory =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'activewear'
  | 'formalwear'
  | 'sleepwear'
  | 'swimwear';

export type ClothingColor =
  | 'black'
  | 'white'
  | 'gray'
  | 'navy'
  | 'blue'
  | 'red'
  | 'pink'
  | 'purple'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'brown'
  | 'beige'
  | 'multicolor';

export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'all';

export type Occasion =
  | 'casual'
  | 'work'
  | 'formal'
  | 'athletic'
  | 'evening'
  | 'vacation'
  | 'date';

export type Marketplace = 'poshmark' | 'thredup' | 'depop' | 'ebay' | 'mercari';

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  color: ClothingColor;
  brand?: string;
  size?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  imageUrl: string;
  seasons: Season[];
  occasions: Occasion[];
  favorite: boolean;
  createdAt: string;
  lastWorn?: string;
  wearCount: number;
  notes?: string;
  estimatedValue?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface WearLog {
  id: string;
  itemId: string;
  date: string;
  occasion?: Occasion;
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  occasions: Occasion[];
  seasons: Season[];
  favorite: boolean;
  createdAt: string;
  wearCount: number;
  lastWorn?: string;
}

export interface PackingList {
  id: string;
  name: string;
  destination?: string;
  startDate: string;
  endDate: string;
  itemIds: string[];
  outfitIds: string[];
  createdAt: string;
}

export interface ResaleRecommendation {
  itemId: string;
  reason: string;
  estimatedPrice: number;
  recommendedMarketplaces: {
    marketplace: Marketplace;
    estimatedSalePrice: number;
    estimatedFees: number;
    timeToSell: string;
  }[];
  listingTitle?: string;
  listingDescription?: string;
}

export interface ClosetAnalytics {
  totalItems: number;
  totalValue: number;
  categoryBreakdown: Record<ClothingCategory, number>;
  colorBreakdown: Record<ClothingColor, number>;
  wornLast30Days: number;
  wornLast90Days: number;
  neverWorn: number;
  mostWorn: ClothingItem[];
  leastWorn: ClothingItem[];
  costPerWear: { item: ClothingItem; cpw: number }[];
  utilizationRate: number;
  potentialResaleValue: number;
}

export interface UserPreferences {
  favoriteColors: ClothingColor[];
  preferredStyle: string[];
  bodyType?: string;
  lifestyle: Occasion[];
}

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface User {
  id: string;
  name: string;
  email: string;
  subscription: SubscriptionTier;
  preferences: UserPreferences;
  createdAt: string;
}

export interface AppState {
  user: User | null;
  items: ClothingItem[];
  wearLogs: WearLog[];
  outfits: Outfit[];
  packingLists: PackingList[];
}
