'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gamepad2, Play, Trophy, Clock, Star, TrendingUp, Lock,
  CheckCircle, DollarSign, PiggyBank, CreditCard, Home, Car,
  ShoppingCart, Briefcase, Target, Award, Zap
} from 'lucide-react';

const simulations = [
  {
    id: '1',
    title: 'Run a Lemonade Stand',
    description: 'Learn basic business concepts by running your own lemonade stand.',
    category: 'Entrepreneurship',
    difficulty: 'Beginner',
    duration: '15-20 min',
    xpReward: 100,
    icon: ShoppingCart,
    color: 'from-yellow-400 to-orange-500',
    completed: true,
    highScore: 850,
    maxScore: 1000,
  },
  {
    id: '2',
    title: 'Budget Challenge',
    description: 'Manage a monthly budget and make smart spending decisions.',
    category: 'Budgeting',
    difficulty: 'Beginner',
    duration: '10-15 min',
    xpReward: 75,
    icon: PiggyBank,
    color: 'from-green-400 to-emerald-500',
    completed: true,
    highScore: 920,
    maxScore: 1000,
  },
  {
    id: '3',
    title: 'Stock Market Simulator',
    description: 'Buy and sell virtual stocks to learn market dynamics.',
    category: 'Investing',
    difficulty: 'Intermediate',
    duration: '20-30 min',
    xpReward: 150,
    icon: TrendingUp,
    color: 'from-blue-400 to-indigo-500',
    completed: false,
    highScore: null,
    maxScore: 1000,
  },
  {
    id: '4',
    title: 'Credit Score Builder',
    description: 'Learn how credit scores work and how to build good credit.',
    category: 'Credit',
    difficulty: 'Intermediate',
    duration: '15-20 min',
    xpReward: 125,
    icon: CreditCard,
    color: 'from-purple-400 to-pink-500',
    completed: false,
    highScore: null,
    maxScore: 1000,
  },
  {
    id: '5',
    title: 'Home Buying Journey',
    description: 'Navigate the process of saving for and buying a home.',
    category: 'Real Estate',
    difficulty: 'Advanced',
    duration: '25-35 min',
    xpReward: 200,
    icon: Home,
    color: 'from-orange-400 to-red-500',
    completed: false,
    highScore: null,
    maxScore: 1000,
    locked: true,
    unlockRequirement: 'Complete 3 Intermediate simulations',
  },
  {
    id: '6',
    title: 'Career Path Planner',
    description: 'Make career decisions and see how they affect your finances.',
    category: 'Career',
    difficulty: 'Advanced',
    duration: '30-40 min',
    xpReward: 250,
    icon: Briefcase,
    color: 'from-teal-400 to-cyan-500',
    completed: false,
    highScore: null,
    maxScore: 1000,
    locked: true,
    unlockRequirement: 'Complete Stock Market Simulator',
  },
];

const achievements = [
  { id: '1', name: 'First Simulation', description: 'Complete your first simulation', earned: true, icon: Play },
  { id: '2', name: 'High Scorer', description: 'Score 900+ on any simulation', earned: true, icon: Trophy },
  { id: '3', name: 'Diverse Learner', description: 'Complete simulations in 3 categories', earned: false, icon: Star },
  { id: '4', name: 'Simulation Master', description: 'Complete all simulations', earned: false, icon: Award },
];

export default function SimulationsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(simulations.map(s => s.category))];
  const filteredSimulations = selectedCategory === 'All'
    ? simulations
    : simulations.filter(s => s.category === selectedCategory);

  const completedCount = simulations.filter(s => s.completed).length;
  const totalXpEarned = simulations.filter(s => s.completed).reduce((sum, s) => sum + s.xpReward, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Financial Simulations</h1>
        <p className="text-muted-foreground">Practice real-world financial decisions in a safe environment</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Completed</p>
                <p className="text-3xl font-bold">{completedCount}/{simulations.length}</p>
              </div>
              <Gamepad2 className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">XP Earned</p>
                <p className="text-2xl font-bold">{totalXpEarned}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Score</p>
                <p className="text-2xl font-bold">920</p>
              </div>
              <Trophy className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">2/4</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Simulations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSimulations.map((sim) => {
          const Icon = sim.icon;
          return (
            <Card
              key={sim.id}
              className={`overflow-hidden hover:shadow-lg transition-all ${sim.locked ? 'opacity-75' : ''}`}
            >
              {/* Header */}
              <div className={`relative h-32 bg-gradient-to-r ${sim.color}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="h-16 w-16 text-white/30" />
                </div>
                {sim.completed && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}
                {sim.locked && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge className="bg-white/20 text-white">
                    +{sim.xpReward} XP
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{sim.category}</Badge>
                  <Badge variant="outline">{sim.difficulty}</Badge>
                </div>

                <h3 className="font-semibold text-lg mb-1">{sim.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{sim.description}</p>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{sim.duration}</span>
                  </div>
                  {sim.highScore !== null && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{sim.highScore}/{sim.maxScore}</span>
                    </div>
                  )}
                </div>

                {sim.highScore !== null && (
                  <div className="mb-4">
                    <Progress value={(sim.highScore / sim.maxScore) * 100} className="h-2" />
                  </div>
                )}

                {sim.locked ? (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{sim.unlockRequirement}</p>
                  </div>
                ) : (
                  <Button className="w-full" variant={sim.completed ? 'secondary' : 'default'}>
                    <Play className="h-4 w-4 mr-2" />
                    {sim.completed ? 'Play Again' : 'Start Simulation'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Simulation Achievements
          </CardTitle>
          <CardDescription>Unlock achievements by completing simulations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    achievement.earned
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className={`p-3 rounded-full ${
                    achievement.earned ? 'bg-green-100' : 'bg-muted'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      achievement.earned ? 'text-green-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
