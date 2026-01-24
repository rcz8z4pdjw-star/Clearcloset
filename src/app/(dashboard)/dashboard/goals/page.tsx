'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Plus,
  Trophy,
  Flame,
  BookOpen,
  Brain,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  Edit2,
  Trash2,
  Award,
} from 'lucide-react';

// Mock goals data
const activeGoals = [
  {
    id: 'g1',
    title: 'Complete 5 lessons this week',
    type: 'lessons_per_week',
    target: 5,
    current: 3,
    period: 'weekly',
    startDate: '2024-02-19',
    endDate: '2024-02-25',
    xpReward: 100,
    category: 'learning',
  },
  {
    id: 'g2',
    title: 'Maintain 7-day streak',
    type: 'streak_days',
    target: 7,
    current: 5,
    period: 'custom',
    startDate: '2024-02-18',
    endDate: '2024-02-25',
    xpReward: 150,
    category: 'consistency',
  },
  {
    id: 'g3',
    title: 'Score 90%+ on 3 quizzes',
    type: 'quiz_score',
    target: 3,
    current: 1,
    period: 'monthly',
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    xpReward: 200,
    category: 'mastery',
  },
  {
    id: 'g4',
    title: 'Earn 500 XP this month',
    type: 'xp_earned',
    target: 500,
    current: 320,
    period: 'monthly',
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    xpReward: 75,
    category: 'growth',
  },
];

const completedGoals = [
  {
    id: 'cg1',
    title: 'Complete Financial Foundations track',
    type: 'track_completion',
    target: 1,
    current: 1,
    period: 'custom',
    completedAt: '2024-02-10',
    xpReward: 300,
    category: 'learning',
  },
  {
    id: 'cg2',
    title: 'Reach Level 5',
    type: 'level_up',
    target: 5,
    current: 5,
    period: 'custom',
    completedAt: '2024-02-08',
    xpReward: 250,
    category: 'growth',
  },
];

const suggestedGoals = [
  {
    id: 'sg1',
    title: 'Complete Budgeting Basics',
    description: 'Finish the Budgeting Basics learning track',
    type: 'track_completion',
    target: 1,
    period: 'monthly',
    xpReward: 300,
    category: 'learning',
    difficulty: 'medium',
  },
  {
    id: 'sg2',
    title: '14-Day Streak Challenge',
    description: 'Learn something new for 14 days straight',
    type: 'streak_days',
    target: 14,
    period: 'custom',
    xpReward: 300,
    category: 'consistency',
    difficulty: 'hard',
  },
  {
    id: 'sg3',
    title: 'Quiz Champion',
    description: 'Score 100% on any quiz',
    type: 'perfect_quiz',
    target: 1,
    period: 'weekly',
    xpReward: 150,
    category: 'mastery',
    difficulty: 'medium',
  },
  {
    id: 'sg4',
    title: 'Knowledge Explorer',
    description: 'Complete lessons from 3 different tracks',
    type: 'track_variety',
    target: 3,
    period: 'monthly',
    xpReward: 200,
    category: 'exploration',
    difficulty: 'easy',
  },
];

const categoryConfig: Record<string, { icon: typeof Target; color: string; bgColor: string }> = {
  learning: { icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  consistency: { icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-100' },
  mastery: { icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  growth: { icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-100' },
  exploration: { icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
};

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

export default function GoalsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: '',
    target: '',
    period: 'weekly',
  });

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-indigo-500" />
            My Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Set personal objectives and track your progress
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a personal goal to keep yourself motivated
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Complete 10 lessons"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Goal Type</Label>
                <Select
                  value={newGoal.type}
                  onValueChange={(value) => setNewGoal({ ...newGoal, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lessons_per_week">Complete Lessons</SelectItem>
                    <SelectItem value="quiz_score">Quiz Scores</SelectItem>
                    <SelectItem value="streak_days">Maintain Streak</SelectItem>
                    <SelectItem value="xp_earned">Earn XP</SelectItem>
                    <SelectItem value="track_completion">Complete Track</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="e.g., 10"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Time Period</Label>
                <Select
                  value={newGoal.period}
                  onValueChange={(value) => setNewGoal({ ...newGoal, period: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-indigo-700">{activeGoals.length}</p>
            <p className="text-xs text-indigo-600">Active Goals</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">{completedGoals.length}</p>
            <p className="text-xs text-green-600">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Sparkles className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">550</p>
            <p className="text-xs text-yellow-600">XP from Goals</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">85%</p>
            <p className="text-xs text-purple-600">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
          <TabsTrigger value="suggested">Suggested</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6 space-y-4">
          {activeGoals.map((goal) => {
            const config = categoryConfig[goal.category];
            const Icon = config?.icon || Target;
            const progress = getProgressPercentage(goal.current, goal.target);
            const daysLeft = getDaysRemaining(goal.endDate);

            return (
              <Card key={goal.id} className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${config?.bgColor || 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${config?.color || 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {goal.period === 'weekly' ? 'Weekly' : goal.period === 'monthly' ? 'Monthly' : 'Custom'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {daysLeft} days left
                        </span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          +{goal.xpReward} XP
                        </Badge>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{goal.current} / {goal.target}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              progress >= 100
                                ? 'bg-green-500'
                                : progress >= 75
                                ? 'bg-blue-500'
                                : progress >= 50
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {progress >= 75 && progress < 100 && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Almost there! Keep going!
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedGoals.map((goal) => {
            const config = categoryConfig[goal.category];
            const Icon = config?.icon || Target;

            return (
              <Card key={goal.id} className="bg-green-50/50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-green-100">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <Badge className="bg-green-100 text-green-700">
                          <Award className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Completed {new Date(goal.completedAt!).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="flex items-center gap-1 text-green-600">
                          <Sparkles className="h-3 w-3" />
                          +{goal.xpReward} XP earned
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="suggested" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedGoals.map((goal) => {
              const config = categoryConfig[goal.category];
              const Icon = config?.icon || Target;

              return (
                <Card key={goal.id} className="hover:shadow-lg transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${config?.bgColor || 'bg-gray-100'}`}>
                        <Icon className={`h-6 w-6 ${config?.color || 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{goal.title}</h3>
                          <Badge className={difficultyColors[goal.difficulty]}>
                            {goal.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {goal.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            +{goal.xpReward} XP
                          </Badge>
                          <Button size="sm" className="group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            Add Goal
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Sparkles className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Goal Setting Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Start with achievable goals and gradually increase difficulty</li>
                <li>Balance different types of goals for well-rounded growth</li>
                <li>Review your goals weekly to stay on track</li>
                <li>Celebrate completed goals - you&apos;ve earned it!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
