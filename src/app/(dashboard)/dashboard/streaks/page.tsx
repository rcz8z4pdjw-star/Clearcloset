'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Flame,
  Calendar,
  Trophy,
  Star,
  Shield,
  Zap,
  Gift,
  Check,
  Clock,
  TrendingUp,
  Target,
  Sparkles,
  ChevronRight,
  Award,
} from 'lucide-react';

// Mock streak data
const streakData = {
  currentStreak: 12,
  longestStreak: 21,
  totalActiveDays: 45,
  streakShields: 2,
  todayCompleted: true,
  freezeAvailable: true,
};

// Calendar data (last 35 days)
const generateCalendarData = () => {
  const days = [];
  const today = new Date();

  for (let i = 34; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Simulate activity pattern
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const random = Math.random();
    const hasActivity = i < 12 ? true : (isWeekend ? random > 0.3 : random > 0.2);

    days.push({
      date: date.toISOString().split('T')[0],
      dayOfMonth: date.getDate(),
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
      hasActivity,
      xpEarned: hasActivity ? Math.floor(Math.random() * 200) + 50 : 0,
      isToday: i === 0,
    });
  }

  return days;
};

const calendarDays = generateCalendarData();

const streakMilestones = [
  { days: 3, reward: '50 XP Bonus', icon: Zap, reached: true },
  { days: 7, reward: '100 XP + Streak Badge', icon: Trophy, reached: true },
  { days: 14, reward: '200 XP + Streak Shield', icon: Shield, reached: false, current: true },
  { days: 21, reward: '300 XP + 2x XP Boost', icon: Sparkles, reached: false },
  { days: 30, reward: '500 XP + Legendary Badge', icon: Award, reached: false },
  { days: 60, reward: '1000 XP + Premium Frame', icon: Star, reached: false },
  { days: 100, reward: '2000 XP + Champion Title', icon: Trophy, reached: false },
];

const weeklyStreak = [
  { day: 'Mon', completed: true, xp: 180 },
  { day: 'Tue', completed: true, xp: 220 },
  { day: 'Wed', completed: true, xp: 150 },
  { day: 'Thu', completed: true, xp: 200 },
  { day: 'Fri', completed: true, xp: 180 },
  { day: 'Sat', completed: true, xp: 250 },
  { day: 'Sun', completed: false, xp: 0, isToday: true },
];

