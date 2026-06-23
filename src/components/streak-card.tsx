'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Calendar, Trophy, Zap, CheckCircle } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  isActive: boolean;
  lastActivityAt?: string | Date;
  onViewHistory?: () => void;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  isActive,
  lastActivityAt,
  onViewHistory,
}: StreakCardProps) {
  const nextMilestones = [7, 14, 30, 60, 100, 365];
  const nextMilestone = nextMilestones.find(m => m > currentStreak) || null;
  const milestoneProgress = nextMilestone
    ? Math.round((currentStreak / nextMilestone) * 100)
    : 100;

  const getStreakMessage = () => {
    if (!isActive) return "Complete today's activity to keep your streak!";
    if (currentStreak >= 100) return "Incredible dedication! You're a true champion!";
    if (currentStreak >= 30) return "Amazing! A whole month of learning!";
    if (currentStreak >= 14) return "Two weeks strong! Keep it up!";
    if (currentStreak >= 7) return "Great job! One week complete!";
    if (currentStreak >= 3) return "You're building momentum!";
    return "Great start! Come back tomorrow!";
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-white/20 ${isActive ? 'animate-pulse' : ''}`}>
              <Flame className="h-8 w-8" />
            </div>
            <div>
              <p className="text-5xl font-bold">{currentStreak}</p>
              <p className="text-white/80">Day Streak</p>
            </div>
          </div>
          {isActive ? (
            <Badge className="bg-white/20 text-white border-white/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active Today
            </Badge>
          ) : (
            <Badge className="bg-yellow-400 text-yellow-900">
              Complete Activity!
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        <p className="text-center text-muted-foreground mb-6">{getStreakMessage()}</p>

        {/* Next Milestone */}
        {nextMilestone && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Next Milestone: {nextMilestone} Days</span>
              <span className="text-muted-foreground">{nextMilestone - currentStreak} days to go</span>
            </div>
            <Progress value={milestoneProgress} className="h-2" />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{longestStreak}</span>
            </div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-indigo-500" />
              <span className="text-2xl font-bold">{currentStreak * 5}</span>
            </div>
            <p className="text-sm text-muted-foreground">Bonus XP Earned</p>
          </div>
        </div>

        {/* Last activity */}
        {lastActivityAt && (
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Last activity: {new Date(lastActivityAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {onViewHistory && (
          <Button variant="outline" className="w-full mt-4" onClick={onViewHistory}>
            View Streak History
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Compact streak display for dashboards
interface StreakBadgeProps {
  streak: number;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, isActive = true, size = 'md' }: StreakBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]} ${
        isActive
          ? 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      <Flame className={`${iconSizes[size]} ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
      {streak}
    </div>
  );
}

// Weekly streak calendar
interface StreakCalendarProps {
  activityDays: Record<string, boolean>;
}

export function StreakCalendar({ activityDays }: StreakCalendarProps) {
  const today = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isActive: activityDays[dateStr] || false,
      isToday: i === 0,
    });
  }

  return (
    <div className="flex justify-between gap-2">
      {days.map((day) => (
        <div key={day.date} className="flex flex-col items-center gap-1">
          <span className="text-xs text-muted-foreground">{day.dayName}</span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              day.isActive
                ? 'bg-gradient-to-br from-orange-400 to-red-500'
                : day.isToday
                ? 'border-2 border-dashed border-orange-300 bg-orange-50'
                : 'bg-gray-100'
            }`}
          >
            {day.isActive && <CheckCircle className="h-4 w-4 text-white" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// Monthly streak heatmap
interface StreakHeatmapProps {
  activityDays: Record<string, boolean>;
  month?: Date;
}

export function StreakHeatmap({ activityDays, month = new Date() }: StreakHeatmapProps) {
  const year = month.getFullYear();
  const monthNum = month.getMonth();
  const firstDay = new Date(year, monthNum, 1);
  const lastDay = new Date(year, monthNum + 1, 0);
  const startPadding = firstDay.getDay();

  const days: Array<{ date: string | null; isActive: boolean }> = [];

  // Add padding for first week
  for (let i = 0; i < startPadding; i++) {
    days.push({ date: null, isActive: false });
  }

  // Add days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date: dateStr, isActive: activityDays[dateStr] || false });
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const activeDays = Object.values(activityDays).filter(Boolean).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <Badge variant="outline">{activeDays} active days</Badge>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground p-1">
            {day}
          </div>
        ))}
        {days.map((day, i) => (
          <div
            key={i}
            className={`aspect-square rounded ${
              day.date === null
                ? ''
                : day.isActive
                ? 'bg-gradient-to-br from-orange-400 to-red-500'
                : 'bg-gray-100'
            }`}
            title={day.date || undefined}
          />
        ))}
      </div>
    </div>
  );
}

// Streak milestone celebration
interface StreakMilestoneProps {
  milestone: number;
  xpAwarded: number;
  onClose: () => void;
}

export function StreakMilestoneCard({ milestone, xpAwarded, onClose }: StreakMilestoneProps) {
  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <Flame className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{milestone} Day Streak!</h2>
        <p className="text-muted-foreground mb-4">
          Amazing dedication! You've earned a special bonus.
        </p>
        <Badge className="bg-indigo-100 text-indigo-700 text-lg px-4 py-2">
          <Zap className="h-4 w-4 mr-1" />
          +{xpAwarded} XP
        </Badge>
        <Button className="w-full mt-6" onClick={onClose}>
          Continue Learning
        </Button>
      </CardContent>
    </Card>
  );
}
