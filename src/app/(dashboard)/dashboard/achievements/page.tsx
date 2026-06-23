'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Star,
  Lock,
  Flame,
  Target,
  BookOpen,
  Award,
  Crown,
  Rocket,
  Zap,
  Heart,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  Gift,
  Medal,
} from 'lucide-react';

// Achievement categories
const achievementCategories = [
  { id: 'all', label: 'All', icon: Trophy },
  { id: 'learning', label: 'Learning', icon: BookOpen },
  { id: 'streaks', label: 'Streaks', icon: Flame },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'special', label: 'Special', icon: Crown },
];

// All achievements data
const achievements = [
  // Learning achievements
  {
    id: 'first-lesson',
    category: 'learning',
    title: 'First Steps',
    description: 'Complete your first lesson',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
    rarity: 'common',
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-15',
    progress: 1,
    target: 1,
  },
  {
    id: 'lesson-streak-5',
    category: 'learning',
    title: 'Knowledge Seeker',
    description: 'Complete 5 lessons',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
    rarity: 'common',
    xpReward: 100,
    unlocked: true,
    unlockedAt: '2024-01-20',
    progress: 5,
    target: 5,
  },
  {
    id: 'lesson-streak-25',
    category: 'learning',
    title: 'Dedicated Learner',
    description: 'Complete 25 lessons',
    icon: Award,
    color: 'bg-blue-200 text-blue-700',
    rarity: 'uncommon',
    xpReward: 250,
    unlocked: true,
    unlockedAt: '2024-02-10',
    progress: 25,
    target: 25,
  },
  {
    id: 'lesson-streak-100',
    category: 'learning',
    title: 'Master Scholar',
    description: 'Complete 100 lessons',
    icon: Crown,
    color: 'bg-yellow-100 text-yellow-600',
    rarity: 'legendary',
    xpReward: 1000,
    unlocked: false,
    progress: 42,
    target: 100,
  },
  {
    id: 'quiz-ace',
    category: 'learning',
    title: 'Quiz Ace',
    description: 'Score 100% on any quiz',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-600',
    rarity: 'uncommon',
    xpReward: 150,
    unlocked: true,
    unlockedAt: '2024-01-25',
    progress: 1,
    target: 1,
  },
  {
    id: 'perfect-module',
    category: 'learning',
    title: 'Perfectionist',
    description: 'Complete a module with 100% quiz scores',
    icon: Trophy,
    color: 'bg-purple-100 text-purple-600',
    rarity: 'rare',
    xpReward: 500,
    unlocked: false,
    progress: 0,
    target: 1,
  },

  // Streak achievements
  {
    id: 'streak-3',
    category: 'streaks',
    title: 'Getting Started',
    description: 'Maintain a 3-day learning streak',
    icon: Flame,
    color: 'bg-orange-100 text-orange-600',
    rarity: 'common',
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-10',
    progress: 3,
    target: 3,
  },
  {
    id: 'streak-7',
    category: 'streaks',
    title: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: Flame,
    color: 'bg-orange-100 text-orange-600',
    rarity: 'uncommon',
    xpReward: 150,
    unlocked: true,
    unlockedAt: '2024-01-17',
    progress: 7,
    target: 7,
  },
  {
    id: 'streak-30',
    category: 'streaks',
    title: 'Monthly Master',
    description: 'Maintain a 30-day learning streak',
    icon: Zap,
    color: 'bg-orange-200 text-orange-700',
    rarity: 'rare',
    xpReward: 500,
    unlocked: false,
    progress: 14,
    target: 30,
  },
  {
    id: 'streak-100',
    category: 'streaks',
    title: 'Unstoppable',
    description: 'Maintain a 100-day learning streak',
    icon: Crown,
    color: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
    rarity: 'legendary',
    xpReward: 2000,
    unlocked: false,
    progress: 14,
    target: 100,
  },

  // Social achievements
  {
    id: 'first-connect',
    category: 'social',
    title: 'Making Friends',
    description: 'Connect with your first study buddy',
    icon: Users,
    color: 'bg-green-100 text-green-600',
    rarity: 'common',
    xpReward: 50,
    unlocked: true,
    unlockedAt: '2024-01-08',
    progress: 1,
    target: 1,
  },
  {
    id: 'give-cheer',
    category: 'social',
    title: 'Cheerleader',
    description: 'Cheer 10 friends on their achievements',
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    rarity: 'uncommon',
    xpReward: 100,
    unlocked: false,
    progress: 6,
    target: 10,
  },
  {
    id: 'family-challenge',
    category: 'social',
    title: 'Family Goals',
    description: 'Complete a family challenge',
    icon: Users,
    color: 'bg-green-200 text-green-700',
    rarity: 'rare',
    xpReward: 300,
    unlocked: true,
    unlockedAt: '2024-02-05',
    progress: 1,
    target: 1,
  },
  {
    id: 'mentor-star',
    category: 'social',
    title: 'Rising Mentor',
    description: 'Help 5 members with their questions',
    icon: Star,
    color: 'bg-indigo-100 text-indigo-600',
    rarity: 'rare',
    xpReward: 400,
    unlocked: false,
    progress: 2,
    target: 5,
  },

  // Special achievements
  {
    id: 'early-bird',
    category: 'special',
    title: 'Early Bird',
    description: 'Complete a lesson before 7 AM',
    icon: Clock,
    color: 'bg-cyan-100 text-cyan-600',
    rarity: 'uncommon',
    xpReward: 100,
    unlocked: true,
    unlockedAt: '2024-02-01',
    progress: 1,
    target: 1,
  },
  {
    id: 'night-owl',
    category: 'special',
    title: 'Night Owl',
    description: 'Complete a lesson after 10 PM',
    icon: Sparkles,
    color: 'bg-indigo-100 text-indigo-600',
    rarity: 'uncommon',
    xpReward: 100,
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: 'first-investment',
    category: 'special',
    title: 'Investor Mindset',
    description: 'Complete the Introduction to Investing track',
    icon: TrendingUp,
    color: 'bg-emerald-100 text-emerald-600',
    rarity: 'rare',
    xpReward: 500,
    unlocked: false,
    progress: 3,
    target: 8,
  },
  {
    id: 'founding-member',
    category: 'special',
    title: 'Founding Member',
    description: 'Joined Ascent in its first year',
    icon: Rocket,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    rarity: 'legendary',
    xpReward: 1000,
    unlocked: true,
    unlockedAt: '2024-01-01',
    progress: 1,
    target: 1,
  },
];

