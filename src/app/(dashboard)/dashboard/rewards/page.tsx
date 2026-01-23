'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Gift,
  Coins,
  Star,
  Sparkles,
  Crown,
  Palette,
  Rocket,
  Zap,
  Heart,
  Trophy,
  ShoppingBag,
  Lock,
  CheckCircle2,
  Clock,
  Ticket,
  Award,
} from 'lucide-react';

// Mock user data
const userData = {
  xp: 12800,
  level: 6,
};

// Reward items
const rewardCategories = {
  avatarItems: [
    { id: 'a1', name: 'Rainbow Hair Color', description: 'Stand out with vibrant rainbow hair!', cost: 1500, icon: Palette, category: 'avatar', type: 'hair_color', rarity: 'legendary', owned: false },
    { id: 'a2', name: 'Golden Crown', description: 'Show your royal status', cost: 2000, icon: Crown, category: 'avatar', type: 'accessory', rarity: 'legendary', owned: false },
    { id: 'a3', name: 'Astronaut Suit', description: 'Blast off in style!', cost: 1200, icon: Rocket, category: 'avatar', type: 'outfit', rarity: 'rare', owned: false },
    { id: 'a4', name: 'Lightning Aura', description: 'Electric energy surrounds you', cost: 800, icon: Zap, category: 'avatar', type: 'effect', rarity: 'rare', owned: true },
    { id: 'a5', name: 'Heart Frame', description: 'A lovely profile frame', cost: 500, icon: Heart, category: 'avatar', type: 'frame', rarity: 'uncommon', owned: false },
    { id: 'a6', name: 'Space Background', description: 'The cosmos as your backdrop', cost: 1000, icon: Star, category: 'avatar', type: 'background', rarity: 'rare', owned: false },
  ],
  profilePerks: [
    { id: 'p1', name: 'Custom Profile Banner', description: 'Upload your own banner image', cost: 2500, icon: Sparkles, category: 'profile', rarity: 'legendary', owned: false },
    { id: 'p2', name: 'Animated Avatar Border', description: 'Glowing animated border', cost: 1800, icon: Zap, category: 'profile', rarity: 'legendary', owned: false },
    { id: 'p3', name: 'Profile Badge: Early Adopter', description: 'Show you were here from the start', cost: 1000, icon: Award, category: 'profile', rarity: 'rare', owned: true },
    { id: 'p4', name: 'Custom Status Message', description: 'Set a custom status others can see', cost: 600, icon: Star, category: 'profile', rarity: 'uncommon', owned: false },
  ],
  experiences: [
    { id: 'e1', name: '1-on-1 Mentor Session', description: 'Schedule an extra session with your mentor', cost: 5000, icon: Trophy, category: 'experience', rarity: 'legendary', limited: true, stock: 5, owned: false },
    { id: 'e2', name: 'Early Access: New Tracks', description: 'Be first to try new learning content', cost: 3000, icon: Rocket, category: 'experience', rarity: 'rare', limited: false, owned: false },
    { id: 'e3', name: 'Feature Request Priority', description: 'Submit a feature idea with priority review', cost: 2000, icon: Sparkles, category: 'experience', rarity: 'rare', limited: true, stock: 10, owned: false },
    { id: 'e4', name: 'Shoutout in Newsletter', description: 'Get featured in the family newsletter', cost: 1500, icon: Star, category: 'experience', rarity: 'uncommon', limited: true, stock: 3, owned: false },
  ],
  boosts: [
    { id: 'b1', name: 'Double XP Weekend', description: 'Earn 2x XP for a full weekend', cost: 800, icon: Zap, category: 'boost', duration: '48 hours', rarity: 'rare', owned: false },
    { id: 'b2', name: 'Streak Shield', description: 'Protects your streak for one missed day', cost: 400, icon: Heart, category: 'boost', duration: '1 use', rarity: 'uncommon', owned: true, quantity: 2 },
    { id: 'b3', name: 'Quiz Retry Token', description: 'Get an extra quiz attempt', cost: 300, icon: Ticket, category: 'boost', duration: '1 use', rarity: 'common', owned: true, quantity: 3 },
    { id: 'b4', name: 'XP Boost (50%)', description: '50% more XP for 24 hours', cost: 500, icon: Star, category: 'boost', duration: '24 hours', rarity: 'uncommon', owned: false },
  ],
};

const rarityColors = {
  common: 'bg-gray-100 text-gray-700 border-gray-200',
  uncommon: 'bg-green-100 text-green-700 border-green-200',
  rare: 'bg-blue-100 text-blue-700 border-blue-200',
  legendary: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border-orange-200',
};

const rarityGlow = {
  common: '',
  uncommon: 'hover:shadow-green-200/50',
  rare: 'hover:shadow-blue-300/50',
  legendary: 'hover:shadow-yellow-300/50 ring-2 ring-yellow-300/30',
};

