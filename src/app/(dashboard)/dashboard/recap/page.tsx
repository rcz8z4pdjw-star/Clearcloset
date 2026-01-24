'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  TrendingUp,
  Trophy,
  Flame,
  BookOpen,
  Clock,
  Star,
  Target,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  BarChart3,
  Brain,
  Users,
  Zap,
} from 'lucide-react';

// Mock weekly data
const weeklyStats = {
  currentWeek: 'Feb 12 - Feb 18, 2024',
  previousWeek: 'Feb 5 - Feb 11, 2024',
  totalXp: 1250,
  xpChange: 15, // percentage increase from last week
  lessonsCompleted: 8,
  lessonsChange: 2,
  quizzesPassed: 5,
  quizzesChange: 1,
  timeSpent: '4h 35m',
  timeChange: 12,
  streak: 12,
  streakBest: 15,
  level: 8,
  levelProgress: 65,
};

const dailyActivity = [
  { day: 'Mon', xp: 180, lessons: 2, minutes: 45 },
  { day: 'Tue', xp: 220, lessons: 2, minutes: 55 },
  { day: 'Wed', xp: 150, lessons: 1, minutes: 35 },
  { day: 'Thu', xp: 200, lessons: 2, minutes: 50 },
  { day: 'Fri', xp: 180, lessons: 1, minutes: 40 },
  { day: 'Sat', xp: 250, lessons: 2, minutes: 65 },
  { day: 'Sun', xp: 70, lessons: 0, minutes: 20 },
];

const achievements = [
  { id: 'a1', name: 'Quiz Whiz', description: 'Passed 5 quizzes this week', icon: Brain, rarity: 'uncommon' },
  { id: 'a2', name: 'Consistent Learner', description: 'Learned something every day', icon: Flame, rarity: 'rare' },
];

const topTopics = [
  { name: 'Investing Basics', xp: 450, lessons: 3 },
  { name: 'Budgeting', xp: 380, lessons: 2 },
  { name: 'Saving Strategies', xp: 280, lessons: 2 },
  { name: 'Stock Market', xp: 140, lessons: 1 },
];

const highlights = [
  { text: 'Completed the "Compound Interest" module', icon: BookOpen, type: 'lesson' },
  { text: 'Achieved a perfect quiz score', icon: Trophy, type: 'quiz' },
  { text: 'Reached a 10-day streak', icon: Flame, type: 'streak' },
  { text: 'Earned the "Quiz Whiz" badge', icon: Award, type: 'badge' },
];

const comparisonStats = [
  { label: 'XP Earned', thisWeek: 1250, lastWeek: 1087, icon: Sparkles },
  { label: 'Lessons', thisWeek: 8, lastWeek: 6, icon: BookOpen },
  { label: 'Time Spent', thisWeek: 275, lastWeek: 245, icon: Clock, unit: 'min' },
  { label: 'Quizzes', thisWeek: 5, lastWeek: 4, icon: Brain },
];

const rarityColors: Record<string, string> = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