const rarityColors = {
  common: 'bg-gray-100 text-gray-700 border-gray-200',
  uncommon: 'bg-green-100 text-green-700 border-green-200',
  rare: 'bg-blue-100 text-blue-700 border-blue-200',
  legendary: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300',
};

const rarityLabels = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

export default function AchievementsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showLocked, setShowLocked] = useState(true);

  const filteredAchievements = achievements.filter((a) => {
    if (activeCategory !== 'all' && a.category !== activeCategory) return false;
    if (!showLocked && !a.unlocked) return false;
    return true;
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalXPEarned = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.xpReward, 0);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
          Achievements
        </h1>
        <p className="text-muted-foreground">
          Collect badges, earn XP, and show off your accomplishments!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-3xl font-bold text-yellow-700">{unlockedCount}</p>
            <p className="text-sm text-yellow-600">Achievements</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-3xl font-bold text-purple-700">{totalXPEarned.toLocaleString()}</p>
            <p className="text-sm text-purple-600">XP Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Medal className="h-8 w-8 mx-auto text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-blue-700">
              {achievements.filter(a => a.unlocked && a.rarity === 'rare').length}
            </p>
            <p className="text-sm text-blue-600">Rare Badges</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-3xl font-bold text-orange-700">
              {achievements.filter(a => a.unlocked && a.rarity === 'legendary').length}
            </p>
            <p className="text-sm text-orange-600">Legendary</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            {achievementCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <Button
          variant={showLocked ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowLocked(!showLocked)}
        >
          <Lock className="h-4 w-4 mr-1" />
          {showLocked ? 'Show All' : 'Hide Locked'}
        </Button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercent = (achievement.progress / achievement.target) * 100;

          return (
            <Card
              key={achievement.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                achievement.unlocked
                  ? 'border-2 border-yellow-200'
                  : 'opacity-75 grayscale hover:grayscale-0 hover:opacity-100'
              }`}
            >
              {/* Rarity indicator */}
              {achievement.rarity === 'legendary' && achievement.unlocked && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/10 to-red-400/10" />
              )}

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`
                    p-3 rounded-xl ${achievement.color} relative
                    ${!achievement.unlocked ? 'bg-gray-100 text-gray-400' : ''}
                  `}>
                    <Icon className="h-8 w-8" />
                    {!achievement.unlocked && (
                      <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-gray-500 bg-white rounded-full" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold truncate">{achievement.title}</h3>
                      <Badge className={`text-xs ml-2 ${rarityColors[achievement.rarity as keyof typeof rarityColors]}`}>
                        {rarityLabels[achievement.rarity as keyof typeof rarityLabels]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {achievement.description}
                    </p>

                    {/* Progress or Unlocked Date */}
                    {achievement.unlocked ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="text-muted-foreground">
                          Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.target}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    )}

                    {/* XP Reward */}
                    <div className="mt-3 flex items-center gap-1">
                      <Gift className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium text-indigo-600">
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coming Soon */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6 text-center">
          <Rocket className="h-12 w-12 mx-auto text-indigo-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">More Achievements Coming Soon!</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We&apos;re always adding new challenges and achievements. Keep learning and check back for new ways to earn XP and badges!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
