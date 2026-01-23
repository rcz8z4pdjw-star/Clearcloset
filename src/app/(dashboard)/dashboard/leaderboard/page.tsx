'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Star, TrendingUp, TrendingDown, Minus, Crown, Flame, Target, Users } from 'lucide-react';

// Mock leaderboard data - would come from API
const mockLeaderboardData = {
  weekly: [
    { rank: 1, id: '1', name: 'Alex Chen', avatar: null, xp: 2450, level: 8, streak: 14, change: 'up', badges: 12 },
    { rank: 2, id: '2', name: 'Jordan Smith', avatar: null, xp: 2280, level: 7, streak: 21, change: 'same', badges: 10 },
    { rank: 3, id: '3', name: 'Taylor Kim', avatar: null, xp: 2150, level: 7, streak: 7, change: 'up', badges: 9 },
    { rank: 4, id: '4', name: 'Casey Williams', avatar: null, xp: 1980, level: 6, streak: 5, change: 'down', badges: 8 },
    { rank: 5, id: '5', name: 'Morgan Lee', avatar: null, xp: 1820, level: 6, streak: 12, change: 'up', badges: 7 },
    { rank: 6, id: '6', name: 'Riley Johnson', avatar: null, xp: 1650, level: 5, streak: 3, change: 'down', badges: 6 },
    { rank: 7, id: '7', name: 'Jamie Brown', avatar: null, xp: 1520, level: 5, streak: 8, change: 'same', badges: 5 },
    { rank: 8, id: '8', name: 'Drew Martinez', avatar: null, xp: 1380, level: 4, streak: 4, change: 'up', badges: 4 },
    { rank: 9, id: '9', name: 'Sam Davis', avatar: null, xp: 1250, level: 4, streak: 2, change: 'down', badges: 4 },
    { rank: 10, id: '10', name: 'Avery Wilson', avatar: null, xp: 1100, level: 3, streak: 6, change: 'up', badges: 3 },
  ],
  monthly: [
    { rank: 1, id: '2', name: 'Jordan Smith', avatar: null, xp: 8950, level: 7, streak: 21, change: 'up', badges: 10 },
    { rank: 2, id: '1', name: 'Alex Chen', avatar: null, xp: 8720, level: 8, streak: 14, change: 'down', badges: 12 },
    { rank: 3, id: '5', name: 'Morgan Lee', avatar: null, xp: 7850, level: 6, streak: 12, change: 'up', badges: 7 },
    { rank: 4, id: '3', name: 'Taylor Kim', avatar: null, xp: 7200, level: 7, streak: 7, change: 'down', badges: 9 },
    { rank: 5, id: '7', name: 'Jamie Brown', avatar: null, xp: 6540, level: 5, streak: 8, change: 'up', badges: 5 },
    { rank: 6, id: '4', name: 'Casey Williams', avatar: null, xp: 6100, level: 6, streak: 5, change: 'down', badges: 8 },
    { rank: 7, id: '8', name: 'Drew Martinez', avatar: null, xp: 5680, level: 4, streak: 4, change: 'up', badges: 4 },
    { rank: 8, id: '10', name: 'Avery Wilson', avatar: null, xp: 5220, level: 3, streak: 6, change: 'up', badges: 3 },
    { rank: 9, id: '6', name: 'Riley Johnson', avatar: null, xp: 4950, level: 5, streak: 3, change: 'down', badges: 6 },
    { rank: 10, id: '9', name: 'Sam Davis', avatar: null, xp: 4680, level: 4, streak: 2, change: 'down', badges: 4 },
  ],
  allTime: [
    { rank: 1, id: '1', name: 'Alex Chen', avatar: null, xp: 45200, level: 8, streak: 14, change: 'same', badges: 12 },
    { rank: 2, id: '2', name: 'Jordan Smith', avatar: null, xp: 42800, level: 7, streak: 21, change: 'same', badges: 10 },
    { rank: 3, id: '3', name: 'Taylor Kim', avatar: null, xp: 38500, level: 7, streak: 7, change: 'same', badges: 9 },
    { rank: 4, id: '4', name: 'Casey Williams', avatar: null, xp: 35200, level: 6, streak: 5, change: 'same', badges: 8 },
    { rank: 5, id: '5', name: 'Morgan Lee', avatar: null, xp: 31800, level: 6, streak: 12, change: 'up', badges: 7 },
    { rank: 6, id: '6', name: 'Riley Johnson', avatar: null, xp: 28400, level: 5, streak: 3, change: 'down', badges: 6 },
    { rank: 7, id: '7', name: 'Jamie Brown', avatar: null, xp: 25600, level: 5, streak: 8, change: 'same', badges: 5 },
    { rank: 8, id: '8', name: 'Drew Martinez', avatar: null, xp: 22100, level: 4, streak: 4, change: 'up', badges: 4 },
    { rank: 9, id: '9', name: 'Sam Davis', avatar: null, xp: 19800, level: 4, streak: 2, change: 'down', badges: 4 },
    { rank: 10, id: '10', name: 'Avery Wilson', avatar: null, xp: 17200, level: 3, streak: 6, change: 'same', badges: 3 },
  ],
};

