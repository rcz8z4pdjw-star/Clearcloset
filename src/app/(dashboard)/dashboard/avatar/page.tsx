'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, Check, Coins, Crown, Star, Palette, User, Shirt, Eye } from 'lucide-react';

// Avatar customization options
const avatarOptions = {
  skinTone: [
    { id: 'light', color: '#FFDBB4', unlocked: true },
    { id: 'medium-light', color: '#EDB98A', unlocked: true },
    { id: 'medium', color: '#D08B5B', unlocked: true },
    { id: 'medium-dark', color: '#AE5D29', unlocked: true },
    { id: 'dark', color: '#614335', unlocked: true },
  ],
  hairStyle: [
    { id: 'short', name: 'Short', unlocked: true, xpCost: 0 },
    { id: 'medium', name: 'Medium', unlocked: true, xpCost: 0 },
    { id: 'long', name: 'Long', unlocked: true, xpCost: 0 },
    { id: 'curly', name: 'Curly', unlocked: true, xpCost: 0 },
    { id: 'wavy', name: 'Wavy', unlocked: true, xpCost: 0 },
    { id: 'mohawk', name: 'Mohawk', unlocked: false, xpCost: 500 },
    { id: 'bun', name: 'Top Bun', unlocked: false, xpCost: 300 },
    { id: 'braids', name: 'Braids', unlocked: false, xpCost: 400 },
  ],
  hairColor: [
    { id: 'black', color: '#090806', unlocked: true },
    { id: 'brown', color: '#6A4E35', unlocked: true },
    { id: 'blonde', color: '#E6BE8A', unlocked: true },
    { id: 'red', color: '#B55239', unlocked: true },
    { id: 'gray', color: '#9A9A9A', unlocked: true },
    { id: 'blue', color: '#4A90D9', unlocked: false, xpCost: 600 },
    { id: 'purple', color: '#9B59B6', unlocked: false, xpCost: 600 },
    { id: 'pink', color: '#FF69B4', unlocked: false, xpCost: 600 },
    { id: 'green', color: '#2ECC71', unlocked: false, xpCost: 800 },
    { id: 'rainbow', color: 'linear-gradient(90deg, red, orange, yellow, green, blue, purple)', unlocked: false, xpCost: 1500, special: true },
  ],
  eyes: [
    { id: 'normal', name: 'Normal', unlocked: true },
    { id: 'happy', name: 'Happy', unlocked: true },
    { id: 'cool', name: 'Cool (Sunglasses)', unlocked: false, xpCost: 400 },
    { id: 'wink', name: 'Wink', unlocked: false, xpCost: 200 },
    { id: 'stars', name: 'Star Eyes', unlocked: false, xpCost: 800, special: true },
  ],
  accessories: [
    { id: 'none', name: 'None', unlocked: true },
    { id: 'glasses', name: 'Glasses', unlocked: true },
    { id: 'earrings', name: 'Earrings', unlocked: false, xpCost: 300 },
    { id: 'headphones', name: 'Headphones', unlocked: false, xpCost: 500 },
    { id: 'crown', name: 'Crown', unlocked: false, xpCost: 2000, special: true },
    { id: 'halo', name: 'Halo', unlocked: false, xpCost: 1500, special: true },
  ],
  outfits: [
    { id: 'casual', name: 'Casual', unlocked: true },
    { id: 'formal', name: 'Formal', unlocked: true },
    { id: 'sporty', name: 'Sporty', unlocked: false, xpCost: 400 },
    { id: 'hoodie', name: 'Hoodie', unlocked: false, xpCost: 300 },
    { id: 'suit', name: 'Business Suit', unlocked: false, xpCost: 800 },
    { id: 'astronaut', name: 'Astronaut', unlocked: false, xpCost: 1200, special: true },
    { id: 'superhero', name: 'Superhero Cape', unlocked: false, xpCost: 1500, special: true },
  ],
  backgrounds: [
    { id: 'blue', name: 'Sky Blue', color: '#E3F2FD', unlocked: true },
    { id: 'green', name: 'Mint Green', color: '#E8F5E9', unlocked: true },
    { id: 'purple', name: 'Lavender', color: '#F3E5F5', unlocked: true },
    { id: 'orange', name: 'Peach', color: '#FFF3E0', unlocked: true },
    { id: 'gradient-sunset', name: 'Sunset', color: 'linear-gradient(135deg, #FF6B6B, #FFE66D)', unlocked: false, xpCost: 500 },
    { id: 'gradient-ocean', name: 'Ocean', color: 'linear-gradient(135deg, #4ECDC4, #556270)', unlocked: false, xpCost: 500 },
    { id: 'gradient-aurora', name: 'Aurora', color: 'linear-gradient(135deg, #A8E063, #56AB2F, #5BD1D7)', unlocked: false, xpCost: 800, special: true },
    { id: 'space', name: 'Space', color: 'linear-gradient(135deg, #0F0C29, #302B63, #24243E)', unlocked: false, xpCost: 1000, special: true },
  ],
};

const userXP = 1650; // Mock user XP