export default function StreaksPage() {
  const [showShieldModal, setShowShieldModal] = useState(false);

  const nextMilestone = streakMilestones.find((m) => !m.reached);
  const daysToNextMilestone = nextMilestone ? nextMilestone.days - streakData.currentStreak : 0;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flame className="h-8 w-8 text-orange-500" />
            Streaks
          </h1>
          <p className="text-muted-foreground mt-1">
            Keep your learning momentum going!
          </p>
        </div>
        {streakData.streakShields > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{streakData.streakShields}</p>
                <p className="text-xs text-blue-600">Streak Shields</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Hero Streak Card */}
      <Card className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <CardContent className="p-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="relative">
                  <Flame className="h-24 w-24 text-yellow-300 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-bold">{streakData.currentStreak}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mt-4">Day Streak!</h2>
              <p className="text-orange-100">Keep it up! You&apos;re on fire!</p>
            </div>

            <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-yellow-300 mb-2" />
                <p className="text-2xl font-bold">{streakData.longestStreak}</p>
                <p className="text-sm text-orange-100">Longest Streak</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto text-yellow-300 mb-2" />
                <p className="text-2xl font-bold">{streakData.totalActiveDays}</p>
                <p className="text-sm text-orange-100">Total Active Days</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 text-center col-span-2 md:col-span-1">
                <Target className="h-8 w-8 mx-auto text-yellow-300 mb-2" />
                <p className="text-2xl font-bold">{daysToNextMilestone}</p>
                <p className="text-sm text-orange-100">Days to Milestone</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Status */}
      <Card className={streakData.todayCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {streakData.todayCompleted ? (
                <div className="p-3 bg-green-100 rounded-full">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-yellow-100 rounded-full animate-pulse">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {streakData.todayCompleted
                    ? 'Today\'s streak is secured!'
                    : 'Complete a lesson to maintain your streak!'}
                </h3>
                <p className="text-muted-foreground">
                  {streakData.todayCompleted
                    ? 'Great job! Come back tomorrow to keep it going.'
                    : 'You have until midnight to complete today\'s activity.'}
                </p>
              </div>
            </div>
            {!streakData.todayCompleted && (
              <Button className="bg-yellow-500 hover:bg-yellow-600">
                Start Learning
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly View */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <CardDescription>Your activity for the current week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weeklyStreak.map((day) => (
                <div key={day.day} className="text-center">
                  <div
                    className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      day.completed
                        ? 'bg-gradient-to-br from-orange-400 to-red-500'
                        : day.isToday
                        ? 'bg-yellow-100 border-2 border-yellow-400 border-dashed'
                        : 'bg-muted'
                    }`}
                  >
                    {day.completed ? (
                      <Flame className="h-5 w-5 text-white" />
                    ) : day.isToday ? (
                      <span className="text-xs font-bold text-yellow-600">?</span>
                    ) : null}
                  </div>
                  <span className={`text-xs ${day.isToday ? 'font-bold' : 'text-muted-foreground'}`}>
                    {day.day}
                  </span>
                  {day.completed && (
                    <p className="text-xs text-orange-500 font-medium mt-1">+{day.xp}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Week Total</span>
              <Badge className="bg-orange-100 text-orange-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {weeklyStreak.reduce((sum, d) => sum + d.xp, 0)} XP
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Streak Shields */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Streak Shields
            </CardTitle>
            <CardDescription>
              Protect your streak on days you can&apos;t learn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(streakData.streakShields)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center border-2 border-white"
                    >
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold">{streakData.streakShields} Shields Available</p>
                  <p className="text-xs text-muted-foreground">Use wisely!</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">How to earn shields:</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                <span>Reach 14-day streak milestone</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                <span>Purchase in the Rewards Shop</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                <span>Complete weekly challenges</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" disabled={!streakData.freezeAvailable}>
              <Shield className="h-4 w-4 mr-2" />
              Use Shield for Today
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Calendar
          </CardTitle>
          <CardDescription>Your learning activity over the past 5 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <div
                key={day.date}
                className={`aspect-square rounded-md flex items-center justify-center text-xs relative ${
                  day.hasActivity
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white font-medium'
                    : 'bg-muted text-muted-foreground'
                } ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                title={`${day.date}: ${day.xpEarned} XP`}
              >
                {day.dayOfMonth}
                {day.hasActivity && day.xpEarned > 150 && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>No activity</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-400 to-red-500" />
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Streak Milestones
          </CardTitle>
          <CardDescription>Unlock rewards as you build your streak</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-muted rounded-full">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                style={{
                  width: `${Math.min(
                    ((streakData.currentStreak / 100) * 100),
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="relative flex justify-between">
              {streakMilestones.map((milestone) => {
                const Icon = milestone.icon;
                return (
                  <div key={milestone.days} className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center z-10 ${
                        milestone.reached
                          ? 'bg-gradient-to-br from-orange-400 to-red-500'
                          : milestone.current
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 ring-4 ring-yellow-200'
                          : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          milestone.reached || milestone.current ? 'text-white' : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <span
                      className={`mt-2 text-sm font-semibold ${
                        milestone.current ? 'text-orange-500' : ''
                      }`}
                    >
                      {milestone.days} Days
                    </span>
                    <span className="text-xs text-muted-foreground text-center max-w-[80px]">
                      {milestone.reward}
                    </span>
                    {milestone.reached && (
                      <Badge className="mt-1 bg-green-100 text-green-700 text-xs">Earned!</Badge>
                    )}
                    {milestone.current && (
                      <Badge className="mt-1 bg-orange-100 text-orange-700 text-xs">
                        {milestone.days - streakData.currentStreak} days away
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivation */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-orange-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {daysToNextMilestone <= 2
                  ? 'You\'re almost there!'
                  : 'Keep up the great work!'}
              </h3>
              <p className="text-muted-foreground">
                {nextMilestone
                  ? `Only ${daysToNextMilestone} more days until you unlock "${nextMilestone.reward}"!`
                  : 'You\'ve reached all milestones! You\'re a true learning champion!'}
              </p>
            </div>
            <Button className="ml-auto bg-orange-500 hover:bg-orange-600">
              Continue Learning
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
