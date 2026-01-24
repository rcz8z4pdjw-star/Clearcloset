'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Flame,
  Trophy,
  Star,
  Clock,
  Users,
  Zap,
  Gift,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
  Calendar,
  TrendingUp,
  BookOpen,
  Brain,
  Coins,
  Timer,
  Award,
} from 'lucide-react';

// Daily challenges
const dailyChallenges = [
  {
    id: 'd1',
    title: 'Complete a Lesson',
    description: 'Finish any lesson to earn bonus XP',
    xpReward: 50,
    type: 'learning',
    icon: BookOpen,
    progress: 0,
    target: 1,
    completed: false,
    expiresIn: '8h 23m',
  },
  {
    id: 'd2',
    title: 'Quiz Master',
    description: 'Score 80% or higher on any quiz',
    xpReward: 75,
    type: 'quiz',
    icon: Brain,
    progress: 0,
    target: 1,
    completed: false,
    expiresIn: '8h 23m',
  },
  {
    id: 'd3',
    title: 'Social Butterfly',
    description: 'Leave a comment or like on the activity feed',
    xpReward: 25,
    type: 'social',
    icon: Users,
    progress: 1,
    target: 1,
    completed: true,
    expiresIn: '8h 23m',
  },
  {
    id: 'd4',
    title: 'Financial Explorer',
    description: 'Use any financial calculator tool',
    xpReward: 30,
    type: 'tools',
    icon: Coins,
    progress: 0,
    target: 1,
    completed: false,
    expiresIn: '8h 23m',
  },
];

// Weekly challenges
const weeklyChallenges = [
  {
    id: 'w1',
    title: 'Learning Streak',
    description: 'Complete lessons for 5 days in a row',
    xpReward: 250,
    bonusReward: 'Streak Shield (1 day protection)',
    type: 'streak',
    icon: Flame,
    progress: 3,
    target: 5,
    completed: false,
    expiresIn: '4 days',
  },
  {
    id: 'w2',
    title: 'Knowledge Seeker',
    description: 'Complete 10 lessons this week',
    xpReward: 300,
    bonusReward: '2x XP Boost (24h)',
    type: 'learning',
    icon: BookOpen,
    progress: 6,
    target: 10,
    completed: false,
    expiresIn: '4 days',
  },
  {
    id: 'w3',
    title: 'Quiz Champion',
    description: 'Get a perfect score on 3 quizzes',
    xpReward: 200,
    bonusReward: 'Exclusive Badge',
    type: 'quiz',
    icon: Trophy,
    progress: 1,
    target: 3,
    completed: false,
    expiresIn: '4 days',
  },
  {
    id: 'w4',
    title: 'Community Builder',
    description: 'Connect with 2 new learners',
    xpReward: 150,
    type: 'social',
    icon: Users,
    progress: 2,
    target: 2,
    completed: true,
    expiresIn: '4 days',
  },
];

// Monthly challenges
const monthlyChallenges = [
  {
    id: 'm1',
    title: 'Track Master',
    description: 'Complete an entire learning track',
    xpReward: 1000,
    bonusReward: 'Legendary Badge + Certificate',
    type: 'track',
    icon: Award,
    progress: 75,
    target: 100,
    completed: false,
    expiresIn: '18 days',
  },
  {
    id: 'm2',
    title: 'Consistency King',
    description: 'Maintain a 21-day learning streak',
    xpReward: 750,
    bonusReward: 'Premium Avatar Frame',
    type: 'streak',
    icon: Flame,
    progress: 12,
    target: 21,
    completed: false,
    expiresIn: '18 days',
  },
  {
    id: 'm3',
    title: 'Portfolio Pro',
    description: 'Grow your simulated portfolio by 10%',
    xpReward: 500,
    bonusReward: 'Investor Badge',
    type: 'investing',
    icon: TrendingUp,
    progress: 7,
    target: 10,
    completed: false,
    expiresIn: '18 days',
  },
];

// Family challenges
const familyChallenges = [
  {
    id: 'f1',
    title: 'Family Learning Week',
    description: 'All family members complete at least 3 lessons each',
    xpReward: 500,
    bonusReward: 'Family Badge for everyone',
    participants: [
      { name: 'You', progress: 5, target: 3, completed: true },
      { name: 'Alex', progress: 2, target: 3, completed: false },
      { name: 'Jamie', progress: 3, target: 3, completed: true },
    ],
    totalProgress: 66,
    expiresIn: '3 days',
  },
  {
    id: 'f2',
    title: 'Quiz Night',
    description: 'Family members collectively score 500 points on quizzes',
    xpReward: 300,
    bonusReward: '2x XP Weekend for family',
    participants: [
      { name: 'You', progress: 180, target: 500, completed: false },
      { name: 'Alex', progress: 120, target: 500, completed: false },
      { name: 'Jamie', progress: 150, target: 500, completed: false },
    ],
    totalProgress: 90,
    expiresIn: '5 days',
  },
];

// Special/limited time challenges
const specialChallenges = [
  {
    id: 's1',
    title: 'New Year Financial Goals',
    description: 'Set and track 3 financial goals for the year',
    xpReward: 400,
    bonusReward: 'Limited Edition 2024 Badge',
    icon: Target,
    progress: 2,
    target: 3,
    completed: false,
    endsAt: 'Jan 31, 2024',
    theme: 'from-blue-500 to-purple-500',
  },
  {
    id: 's2',
    title: 'Financial Literacy Month',
    description: 'Complete 5 budgeting lessons',
    xpReward: 350,
    bonusReward: 'Budget Master Badge',
    icon: BookOpen,
    progress: 3,
    target: 5,
    completed: false,
    endsAt: 'Apr 30, 2024',
    theme: 'from-green-500 to-emerald-500',
  },
];

