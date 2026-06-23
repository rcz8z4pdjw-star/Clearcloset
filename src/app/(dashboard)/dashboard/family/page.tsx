'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Trophy,
  Heart,
  Target,
  BookOpen,
  MessageCircle,
  Star,
  Crown,
  Flame,
  TrendingUp,
  Gift,
  Calendar,
  ChevronRight,
  Award,
  Plus,
  Send,
} from 'lucide-react';

// Mock family data
const familyMembers = [
  {
    id: '1',
    name: 'Robert Chen',
    role: 'Dad',
    relation: 'Parent',
    avatar: null,
    level: 10,
    xp: 45200,
    streak: 45,
    lessonsCompleted: 156,
    badges: 32,
    isMentor: true,
    status: 'online',
  },
  {
    id: '2',
    name: 'Linda Chen',
    role: 'Mom',
    relation: 'Parent',
    avatar: null,
    level: 8,
    xp: 32100,
    streak: 28,
    lessonsCompleted: 112,
    badges: 24,
    isMentor: true,
    status: 'online',
  },
  {
    id: '3',
    name: 'Emma Chen',
    role: 'Sister',
    relation: 'Sibling',
    avatar: null,
    level: 5,
    xp: 8500,
    streak: 12,
    lessonsCompleted: 34,
    badges: 8,
    isMentor: false,
    status: 'offline',
  },
  {
    id: '4',
    name: 'You',
    role: 'Member',
    relation: 'Self',
    avatar: null,
    level: 6,
    xp: 12800,
    streak: 14,
    lessonsCompleted: 42,
    badges: 12,
    isMentor: false,
    status: 'online',
  },
];

const familyChallenges = [
  {
    id: 'c1',
    title: 'Family Learning Week',
    description: 'Complete 20 lessons together as a family',
    progress: 14,
    total: 20,
    xpReward: 1000,
    endsIn: '3 days',
    participants: familyMembers,
  },
  {
    id: 'c2',
    title: 'Quiz Champions',
    description: 'Every family member scores 90%+ on at least one quiz',
    progress: 3,
    total: 4,
    xpReward: 500,
    endsIn: '5 days',
    participants: familyMembers,
  },
];

const familyAchievements = [
  {
    id: 'fa1',
    title: 'Learning Family',
    description: 'Complete 100 lessons as a family',
    progress: 344,
    target: 100,
    completed: true,
    xpReward: 2000,
  },
  {
    id: 'fa2',
    title: 'Streak Masters',
    description: 'All family members maintain 7+ day streaks',
    progress: 3,
    target: 4,
    completed: false,
    xpReward: 1500,
  },
  {
    id: 'fa3',
    title: 'Badge Collectors',
    description: 'Earn 50 badges as a family',
    progress: 76,
    target: 50,
    completed: true,
    xpReward: 1000,
  },
];

const recentActivity = [
  {
    id: 'a1',
    member: 'Dad',
    action: 'completed',
    target: 'Advanced Investing',
    time: '2 hours ago',
    xp: 100,
  },
  {
    id: 'a2',
    member: 'Emma',
    action: 'earned badge',
    target: 'Savings Star',
    time: '4 hours ago',
    xp: 200,
  },
  {
    id: 'a3',
    member: 'Mom',
    action: 'started',
    target: 'Tax Planning Basics',
    time: '5 hours ago',
    xp: 0,
  },
  {
    id: 'a4',
    member: 'You',
    action: 'completed quiz',
    target: 'Budgeting 101',
    time: '1 day ago',
    xp: 150,
  },
];

export default function FamilyPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const totalFamilyXP = familyMembers.reduce((sum, m) => sum + m.xp, 0);
  const totalLessons = familyMembers.reduce((sum, m) => sum + m.lessonsCompleted, 0);
  const totalBadges = familyMembers.reduce((sum, m) => sum + m.badges, 0);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-500" />
            Chen Family
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn together, grow together!
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite Family Member
        </Button>
      </div>

      {/* Family Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-indigo-700">{totalFamilyXP.toLocaleString()}</p>
            <p className="text-sm text-indigo-600">Total Family XP</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">{totalLessons}</p>
            <p className="text-sm text-green-600">Lessons Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">{totalBadges}</p>
            <p className="text-sm text-yellow-600">Badges Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">{familyMembers.length}</p>
            <p className="text-sm text-purple-600">Family Members</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Family Members Quick View */}
          <Card>
            <CardHeader>
              <CardTitle>Family Members</CardTitle>
              <CardDescription>See how everyone is doing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        member.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{member.name}</p>
                        {member.isMentor && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="h-3 w-3 mr-1" />
                            Mentor
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" /> Level {member.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" /> {member.streak} day streak
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Active Family Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <Calendar className="h-3 w-3 mr-1" />
                      {challenge.endsIn}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{challenge.progress}/{challenge.total} completed</span>
                      <span className="text-indigo-600 font-medium">
                        <Gift className="h-4 w-4 inline mr-1" />
                        {challenge.xpReward} XP
                      </span>
                    </div>
                    <Progress value={(challenge.progress / challenge.total) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Family Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">
                        {activity.member[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{activity.member}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    {activity.xp > 0 && (
                      <Badge variant="secondary" className="text-green-600">
                        +{activity.xp} XP
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {familyMembers.map((member) => (
              <Card key={member.id} className="overflow-hidden">
                <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <CardContent className="pt-0 -mt-10">
                  <div className="flex items-end gap-4 mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{member.name}</h3>
                      <p className="text-muted-foreground">{member.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">{member.level}</p>
                      <p className="text-xs text-muted-foreground">Level</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{member.streak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{member.badges}</p>
                      <p className="text-xs text-muted-foreground">Badges</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Heart className="h-4 w-4 mr-1" />
                      Cheer
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Family Challenges</CardTitle>
                  <CardDescription>Work together to earn bonus XP!</CardDescription>
                </div>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyChallenges.map((challenge) => (
                <Card key={challenge.id} className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{challenge.title}</h3>
                        <p className="text-muted-foreground">{challenge.description}</p>
                      </div>
                      <Badge className="bg-purple-500 text-white">
                        {challenge.endsIn} left
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Family Progress</span>
                        <span className="font-medium">{challenge.progress}/{challenge.total}</span>
                      </div>
                      <Progress value={(challenge.progress / challenge.total) * 100} className="h-3" />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex -space-x-2">
                        {challenge.participants.map((p) => (
                          <Avatar key={p.id} className="h-8 w-8 border-2 border-white">
                            <AvatarFallback className="text-xs bg-indigo-100">
                              {p.name[0]}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-lg font-bold text-indigo-600">
                        <Gift className="h-5 w-5" />
                        {challenge.xpReward} XP
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Family Achievements</CardTitle>
              <CardDescription>Milestones you&apos;ve reached together</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {familyAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    achievement.completed
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className={`p-3 rounded-full ${
                    achievement.completed ? 'bg-yellow-100' : 'bg-muted'
                  }`}>
                    <Trophy className={`h-6 w-6 ${
                      achievement.completed ? 'text-yellow-600' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {!achievement.completed && (
                      <div className="mt-2">
                        <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.progress}/{achievement.target}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge variant={achievement.completed ? 'default' : 'outline'} className={
                    achievement.completed ? 'bg-yellow-500 text-white' : ''
                  }>
                    <Gift className="h-3 w-3 mr-1" />
                    {achievement.xpReward} XP
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
