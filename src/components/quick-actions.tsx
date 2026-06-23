'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Target,
  Trophy,
  Flame,
  Calculator,
  MessageCircle,
  Bell,
  Search,
  Gift,
  Calendar,
  ChevronRight,
  Sparkles,
  Zap,
  Star,
} from 'lucide-react';

interface QuickActionsProps {
  streak?: number;
  xp?: number;
  level?: number;
  unreadNotifications?: number;
  dailyChallengesRemaining?: number;
}

const quickActions = [
  {
    id: 'continue-learning',
    title: 'Continue Learning',
    description: 'Pick up where you left off',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-500',
    href: '/dashboard/learn',
    primary: true,
  },
  {
    id: 'daily-challenges',
    title: 'Daily Challenges',
    description: '3 challenges remaining',
    icon: Target,
    color: 'from-orange-500 to-red-500',
    href: '/dashboard/challenges',
    badge: '3',
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    description: 'See your ranking',
    icon: Trophy,
    color: 'from-yellow-500 to-orange-500',
    href: '/dashboard/leaderboard',
  },
  {
    id: 'financial-tools',
    title: 'Financial Tools',
    description: 'Calculators & more',
    icon: Calculator,
    color: 'from-purple-500 to-pink-500',
    href: '/dashboard/tools',
  },
];

export function QuickActions({
  streak = 12,
  xp = 2450,
  level = 8,
  unreadNotifications = 3,
  dailyChallengesRemaining = 3,
}: QuickActionsProps) {
  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl text-white">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-yellow-300" />
            <span className="font-bold">{streak}</span>
            <span className="text-white/70 text-sm">day streak</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="font-bold">{xp.toLocaleString()}</span>
            <span className="text-white/70 text-sm">XP</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-300" />
            <span className="font-bold">Level {level}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 relative"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.id}
              className={`cursor-pointer hover:shadow-lg transition-all group ${
                action.primary ? 'md:col-span-2' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl bg-gradient-to-br ${action.color} transition-transform group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{action.title}</h3>
                      {action.badge && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for sidebar
export function QuickActionsCompact() {
  return (
    <div className="space-y-2 p-2">
      {quickActions.slice(0, 4).map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant="ghost"
            className="w-full justify-start gap-3 h-auto py-2"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${action.color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm">{action.title}</span>
            {action.badge && (
              <Badge className="ml-auto bg-red-100 text-red-700 text-xs">
                {action.badge}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Floating action button version
export function QuickActionsFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-64 bg-white rounded-xl shadow-2xl border overflow-hidden mb-2">
          <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <h3 className="font-semibold">Quick Actions</h3>
          </div>
          <div className="p-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => setIsOpen(false)}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}
      <Button
        size="lg"
        className={`rounded-full w-14 h-14 shadow-lg transition-all ${
          isOpen
            ? 'bg-gray-800 hover:bg-gray-700'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <span className="text-2xl">&times;</span>
        ) : (
          <Zap className="h-6 w-6" />
        )}
      </Button>
    </div>
  );
}

// Dashboard widget version with more detail
export function QuickActionsWidget() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </h3>
        <div className="space-y-2">
          <Button
            className="w-full justify-between bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Continue Learning
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <Target className="h-4 w-4 mr-2 text-orange-500" />
              Challenges
              <Badge className="ml-auto bg-orange-100 text-orange-700 text-xs">3</Badge>
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Leaderboard
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Calculator className="h-4 w-4 mr-2 text-purple-500" />
              Tools
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Gift className="h-4 w-4 mr-2 text-pink-500" />
              Rewards
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