const typeColors: Record<string, string> = {
  learning: 'bg-blue-100 text-blue-700',
  quiz: 'bg-purple-100 text-purple-700',
  social: 'bg-green-100 text-green-700',
  tools: 'bg-yellow-100 text-yellow-700',
  streak: 'bg-orange-100 text-orange-700',
  track: 'bg-indigo-100 text-indigo-700',
  investing: 'bg-emerald-100 text-emerald-700',
};

function ChallengeCard({ challenge, showBonus = false }: { challenge: any; showBonus?: boolean }) {
  const Icon = challenge.icon;
  const progressPercent = (challenge.progress / challenge.target) * 100;

  return (
    <Card className={`transition-all hover:shadow-md ${challenge.completed ? 'bg-green-50 border-green-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${challenge.completed ? 'bg-green-100' : 'bg-muted'}`}>
            <Icon className={`h-6 w-6 ${challenge.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{challenge.title}</h3>
              {challenge.completed && (
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{challenge.progress} / {challenge.target}</span>
                <span className="text-muted-foreground">{challenge.expiresIn || challenge.endsAt}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {challenge.xpReward} XP
                </Badge>
                {showBonus && challenge.bonusReward && (
                  <Badge variant="outline" className="text-xs">
                    <Gift className="h-3 w-3 mr-1" />
                    {challenge.bonusReward}
                  </Badge>
                )}
              </div>
              {!challenge.completed && (
                <Button size="sm" variant="ghost">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState('daily');

  const dailyCompleted = dailyChallenges.filter(c => c.completed).length;
  const weeklyCompleted = weeklyChallenges.filter(c => c.completed).length;
  const monthlyCompleted = monthlyChallenges.filter(c => c.completed).length;

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-indigo-500" />
            Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete challenges to earn XP and exclusive rewards
          </p>
        </div>
        <Card className="bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-700">12</p>
              <p className="text-xs text-orange-600">Day Streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{dailyCompleted}/{dailyChallenges.length}</div>
            <p className="text-sm text-muted-foreground">Daily</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{weeklyCompleted}/{weeklyChallenges.length}</div>
            <p className="text-sm text-muted-foreground">Weekly</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{monthlyCompleted}/{monthlyChallenges.length}</div>
            <p className="text-sm text-muted-foreground">Monthly</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-indigo-600">2,450</div>
            <p className="text-sm text-indigo-500">XP This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Special/Limited Time Challenges */}
      {specialChallenges.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <CardTitle>Special Challenges</CardTitle>
            </div>
            <CardDescription className="text-indigo-100">
              Limited-time challenges with exclusive rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialChallenges.map((challenge) => {
                const Icon = challenge.icon;
                const progressPercent = (challenge.progress / challenge.target) * 100;

                return (
                  <Card key={challenge.id} className="border-2 border-dashed border-indigo-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${challenge.theme}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                          <div className="space-y-2">
                            <Progress value={progressPercent} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{challenge.progress} / {challenge.target}</span>
                              <span>Ends {challenge.endsAt}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge className="bg-yellow-100 text-yellow-700">
                              {challenge.xpReward} XP
                            </Badge>
                            <Badge variant="outline">
                              <Gift className="h-3 w-3 mr-1" />
                              {challenge.bonusReward}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Challenges Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="daily" className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Family
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Resets in 8h 23m</span>
              </div>
              <Badge variant="outline">
                Complete all for 100 bonus XP
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Resets Monday</span>
              </div>
              <Badge variant="outline">
                Complete all for 500 bonus XP
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} showBonus />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">18 days remaining</span>
              </div>
              <Badge variant="outline">
                Complete all for 1000 bonus XP
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {monthlyChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} showBonus />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="family" className="mt-6">
          <div className="space-y-4">
            {familyChallenges.map((challenge) => (
              <Card key={challenge.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        {challenge.title}
                      </CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {challenge.xpReward} XP each
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {challenge.participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-20 font-medium">{participant.name}</div>
                        <div className="flex-1">
                          <Progress
                            value={(participant.progress / participant.target) * 100}
                            className="h-2"
                          />
                        </div>
                        <div className="w-16 text-sm text-right">
                          {participant.progress}/{participant.target}
                        </div>
                        {participant.completed && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    ))}
                    <div className="pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Team Progress:</span>
                        <span className="font-semibold">{challenge.totalProgress}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{challenge.expiresIn}</span>
                      </div>
                    </div>
                    {challenge.bonusReward && (
                      <div className="p-3 bg-indigo-50 rounded-lg flex items-center gap-2">
                        <Gift className="h-5 w-5 text-indigo-500" />
                        <span className="text-sm text-indigo-700">Bonus: {challenge.bonusReward}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Motivation Card */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-100 rounded-full">
              <Zap className="h-8 w-8 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Keep Going!</h3>
              <p className="text-muted-foreground">
                You&apos;re on fire! Complete 2 more daily challenges to earn a streak bonus of 100 XP.
              </p>
            </div>
            <Button className="ml-auto bg-indigo-500 hover:bg-indigo-600">
              View Next Challenge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
