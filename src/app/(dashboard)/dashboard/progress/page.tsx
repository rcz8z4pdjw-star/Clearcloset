'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  BookOpen,
  Trophy,
  Target,
  Clock,
  Calendar,
  BarChart3,
  Star,
  Flame,
  Award,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
} from 'lucide-react';

// Mock progress data
const overallProgress = {
  totalLessons: 42,
  totalQuizzes: 18,
  totalXP: 12800,
  currentLevel: 6,
  currentStreak: 14,
  longestStreak: 21,
  hoursLearned: 28.5,
  averageQuizScore: 87,
  badgesEarned: 12,
  tracksCompleted: 2,
  tracksInProgress: 3,
};

const weeklyActivity = [
  { day: 'Mon', lessons: 2, xp: 150, minutes: 45 },
  { day: 'Tue', lessons: 1, xp: 80, minutes: 25 },
  { day: 'Wed', lessons: 3, xp: 220, minutes: 65 },
  { day: 'Thu', lessons: 0, xp: 0, minutes: 0 },
  { day: 'Fri', lessons: 2, xp: 180, minutes: 50 },
  { day: 'Sat', lessons: 1, xp: 100, minutes: 30 },
  { day: 'Sun', lessons: 2, xp: 160, minutes: 40 },
];

const trackProgress = [
  {
    id: 't1',
    name: 'Financial Foundations',
    progress: 100,
    lessonsCompleted: 12,
    totalLessons: 12,
    quizAverage: 92,
    status: 'completed',
    completedDate: '2024-01-20',
  },
  {
    id: 't2',
    name: 'Budgeting Basics',
    progress: 100,
    lessonsCompleted: 8,
    totalLessons: 8,
    quizAverage: 88,
    status: 'completed',
    completedDate: '2024-02-05',
  },
  {
    id: 't3',
    name: 'Introduction to Investing',
    progress: 65,
    lessonsCompleted: 5,
    totalLessons: 8,
    quizAverage: 85,
    status: 'in_progress',
  },
  {
    id: 't4',
    name: 'Smart Saving Strategies',
    progress: 40,
    lessonsCompleted: 4,
    totalLessons: 10,
    quizAverage: 90,
    status: 'in_progress',
  },
  {
    id: 't5',
    name: 'Understanding Credit',
    progress: 20,
    lessonsCompleted: 2,
    totalLessons: 10,
    quizAverage: 82,
    status: 'in_progress',
  },
];

const recentQuizzes = [
  { id: 'q1', name: 'Stock Market Basics', score: 95, date: '2024-02-15', passed: true },
  { id: 'q2', name: 'Emergency Funds', score: 80, date: '2024-02-12', passed: true },
  { id: 'q3', name: 'Compound Interest', score: 100, date: '2024-02-10', passed: true },
  { id: 'q4', name: 'Budgeting Methods', score: 75, date: '2024-02-08', passed: true },
  { id: 'q5', name: 'Investment Types', score: 90, date: '2024-02-05', passed: true },
];

const milestones = [
  { id: 'm1', title: 'First Lesson', description: 'Completed your first lesson', achieved: true, date: '2024-01-01' },
  { id: 'm2', title: '10 Lessons', description: 'Completed 10 lessons', achieved: true, date: '2024-01-15' },
  { id: 'm3', title: '25 Lessons', description: 'Completed 25 lessons', achieved: true, date: '2024-02-01' },
  { id: 'm4', title: '50 Lessons', description: 'Complete 50 lessons', achieved: false, progress: 42 },
  { id: 'm5', title: 'First Track', description: 'Completed your first track', achieved: true, date: '2024-01-20' },
  { id: 'm6', title: 'Quiz Master', description: 'Passed 20 quizzes', achieved: false, progress: 18 },
];

export default function ProgressPage() {
  const [timeframe, setTimeframe] = useState('week');

  const maxBarHeight = 100;
  const maxXP = Math.max(...weeklyActivity.map(d => d.xp));

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-500" />
            Your Progress
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your learning journey and achievements
          </p>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-4">
            <BookOpen className="h-6 w-6 text-blue-500 mb-2" />
            <p className="text-3xl font-bold text-blue-700">{overallProgress.totalLessons}</p>
            <p className="text-sm text-blue-600">Lessons Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <Trophy className="h-6 w-6 text-purple-500 mb-2" />
            <p className="text-3xl font-bold text-purple-700">{overallProgress.totalXP.toLocaleString()}</p>
            <p className="text-sm text-purple-600">Total XP</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="p-4">
            <Flame className="h-6 w-6 text-orange-500 mb-2" />
            <p className="text-3xl font-bold text-orange-700">{overallProgress.currentStreak}</p>
            <p className="text-sm text-orange-600">Day Streak</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <Target className="h-6 w-6 text-green-500 mb-2" />
            <p className="text-3xl font-bold text-green-700">{overallProgress.averageQuizScore}%</p>
            <p className="text-sm text-green-600">Avg Quiz Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <CardContent className="p-4">
            <Award className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-3xl font-bold text-yellow-700">{overallProgress.badgesEarned}</p>
            <p className="text-sm text-yellow-600">Badges Earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Your XP earned each day this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyActivity.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs font-medium text-indigo-600 mb-1">{day.xp}</span>
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all hover:from-indigo-600 hover:to-indigo-500"
                      style={{
                        height: `${maxXP > 0 ? (day.xp / maxXP) * maxBarHeight : 0}%`,
                        minHeight: day.xp > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6 pt-4 border-t">
              <div className="text-center">
                <p className="text-lg font-bold">{weeklyActivity.reduce((s, d) => s + d.lessons, 0)}</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{weeklyActivity.reduce((s, d) => s + d.xp, 0)}</p>
                <p className="text-xs text-muted-foreground">XP Earned</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{weeklyActivity.reduce((s, d) => s + d.minutes, 0)}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{weeklyActivity.filter(d => d.lessons > 0).length}</p>
                <p className="text-xs text-muted-foreground">Active Days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  milestone.achieved ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  milestone.achieved ? 'bg-green-100' : 'bg-muted'
                }`}>
                  {milestone.achieved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Target className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{milestone.title}</p>
                  {milestone.achieved ? (
                    <p className="text-xs text-muted-foreground">
                      {new Date(milestone.date!).toLocaleDateString()}
                    </p>
                  ) : (
                    <Progress value={(milestone.progress! / 50) * 100} className="h-1 mt-1" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Track Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Learning Tracks
          </CardTitle>
          <CardDescription>Your progress across all learning tracks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {trackProgress.map((track) => (
              <div key={track.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{track.name}</h4>
                    {track.status === 'completed' ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline">In Progress</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {track.lessonsCompleted}/{track.totalLessons} lessons
                    </span>
                    <span className="font-medium text-indigo-600">
                      Avg: {track.quizAverage}%
                    </span>
                  </div>
                </div>
                <Progress value={track.progress} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Quizzes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Recent Quiz Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    quiz.score >= 90
                      ? 'bg-green-100 text-green-700'
                      : quiz.score >= 80
                      ? 'bg-blue-100 text-blue-700'
                      : quiz.score >= 70
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {quiz.score}%
                  </div>
                  <div>
                    <p className="font-medium">{quiz.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(quiz.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={quiz.passed ? 'default' : 'destructive'}>
                  {quiz.passed ? 'Passed' : 'Retry'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