export default function RewardsShopPage() {
  const [activeTab, setActiveTab] = useState('avatar');
  const [purchasedItem, setPurchasedItem] = useState<string | null>(null);

  const handlePurchase = (item: any) => {
    // Would call API to purchase item
    setPurchasedItem(item.name);
    setTimeout(() => setPurchasedItem(null), 3000);
  };

  const renderRewardCard = (item: any) => {
    const canAfford = userData.xp >= item.cost;
    const Icon = item.icon;

    return (
      <Card
        key={item.id}
        className={`relative overflow-hidden transition-all hover:shadow-lg ${
          rarityGlow[item.rarity as keyof typeof rarityGlow]
        } ${item.owned ? 'border-green-300 bg-green-50/30' : ''}`}
      >
        {item.rarity === 'legendary' && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-orange-400/5 to-red-400/5" />
        )}

        {item.limited && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
              <Clock className="h-3 w-3 mr-1" />
              {item.stock} left
            </Badge>
          </div>
        )}

        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-xl ${
              item.rarity === 'legendary'
                ? 'bg-gradient-to-br from-yellow-100 to-orange-100'
                : item.rarity === 'rare'
                ? 'bg-blue-100'
                : item.rarity === 'uncommon'
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}>
              <Icon className={`h-8 w-8 ${
                item.rarity === 'legendary'
                  ? 'text-orange-600'
                  : item.rarity === 'rare'
                  ? 'text-blue-600'
                  : item.rarity === 'uncommon'
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold truncate">{item.name}</h3>
                {item.owned && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

              <div className="flex items-center gap-2 mb-3">
                <Badge className={rarityColors[item.rarity as keyof typeof rarityColors]}>
                  {item.rarity}
                </Badge>
                {item.duration && (
                  <Badge variant="outline" className="text-xs">
                    {item.duration}
                  </Badge>
                )}
                {item.quantity && (
                  <Badge variant="secondary" className="text-xs">
                    Owned: {item.quantity}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold text-lg">{item.cost.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">XP</span>
                </div>

                {item.owned && !item.quantity ? (
                  <Button disabled variant="outline" className="text-green-600">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Owned
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        disabled={!canAfford}
                        className={canAfford ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600' : ''}
                      >
                        {canAfford ? (
                          <>
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            {item.quantity ? 'Buy More' : 'Purchase'}
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-1" />
                            Need {(item.cost - userData.xp).toLocaleString()} XP
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to purchase <strong>{item.name}</strong> for{' '}
                          <strong>{item.cost.toLocaleString()} XP</strong>?
                          <br /><br />
                          You&apos;ll have {(userData.xp - item.cost).toLocaleString()} XP remaining.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handlePurchase(item)}>
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          Confirm Purchase
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8 p-8">
      {/* Purchase Success Toast */}
      {purchasedItem && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Card className="bg-green-50 border-green-200 shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Successfully purchased {purchasedItem}!</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
          Rewards Shop
        </h1>
        <p className="text-muted-foreground">
          Spend your hard-earned XP on awesome rewards!
        </p>
      </div>

      {/* XP Balance */}
      <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-xl">
                <Coins className="h-10 w-10" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Your Balance</p>
                <p className="text-4xl font-bold">{userData.xp.toLocaleString()} XP</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-white/80 text-sm">Level {userData.level}</p>
              <p className="text-lg">Keep earning to unlock more!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
          <TabsTrigger value="avatar" className="flex items-center gap-1">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Avatar</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="experiences" className="flex items-center gap-1">
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">Experiences</span>
          </TabsTrigger>
          <TabsTrigger value="boosts" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Boosts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avatar" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardCategories.avatarItems.map(renderRewardCard)}
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardCategories.profilePerks.map(renderRewardCard)}
          </div>
        </TabsContent>

        <TabsContent value="experiences" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardCategories.experiences.map(renderRewardCard)}
          </div>
        </TabsContent>

        <TabsContent value="boosts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardCategories.boosts.map(renderRewardCard)}
          </div>
        </TabsContent>
      </Tabs>

      {/* How to Earn XP */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-green-600" />
            How to Earn More XP
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-white rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">+50</p>
              <p className="text-xs text-muted-foreground">Complete Lesson</p>
            </div>
            <div className="p-3 bg-white rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">+100</p>
              <p className="text-xs text-muted-foreground">Pass Quiz</p>
            </div>
            <div className="p-3 bg-white rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">+200</p>
              <p className="text-xs text-muted-foreground">Earn Badge</p>
            </div>
            <div className="p-3 bg-white rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">+750</p>
              <p className="text-xs text-muted-foreground">30-Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
