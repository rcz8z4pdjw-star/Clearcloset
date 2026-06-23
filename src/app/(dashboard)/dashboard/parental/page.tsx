'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Eye,
  Clock,
  BookOpen,
  Trophy,
  Bell,
  Settings,
  TrendingUp,
  Calendar,
  Star,
  Flame,
  Target,
  Users,
  MessageCircle,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from 'lucide-react';

// Mock children data
const children = [
  {
    id: 'c1',
    name: 'Alex',
    age: 14,
    ageBand: 'TEEN_SKILLS',
    avatar: null,
    level: 6,
    xp: 12800,
    streak: 14,
    lessonsThisWeek: 8,
    quizzesThisWeek: 3,
    averageScore: 87,
    timeSpentThisWeek: 145, // minutes
    lastActive: '2 hours ago',
    status: 'on_track',
  },
  {
    id: 'c2',
    name: 'Emma',
    age: 11,
    ageBand: 'JUNIOR_FOUNDATIONS',
    avatar: null,
    level: 4,
    xp: 5200,
    streak: 8,
    lessonsThisWeek: 5,
    quizzesThisWeek: 2,
    averageScore: 92,
    timeSpentThisWeek: 95, // minutes
    lastActive: '4 hours ago',
    status: 'excellent',
  },
];

const recentActivity = [
  { id: 'a1', child: 'Alex', action: 'Completed lesson', target: 'Stock Market Basics', time: '2 hours ago', type: 'lesson' },
  { id: 'a2', child: 'Emma', action: 'Earned badge', target: 'Savings Star', time: '4 hours ago', type: 'badge' },
  { id: 'a3', child: 'Alex', action: 'Passed quiz', target: 'Budgeting 101', score: 85, time: '1 day ago', type: 'quiz' },
  { id: 'a4', child: 'Emma', action: 'Completed lesson', target: 'What is Money?', time: '1 day ago', type: 'lesson' },
  { id: 'a5', child: 'Alex', action: 'Started track', target: 'Introduction to Investing', time: '2 days ago', type: 'track' },
];

const weeklyGoals = [
  { id: 'g1', child: 'Alex', goal: '10 lessons per week', progress: 8, target: 10, met: false },
  { id: 'g2', child: 'Alex', goal: 'Maintain 7+ day streak', progress: 14, target: 7, met: true },
  { id: 'g3', child: 'Emma', goal: '5 lessons per week', progress: 5, target: 5, met: true },
  { id: 'g4', child: 'Emma', goal: '80%+ quiz average', progress: 92, target: 80, met: true },
];

