'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  TrendingUp,
  Star,
  Flame,
  Users,
  ChevronUp,
  ChevronDown,
  Minus,
} from 'lucide-react';

interface LeaderboardUser {
  id: string;
  rank: number;
  previousRank?: number;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  xp: number;
  level: number;
  title: string;
  streak?: number;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  period?: 'weekly' | 'monthly' | 'all-time';
  onPeriodChange?: (period: 'weekly' | 'monthly' | 'all-time') => void;
}

const rankStyles: Record<number, { bg: string; icon: any; color: string }> = {
  1: { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', icon: Crown, color: 'text-yellow-600' },
  2: { bg: 'bg-gradient-to-br from-gray-300 to-gray-400', icon: Medal, color: 'text-gray-500' },
  3: { bg: 'bg-gradient-to-br from-amber-600 to-orange-700', icon: Award, color: 'text-orange-600' },
};

export function Leaderboard({
  users,
  currentUserId,
  period = 'weekly',
  onPeriodChange,
}: LeaderboardProps) {
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const currentUserData = users.find((u) => u.id === currentUserId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Leaderboard</CardTitle>
          </div>
          <Tabs value={period} onValueChange={(v) => onPeriodChange?.(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="weekly" className="text-xs px-2">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2">Monthly</TabsTrigger>
              <TabsTrigger value="all-time" className="text-xs px-2">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-4 mb-6">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Avatar className="h-16 w-16 mx-auto border-4 border-gray-300 shadow-lg">
                <AvatarImage src={top3[1].avatarUrl || undefined} />
                <AvatarFallback className="bg-gray-200 text-lg">
                  {top3[1].firstName[0]}{top3[1].lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="mt-2">
                <div className="h-8 w-8 mx-auto bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white font-bold -mt-4 relative z-10 shadow">
                  2
                </div>
                <p className="font-semibold text-sm mt-1">{top3[1].firstName}</p>
                <p className="text-xs text-muted-foreground">{top3[1].xp.toLocaleString()} XP</p>
              </div>
              <div className="h-20 w-20 bg-gradient-to-b from-gray-200 to-gray-300 rounded-t-lg mt-2" />
            </motion.div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="relative">
                <Crown className="h-6 w-6 text-yellow-500 absolute -top-3 left-1/2 -translate-x-1/2 z-10" />
                <Avatar className="h-20 w-20 mx-auto border-4 border-yellow-400 shadow-lg ring-4 ring-yellow-200">
                  <AvatarImage src={top3[0].avatarUrl || undefined} />
                  <AvatarFallback className="bg-yellow-100 text-xl">
                    {top3[0].firstName[0]}{top3[0].lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-2">
                <div className="h-10 w-10 mx-auto bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold -mt-5 relative z-10 shadow-lg">
                  1
                </div>
                <p className="font-bold mt-1">{top3[0].firstName}</p>
                <p className="text-sm text-muted-foreground">{top3[0].xp.toLocaleString()} XP</p>
                {top3[0].streak && top3[0].streak >= 7 && (
                  <div className="flex items-center justify-center gap-1 text-orange-500 text-xs mt-1">
                    <Flame className="h-3 w-3" />
                    {top3[0].streak} day streak
                  </div>
                )}
              </div>
              <div className="h-28 w-24 bg-gradient-to-b from-yellow-200 to-yellow-300 rounded-t-lg mt-2" />
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <Avatar className="h-14 w-14 mx-auto border-4 border-amber-600 shadow-lg">
                <AvatarImage src={top3[2].avatarUrl || undefined} />
                <AvatarFallback className="bg-amber-100">
                  {top3[2].firstName[0]}{top3[2].lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="mt-2">
                <div className="h-7 w-7 mx-auto bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center text-white font-bold -mt-3 relative z-10 shadow text-sm">
                  3
                </div>
                <p className="font-semibold text-sm mt-1">{top3[2].firstName}</p>
                <p className="text-xs text-muted-foreground">{top3[2].xp.toLocaleString()} XP</p>
              </div>
              <div className="h-14 w-16 bg-gradient-to-b from-amber-200 to-amber-300 rounded-t-lg mt-2" />
            </motion.div>
          )}
        </div>

        {/* Rest of Leaderboard */}
        <div className="space-y-2">
          {rest.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                user.id === currentUserId
                  ? 'bg-ascent-navy/10 border-2 border-ascent-navy'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="w-8 text-center font-bold text-muted-foreground">
                {user.rank}
              </div>
              <RankChange
                current={user.rank}
                previous={user.previousRank}
              />
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.firstName} {user.lastName}
                  {user.id === currentUserId && (
                    <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Level {user.level} • {user.title}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{user.xp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Current User Card (if not in top 10) */}
        {currentUserData && currentUserData.rank > 10 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Your Position</p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-ascent-navy/10 border-2 border-ascent-navy">
              <div className="w-8 text-center font-bold">{currentUserData.rank}</div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentUserData.avatarUrl || undefined} />
                <AvatarFallback>
                  {currentUserData.firstName[0]}{currentUserData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {currentUserData.firstName} {currentUserData.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Level {currentUserData.level} • {currentUserData.title}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">{currentUserData.xp.toLocaleString()} XP</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RankChange({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) {
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }

  if (current < previous) {
    return (
      <div className="flex items-center text-green-500">
        <ChevronUp className="h-4 w-4" />
        <span className="text-xs">{previous - current}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-red-500">
      <ChevronDown className="h-4 w-4" />
      <span className="text-xs">{current - previous}</span>
    </div>
  );
}

// Compact version for sidebar
export function LeaderboardCompact({ users, currentUserId }: { users: LeaderboardUser[]; currentUserId?: string }) {
  return (
    <div className="space-y-2">
      {users.slice(0, 5).map((user, index) => (
        <div
          key={user.id}
          className={`flex items-center gap-2 p-2 rounded-lg ${
            user.id === currentUserId ? 'bg-ascent-navy/10' : ''
          }`}
        >
          <div className="w-5 text-center text-sm font-bold text-muted-foreground">
            {index + 1}
          </div>
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-xs">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm truncate">{user.firstName}</span>
          <span className="text-sm font-medium">{user.xp.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