export default function RecapPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week

  const maxDailyXp = Math.max(...dailyActivity.map((d) => d.xp));

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-indigo-500" />
            Weekly Recap
          </h1>
          <p className="text-muted-foreground mt-1">
            Your learning journey this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedWeek(1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-3">
            {selectedWeek === 0 ? weeklyStats.currentWeek : weeklyStats.previousWeek}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={selectedWeek === 0}
            onClick={() => setSelectedWeek(0)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hero Stats Card */}
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold">{weeklyStats.totalXp.toLocaleString()}</div>
              <p className="text-indigo-100 mt-1">XP Earned</p>
              <Badge className="bg-white/20 text-white mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{weeklyStats.xpChange}%
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold">{weeklyStats.lessonsCompleted}</div>
              <p className="text-indigo-100 mt-1">Lessons</p>
              <Badge className="bg-white/20 text-white mt-2">
                +{weeklyStats.lessonsChange} from last week
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold">{weeklyStats.streak}</div>
              <p className="text-indigo-100 mt-1">Day Streak</p>
              <Badge className="bg-white/20 text-white mt-2">
                Best: {weeklyStats.streakBest} days
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold">{weeklyStats.timeSpent}</div>
              <p className="text-indigo-100 mt-1">Time Spent</p>
              <Badge className="bg-white/20 text-white mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{weeklyStats.timeChange}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
          <TabsTrigger value="comparison">Week vs Week</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Daily XP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between h-40 gap-2">
                  {dailyActivity.map((day) => (
                    <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-600"
                        style={{ height: `${(day.xp / maxDailyXp) * 100}%` }}
                        title={`${day.xp} XP`}
                      />
                      <span className="text-xs text-muted-foreground">{day.day}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Top Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topTopics.map((topic, index) => (
                  <div key={topic.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="font-medium">{topic.name}</span>
                      </div>
                      <Badge variant="secondary">{topic.xp} XP</Badge>
                    </div>
                    <Progress value={(topic.xp / topTopics[0].xp) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Week Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlights.map((highlight, index) => {
                  const Icon = highlight.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-sm">{highlight.text}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Level Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                    {weeklyStats.level}
                  </div>
                  <div>
                    <h3 className="font-semibold">Level {weeklyStats.level}</h3>
                    <p className="text-sm text-muted-foreground">
                      {weeklyStats.levelProgress}% to Level {weeklyStats.level + 1}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{1000 - (weeklyStats.levelProgress * 10)}</p>
                  <p className="text-sm text-muted-foreground">XP to next level</p>
                </div>
              </div>
              <Progress value={weeklyStats.levelProgress} className="h-3" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Detailed view of your daily learning activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyActivity.map((day, index) => (
                  <div
                    key={day.day}
                    className={`p-4 rounded-lg border ${
                      index === dailyActivity.length - 1 ? 'bg-indigo-50 border-indigo-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-600">
                          {day.day}
                        </div>
                        <div>
                          <h4 className="font-semibold">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}
                          </h4>
                          {index === dailyActivity.length - 1 && (
                            <Badge variant="secondary" className="text-xs">Today</Badge>
                          )}
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {day.xp} XP
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-2 bg-muted rounded">
                        <p className="text-xl font-bold">{day.lessons}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-xl font-bold">{day.minutes}</p>
                        <p className="text-xs text-muted-foreground">Minutes</p>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <p className="text-xl font-bold">{Math.round(day.xp / (day.minutes || 1) * 10) / 10}</p>
                        <p className="text-xs text-muted-foreground">XP/min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparisonStats.map((stat) => {
              const Icon = stat.icon;
              const change = stat.thisWeek - stat.lastWeek;
              const changePercent = Math.round((change / stat.lastWeek) * 100);
              const isPositive = change >= 0;

              return (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{stat.label}</span>
                      </div>
                      <Badge className={isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {isPositive ? '+' : ''}{changePercent}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-indigo-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                          {stat.thisWeek}{stat.unit || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">This Week</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold text-muted-foreground">
                          {stat.lastWeek}{stat.unit || ''}
                        </p>
                        <p className="text-xs text-muted-foreground">Last Week</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Weekly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <p>📊 Detailed weekly comparison charts coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Badges Earned This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div
                            className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                              rarityColors[achievement.rarity]
                            } flex items-center justify-center`}
                          >
                            <Icon className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {achievement.description}
                            </p>
                            <Badge variant="outline" className="mt-1 capitalize">
                              {achievement.rarity}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No badges earned this week yet. Keep learning!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-yellow-100 rounded-full">
                    <Target className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Next Goal</h3>
                    <p className="text-muted-foreground">
                      Complete 2 more lessons to earn the &quot;Dedicated Learner&quot; badge!
                    </p>
                    <Progress value={75} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Share2 className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold">Share Your Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Show off your weekly achievements with friends and family
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