export default function ParentalControlsPage() {
  const [selectedChild, setSelectedChild] = useState(children[0]);
  const [settings, setSettings] = useState({
    dailyTimeLimit: true,
    timeLimitMinutes: 60,
    contentFilter: 'age_appropriate',
    socialFeatures: true,
    weeklyReports: true,
    achievementNotifications: true,
    progressAlerts: true,
    requireApprovalForMentorSessions: false,
  });

  const statusColors = {
    excellent: 'bg-green-100 text-green-700 border-green-200',
    on_track: 'bg-blue-100 text-blue-700 border-blue-200',
    needs_attention: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    struggling: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels = {
    excellent: 'Excellent Progress',
    on_track: 'On Track',
    needs_attention: 'Needs Attention',
    struggling: 'Needs Support',
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-500" />
            Parental Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor your children&apos;s learning progress and manage settings
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Child Selector */}
      <div className="flex gap-4">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelectedChild(child)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              selectedChild.id === child.id
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : 'border-border hover:border-indigo-200'
            }`}
          >
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg">
                {child.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="font-semibold">{child.name}</p>
              <p className="text-sm text-muted-foreground">Age {child.age}</p>
            </div>
            <Badge className={statusColors[child.status as keyof typeof statusColors]}>
              {child.status === 'excellent' && <Star className="h-3 w-3 mr-1" />}
              {child.status === 'on_track' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {statusLabels[child.status as keyof typeof statusLabels]}
            </Badge>
          </button>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="settings">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <Star className="h-6 w-6 text-indigo-500 mb-2" />
                <p className="text-2xl font-bold">{selectedChild.level}</p>
                <p className="text-sm text-muted-foreground">Current Level</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Trophy className="h-6 w-6 text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{selectedChild.xp.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Flame className="h-6 w-6 text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{selectedChild.streak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <BookOpen className="h-6 w-6 text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{selectedChild.lessonsThisWeek}</p>
                <p className="text-sm text-muted-foreground">Lessons This Week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <Clock className="h-6 w-6 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{Math.round(selectedChild.timeSpentThisWeek / 60)}h {selectedChild.timeSpentThisWeek % 60}m</p>
                <p className="text-sm text-muted-foreground">Time This Week</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Weekly Progress
                </CardTitle>
                <CardDescription>
                  How {selectedChild.name} is doing this week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Lessons Completed</span>
                    <span className="font-medium">{selectedChild.lessonsThisWeek}/10 goal</span>
                  </div>
                  <Progress value={(selectedChild.lessonsThisWeek / 10) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quiz Average</span>
                    <span className="font-medium">{selectedChild.averageScore}%</span>
                  </div>
                  <Progress value={selectedChild.averageScore} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Learning Time</span>
                    <span className="font-medium">{selectedChild.timeSpentThisWeek} min</span>
                  </div>
                  <Progress value={(selectedChild.timeSpentThisWeek / 180) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity
                    .filter(a => a.child === selectedChild.name)
                    .slice(0, 4)
                    .map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.type === 'lesson' ? 'bg-blue-100' :
                          activity.type === 'quiz' ? 'bg-green-100' :
                          activity.type === 'badge' ? 'bg-yellow-100' : 'bg-purple-100'
                        }`}>
                          {activity.type === 'lesson' && <BookOpen className="h-4 w-4 text-blue-600" />}
                          {activity.type === 'quiz' && <Target className="h-4 w-4 text-green-600" />}
                          {activity.type === 'badge' && <Trophy className="h-4 w-4 text-yellow-600" />}
                          {activity.type === 'track' && <Star className="h-4 w-4 text-purple-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            {activity.action}: <span className="font-medium">{activity.target}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                        {activity.score && (
                          <Badge variant="outline">{activity.score}%</Badge>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-indigo-500" />
                Insights for {selectedChild.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Strong Performance</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedChild.name}&apos;s quiz scores are above average. They&apos;re retaining information well!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <Flame className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Great Consistency</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedChild.streak}-day learning streak shows dedication. Encourage them to keep going!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                All of {selectedChild.name}&apos;s recent activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity
                  .filter(a => a.child === selectedChild.name)
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          activity.type === 'lesson' ? 'bg-blue-100' :
                          activity.type === 'quiz' ? 'bg-green-100' :
                          activity.type === 'badge' ? 'bg-yellow-100' : 'bg-purple-100'
                        }`}>
                          {activity.type === 'lesson' && <BookOpen className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'quiz' && <Target className="h-5 w-5 text-green-600" />}
                          {activity.type === 'badge' && <Trophy className="h-5 w-5 text-yellow-600" />}
                          {activity.type === 'track' && <Star className="h-5 w-5 text-purple-600" />}
                        </div>
                        <div>
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.target}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                        {activity.score && (
                          <Badge className="mt-1">{activity.score}%</Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Goals</CardTitle>
                  <CardDescription>
                    Set and track learning goals for {selectedChild.name}
                  </CardDescription>
                </div>
                <Button>
                  <Target className="h-4 w-4 mr-2" />
                  Set New Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyGoals
                  .filter(g => g.child === selectedChild.name)
                  .map((goal) => (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-lg border-2 ${
                        goal.met ? 'border-green-200 bg-green-50' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {goal.met ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Target className="h-5 w-5 text-muted-foreground" />
                          )}
                          <span className="font-medium">{goal.goal}</span>
                        </div>
                        {goal.met && (
                          <Badge className="bg-green-500">Goal Met!</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{goal.progress}/{goal.target}</span>
                        </div>
                        <Progress
                          value={Math.min((goal.progress / goal.target) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Time Controls
                </CardTitle>
                <CardDescription>
                  Manage how long {selectedChild.name} can use the app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Time Limit</Label>
                    <p className="text-sm text-muted-foreground">
                      Limit daily app usage
                    </p>
                  </div>
                  <Switch
                    checked={settings.dailyTimeLimit}
                    onCheckedChange={(checked) =>
                      setSettings(s => ({ ...s, dailyTimeLimit: checked }))
                    }
                  />
                </div>

                {settings.dailyTimeLimit && (
                  <div className="space-y-2">
                    <Label>Time Limit (minutes)</Label>
                    <Select
                      value={String(settings.timeLimitMinutes)}
                      onValueChange={(v) =>
                        setSettings(s => ({ ...s, timeLimitMinutes: Number(v) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Content & Safety
                </CardTitle>
                <CardDescription>
                  Control what content {selectedChild.name} can access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Content Filter</Label>
                  <Select
                    value={settings.contentFilter}
                    onValueChange={(v) =>
                      setSettings(s => ({ ...s, contentFilter: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="age_appropriate">Age Appropriate Only</SelectItem>
                      <SelectItem value="all_ages">All Ages Content</SelectItem>
                      <SelectItem value="advanced">Include Advanced Topics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Social Features</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow connections and messaging
                    </p>
                  </div>
                  <Switch
                    checked={settings.socialFeatures}
                    onCheckedChange={(checked) =>
                      setSettings(s => ({ ...s, socialFeatures: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Mentor Session Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      You must approve mentor sessions
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireApprovalForMentorSessions}
                    onCheckedChange={(checked) =>
                      setSettings(s => ({ ...s, requireApprovalForMentorSessions: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-purple-500" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Choose what updates you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Progress Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Email summary every Sunday
                      </p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) =>
                        setSettings(s => ({ ...s, weeklyReports: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Achievement Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        When badges are earned
                      </p>
                    </div>
                    <Switch
                      checked={settings.achievementNotifications}
                      onCheckedChange={(checked) =>
                        setSettings(s => ({ ...s, achievementNotifications: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Progress Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        If progress drops
                      </p>
                    </div>
                    <Switch
                      checked={settings.progressAlerts}
                      onCheckedChange={(checked) =>
                        setSettings(s => ({ ...s, progressAlerts: checked }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
