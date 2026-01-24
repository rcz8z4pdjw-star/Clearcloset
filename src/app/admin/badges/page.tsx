'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award, Plus, Search, Edit, Trash2, Users, TrendingUp,
  Star, Flame, Trophy, Target, BookOpen, CheckCircle
} from 'lucide-react';

const badges = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first lesson',
    category: 'learning',
    rarity: 'common',
    xpReward: 25,
    earnedBy: 1150,
    icon: 'BookOpen',
    isActive: true,
  },
  {
    id: '2',
    name: 'Quiz Master',
    description: 'Pass 10 quizzes with 80%+ score',
    category: 'quiz',
    rarity: 'uncommon',
    xpReward: 100,
    earnedBy: 420,
    icon: 'Target',
    isActive: true,
  },
  {
    id: '3',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    category: 'streak',
    rarity: 'rare',
    xpReward: 150,
    earnedBy: 280,
    icon: 'Flame',
    isActive: true,
  },
  {
    id: '4',
    name: 'Track Champion',
    description: 'Complete an entire learning track',
    category: 'completion',
    rarity: 'epic',
    xpReward: 300,
    earnedBy: 95,
    icon: 'Trophy',
    isActive: true,
  },
  {
    id: '5',
    name: 'Legendary Learner',
    description: 'Earn all other badges',
    category: 'special',
    rarity: 'legendary',
    xpReward: 1000,
    earnedBy: 12,
    icon: 'Star',
    isActive: true,
  },
];

const rarityColors = {
  common: 'bg-gray-100 text-gray-700 border-gray-300',
  uncommon: 'bg-green-100 text-green-700 border-green-300',
  rare: 'bg-blue-100 text-blue-700 border-blue-300',
  epic: 'bg-purple-100 text-purple-700 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-700 border-yellow-400',
};

const categories = ['All', 'learning', 'quiz', 'streak', 'completion', 'special'];

export default function AdminBadgesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCreating, setIsCreating] = useState(false);

  const filteredBadges = badges.filter(badge => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || badge.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalBadgesAwarded = badges.reduce((sum, b) => sum + b.earnedBy, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Badge Management</h1>
          <p className="text-muted-foreground">Create and manage achievement badges</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Badge
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Award className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{badges.length}</p>
              <p className="text-sm text-muted-foreground">Total Badges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBadgesAwarded.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Badges Awarded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{badges.filter(b => b.rarity === 'legendary').length}</p>
              <p className="text-sm text-muted-foreground">Legendary Badges</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">+125</p>
              <p className="text-sm text-muted-foreground">Awarded This Week</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Badge Form */}
      {isCreating && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader>
            <CardTitle>Create New Badge</CardTitle>
            <CardDescription>Define a new achievement badge</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Badge Name</label>
                <Input placeholder="e.g., Quick Learner" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="learning">Learning</option>
                  <option value="quiz">Quiz</option>
                  <option value="streak">Streak</option>
                  <option value="completion">Completion</option>
                  <option value="special">Special</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea placeholder="Describe how to earn this badge" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Rarity</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">XP Reward</label>
                <Input type="number" placeholder="100" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Icon</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option value="BookOpen">Book</option>
                  <option value="Target">Target</option>
                  <option value="Flame">Flame</option>
                  <option value="Trophy">Trophy</option>
                  <option value="Star">Star</option>
                  <option value="Award">Award</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreating(false)} variant="outline">Cancel</Button>
              <Button>Create Badge</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBadges.map((badge) => (
          <Card key={badge.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className={`p-4 ${rarityColors[badge.rarity as keyof typeof rarityColors]} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{badge.name}</h3>
                      <Badge variant="outline" className="text-xs capitalize mt-1">
                        {badge.rarity}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">+{badge.xpReward} XP</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{badge.earnedBy.toLocaleString()} earned</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
