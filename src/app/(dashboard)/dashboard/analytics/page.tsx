'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, TrendingUp, Clock, BookOpen, Target, Award,
  Calendar, Flame, Brain, CheckCircle, Star, Activity
} from 'lucide-react';

const weeklyData = [
  { day: 'Mon', lessons: 3, quizzes: 1, xp: 120, minutes: 45 },
  { day: 'Tue', lessons: 2, quizzes: 2, xp: 180, minutes: 55 },
  { day: 'Wed', lessons: 4, quizzes: 1, xp: 150, minutes: 60 },
  { day: 'Thu', lessons: 1, quizzes: 0, xp: 50, minutes: 20 },
  { day: 'Fri', lessons: 3, quizzes: 2, xp: 200, minutes: 65 },
  { day: 'Sat', lessons: 5, quizzes: 3, xp: 280, minutes: 90 },
  { day: 'Sun', lessons: 2, quizzes: 1, xp: 100, minutes: 35 },
];

const monthlyProgress = [
  { week: 'Week 1', progress: 65 },
  { week: 'Week 2', progress: 72 },
  { week: 'Week 3', progress: 80 },
  { week: 'Week 4', progress: 85 },
];

const categoryBreakdown = [
  { name: 'Investing', completed: 12, total: 20, color: 'bg-blue-500' },
  { name: 'Budgeting', completed: 8, total: 10, color: 'bg-green-500' },
  { name: 'Saving', completed: 6, total: 8, color: 'bg-yellow-500' },
  { name: 'Credit', completed: 3, total: 6, color: 'bg-purple-500' },
  { name: 'Taxes', completed: 2, total: 5, color: 'bg-orange-500' },
];

const recentAchievements = [
  { name: 'Quiz Master', description: 'Pass 10 quizzes', date: '2024-02-10', icon: Target },
  { name: '7-Day Streak', description: 'Learn for 7 days straight', date: '2024-02-08', icon: Flame },
  { name: 'Fast Learner', description: 'Complete 5 lessons in one day', date: '2024-02-05', icon: Brain },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week');

  const totalXP = weeklyData.reduce((sum, d) => sum + d.xp, 0);
  const totalMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
  const totalLessons = weeklyData.reduce((sum, d) => sum + d.lessons, 0);
  const totalQuizzes = weeklyData.reduce((sum, d) => sum + d.quizzes, 0);
  const maxXP = Math.max(...weeklyData.map(d => d.xp));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Analytics</h1>
          <p className="text-muted-foreground">Track your progress and learning patterns</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total XP Earned</p>
                <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
                <p className="text-sm opacity-75 mt-1">+15% from last week</p>
              </div>
              <Star className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Learning Time</p>
                <p className="text-2xl font-bold">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
                <p className="text-sm text-green-600 mt-1">+22% from last week</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-2xl font-bold">{totalLessons}</p>
                <p className="text-sm text-green-600 mt-1">+8% from last week</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quizzes Passed</p>
                <p className="text-2xl font-bold">{totalQuizzes}</p>
                <p className="text-sm text-green-600 mt-1">+12% from last week</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          {/* Weekly Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Your learning activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {weeklyData.map((data) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-1">
                      <div
                        className="w-full bg-indigo-500 rounded-t transition-all"
                        style={{ height: `${(data.xp / maxXP) * 150}px` }}
                        title={`${data.xp} XP`}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{data.day}</span>
                    <span className="text-xs font-medium">{data.xp} XP</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Breakdown</CardTitle>
              <CardDescription>Detailed view of your daily learning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((data) => (
                  <div key={data.day} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-12 text-center font-medium">{data.day}</div>
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">{data.lessons} lessons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{data.quizzes} quizzes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">{data.minutes} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{data.xp} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Category Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress by Category</CardTitle>
              <CardDescription>Your completion rate across different topics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categoryBreakdown.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {category.completed}/{category.total} lessons
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${category.color} rounded-full transition-all`}
                        style={{ width: `${(category.completed / category.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Progress</CardTitle>
              <CardDescription>Your overall progress this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 h-48">
                {monthlyProgress.map((week) => (
                  <div key={week.week} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-lg font-bold text-indigo-600">{week.progress}%</span>
                      <div
                        className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t"
                        style={{ height: `${week.progress * 1.2}px` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">{week.week}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Learning Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
                <div>
                  <p className="text-3xl font-bold text-orange-600">14 Days</p>
                  <p className="text-sm text-muted-foreground">Current streak</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-muted-foreground">21 Days</p>
                  <p className="text-sm text-muted-foreground">Best streak</p>
                </div>
              </div>
              <div className="flex gap-1 mt-4">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-8 bg-orange-500 rounded"
                    title={`Day ${i + 1}`}
                  />
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i + 14}
                    className="flex-1 h-8 bg-muted rounded"
                    title={`Day ${i + 15}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Badges and milestones you've earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.name}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                    >
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Icon className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-yellow-500">Earned!</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Total Badges</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">Level 7</p>
                <p className="text-sm text-muted-foreground">Current Level</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold">Top 10%</p>
                <p className="text-sm text-muted-foreground">Leaderboard Rank</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