const currentUser = { id: '6', rank: 6, xp: 1650 };

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <Crown className="h-6 w-6 text-yellow-900" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-yellow-400 text-yellow-900 rounded-full w-5 h-5 flex items-center justify-center">
          1
        </span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center shadow-lg shadow-gray-400/30">
          <Medal className="h-5 w-5 text-gray-600" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-gray-300 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center">
          2
        </span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <Medal className="h-5 w-5 text-orange-100" />
        </div>
        <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-orange-400 text-orange-900 rounded-full w-5 h-5 flex items-center justify-center">
          3
        </span>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
      {rank}
    </div>
  );
}

function RankChange({ change }: { change: string }) {
  if (change === 'up') {
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  }
  if (change === 'down') {
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');
  const [category, setCategory] = useState('all');

  const leaderboardData = mockLeaderboardData[timeframe];
  const topThree = leaderboardData.slice(0, 3);
  const restOfList = leaderboardData.slice(3);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          See how you stack up against other learners!
        </p>
      </div>

      {/* Your Stats Quick View */}
      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-indigo-500">
                <AvatarFallback className="bg-indigo-500 text-white text-xl">YO</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Your Current Rank</p>
                <p className="text-3xl font-bold">#{currentUser.rank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total XP</p>
              <p className="text-2xl font-bold text-indigo-600">{currentUser.xp.toLocaleString()} XP</p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm text-muted-foreground">Points to Next Rank</p>
              <p className="text-lg font-semibold text-orange-500">170 XP to go!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="allTime" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Learners</SelectItem>
            <SelectItem value="age-group">My Age Group</SelectItem>
            <SelectItem value="family">My Family</SelectItem>
            <SelectItem value="mentees">My Mentees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 items-end">
        {/* 2nd Place */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20 border-4 border-gray-300">
              <AvatarImage src={topThree[1]?.avatar || undefined} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-xl">
                {topThree[1]?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold truncate">{topThree[1]?.name}</p>
            <p className="text-sm text-muted-foreground">{topThree[1]?.xp.toLocaleString()} XP</p>
          </div>
          <div className="h-24 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg flex items-end justify-center pb-4">
            <RankBadge rank={2} />
          </div>
        </div>

        {/* 1st Place */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-yellow-400 shadow-lg shadow-yellow-400/50">
                <AvatarImage src={topThree[0]?.avatar || undefined} />
                <AvatarFallback className="bg-yellow-100 text-yellow-700 text-2xl">
                  {topThree[0]?.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div>
            <p className="font-bold text-lg truncate">{topThree[0]?.name}</p>
            <p className="text-sm text-muted-foreground">{topThree[0]?.xp.toLocaleString()} XP</p>
            <Badge className="mt-1 bg-yellow-500 hover:bg-yellow-600">
              <Flame className="h-3 w-3 mr-1" /> {topThree[0]?.streak} day streak
            </Badge>
          </div>
          <div className="h-32 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg flex items-end justify-center pb-4">
            <RankBadge rank={1} />
          </div>
        </div>

        {/* 3rd Place */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Avatar className="h-18 w-18 border-4 border-orange-400">
              <AvatarImage src={topThree[2]?.avatar || undefined} />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
                {topThree[2]?.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold truncate">{topThree[2]?.name}</p>
            <p className="text-sm text-muted-foreground">{topThree[2]?.xp.toLocaleString()} XP</p>
          </div>
          <div className="h-20 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg flex items-end justify-center pb-4">
            <RankBadge rank={3} />
          </div>
        </div>
      </div>

      {/* Rest of Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Rankings
          </CardTitle>
          <CardDescription>
            {timeframe === 'weekly' && 'This week\'s top performers'}
            {timeframe === 'monthly' && 'This month\'s top performers'}
            {timeframe === 'allTime' && 'All-time top performers'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {restOfList.map((user) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                  user.id === currentUser.id
                    ? 'bg-indigo-50 border-2 border-indigo-200'
                    : 'hover:bg-muted/50'
                }`}
              >
                <RankBadge rank={user.rank} />

                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{user.name}</p>
                    {user.id === currentUser.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>Level {user.level}</span>
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {user.streak} day streak
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      {user.badges} badges
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold">{user.xp.toLocaleString()} XP</p>
                  <div className="flex items-center justify-end gap-1">
                    <RankChange change={user.change} />
                    <span className="text-xs text-muted-foreground">
                      {user.change === 'up' && 'Moving up!'}
                      {user.change === 'down' && 'Slipping'}
                      {user.change === 'same' && 'Holding steady'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Section */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-200">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Keep Going! You&apos;re Doing Great!</h3>
          <p className="text-muted-foreground">
            Complete 3 more lessons this week to climb to rank #5. You&apos;ve got this!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