export default function AvatarCustomizationPage() {
  const [selectedCategory, setSelectedCategory] = useState('skinTone');
  const [avatar, setAvatar] = useState({
    skinTone: 'medium-light',
    hairStyle: 'medium',
    hairColor: 'brown',
    eyes: 'normal',
    accessories: 'none',
    outfits: 'casual',
    backgrounds: 'blue',
  });

  const categories = [
    { id: 'skinTone', name: 'Skin', icon: User },
    { id: 'hairStyle', name: 'Hair', icon: User },
    { id: 'hairColor', name: 'Color', icon: Palette },
    { id: 'eyes', name: 'Eyes', icon: Eye },
    { id: 'accessories', name: 'Extras', icon: Crown },
    { id: 'outfits', name: 'Outfit', icon: Shirt },
    { id: 'backgrounds', name: 'BG', icon: Palette },
  ];

  const currentOptions = avatarOptions[selectedCategory as keyof typeof avatarOptions] || [];
  const currentSelection = avatar[selectedCategory as keyof typeof avatar];

  const handleSelect = (optionId: string) => {
    setAvatar(prev => ({
      ...prev,
      [selectedCategory]: optionId,
    }));
  };

  const getBackgroundStyle = () => {
    const bg = avatarOptions.backgrounds.find(b => b.id === avatar.backgrounds);
    if (!bg) return { backgroundColor: '#E3F2FD' };
    if (bg.color.includes('gradient')) {
      return { background: bg.color };
    }
    return { backgroundColor: bg.color };
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          Avatar Studio
        </h1>
        <p className="text-muted-foreground">
          Create your unique avatar! Unlock special items with XP.
        </p>
        <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-orange-500">
          <Coins className="h-3 w-3 mr-1" />
          {userXP.toLocaleString()} XP Available
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Preview */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Your Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            {/* Avatar Display */}
            <div
              className="w-48 h-48 rounded-full flex items-center justify-center shadow-xl relative overflow-hidden"
              style={getBackgroundStyle()}
            >
              {/* Simple avatar representation */}
              <div className="text-center">
                <div
                  className="w-24 h-24 rounded-full mx-auto mb-2 flex items-center justify-center text-4xl shadow-inner"
                  style={{
                    backgroundColor: avatarOptions.skinTone.find(s => s.id === avatar.skinTone)?.color,
                  }}
                >
                  {avatar.eyes === 'cool' ? '😎' :
                   avatar.eyes === 'wink' ? '😉' :
                   avatar.eyes === 'stars' ? '🤩' :
                   avatar.eyes === 'happy' ? '😊' : '🙂'}
                </div>
                {avatar.accessories === 'crown' && (
                  <Crown className="absolute top-6 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500" />
                )}
                {avatar.accessories === 'halo' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full border-4 border-yellow-400" />
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Items Unlocked</p>
              <div className="flex gap-4 justify-center">
                <div>
                  <p className="text-2xl font-bold text-green-500">24</p>
                  <p className="text-xs text-muted-foreground">Unlocked</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-muted-foreground">18</p>
                  <p className="text-xs text-muted-foreground">Locked</p>
                </div>
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
              <Check className="h-4 w-4 mr-2" />
              Save Avatar
            </Button>
          </CardContent>
        </Card>

        {/* Customization Options */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customize</CardTitle>
            <CardDescription>
              Select a category and choose your style
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={selectedCategory === cat.id ? 'bg-indigo-500 hover:bg-indigo-600' : ''}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {cat.name}
                  </Button>
                );
              })}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentOptions.map((option: any) => {
                const isSelected = currentSelection === option.id;
                const isLocked = !option.unlocked;
                const canAfford = userXP >= (option.xpCost || 0);

                return (
                  <button
                    key={option.id}
                    onClick={() => !isLocked && handleSelect(option.id)}
                    disabled={isLocked && !canAfford}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all
                      ${isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-500/20'
                        : 'border-border hover:border-indigo-200 hover:bg-muted/50'}
                      ${isLocked ? 'opacity-75' : ''}
                      ${option.special ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                    `}
                  >
                    {/* Color swatch or name */}
                    {option.color ? (
                      <div
                        className="w-12 h-12 rounded-full mx-auto mb-2 shadow-inner"
                        style={{
                          background: option.color.includes('gradient') ? option.color : option.color,
                          backgroundColor: !option.color.includes('gradient') ? option.color : undefined,
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-muted flex items-center justify-center text-2xl">
                        {option.name === 'Cool (Sunglasses)' ? '😎' :
                         option.name === 'Star Eyes' ? '🤩' :
                         option.name === 'Crown' ? '👑' :
                         option.name === 'Astronaut' ? '🚀' :
                         option.name === 'Superhero Cape' ? '🦸' :
                         option.name === 'Headphones' ? '🎧' :
                         '✨'}
                      </div>
                    )}

                    <p className="text-xs font-medium text-center truncate">
                      {option.name || option.id}
                    </p>

                    {/* Lock overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-white/60 rounded-xl flex flex-col items-center justify-center">
                        <Lock className="h-5 w-5 text-muted-foreground mb-1" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {option.xpCost} XP
                        </span>
                        {canAfford && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-1 h-6 text-xs text-indigo-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Unlock logic would go here
                            }}
                          >
                            Unlock
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Special item indicator */}
                    {option.special && (
                      <div className="absolute top-2 left-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unlockables Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-purple-100">
              <Star className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Earn XP to Unlock Special Items!</h3>
              <p className="text-sm text-muted-foreground">
                Complete lessons, pass quizzes, maintain streaks, and earn badges to gain XP.
                Use your XP to unlock exclusive avatar items like rainbow hair, space backgrounds,
                crowns, and superhero capes!
              </p>
              <div className="flex gap-4 mt-4">
                <Badge variant="outline">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Complete Lesson = 50 XP
                </Badge>
                <Badge variant="outline">
                  <Star className="h-3 w-3 mr-1" />
                  Pass Quiz = 100 XP
                </Badge>
                <Badge variant="outline">
                  <Crown className="h-3 w-3 mr-1" />
                  Earn Badge = 200 XP
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
