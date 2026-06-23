'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen,
  Trophy,
  Star,
  MessageCircle,
  Heart,
  Share2,
  Award,
  Flame,
  Target,
  GraduationCap,
  Users,
  ThumbsUp,
  Send,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

// Mock activity data
const activityFeed = [
  {
    id: '1',
    type: 'achievement',
    user: { name: 'Alex Chen', avatar: null, initials: 'AC' },
    action: 'earned a new badge',
    target: 'Investment Pro',
    timestamp: '2 hours ago',
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    likes: 12,
    comments: 3,
    liked: false,
  },
  {
    id: '2',
    type: 'lesson',
    user: { name: 'Jordan Smith', avatar: null, initials: 'JS' },
    action: 'completed the lesson',
    target: 'Understanding Compound Interest',
    timestamp: '3 hours ago',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    likes: 8,
    comments: 1,
    liked: true,
  },
  {
    id: '3',
    type: 'streak',
    user: { name: 'Taylor Kim', avatar: null, initials: 'TK' },
    action: 'hit a',
    target: '30-day learning streak!',
    timestamp: '4 hours ago',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    likes: 24,
    comments: 7,
    liked: false,
  },
  {
    id: '4',
    type: 'quiz',
    user: { name: 'Casey Williams', avatar: null, initials: 'CW' },
    action: 'scored 100% on',
    target: 'Budgeting Basics Quiz',
    timestamp: '5 hours ago',
    icon: Target,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
    likes: 15,
    comments: 4,
    liked: true,
  },
  {
    id: '5',
    type: 'level',
    user: { name: 'Morgan Lee', avatar: null, initials: 'ML' },
    action: 'reached',
    target: 'Level 6 - Financial Explorer',
    timestamp: '6 hours ago',
    icon: TrendingUp,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    likes: 18,
    comments: 5,
    liked: false,
  },
  {
    id: '6',
    type: 'module',
    user: { name: 'Riley Johnson', avatar: null, initials: 'RJ' },
    action: 'completed the module',
    target: 'Introduction to Investing',
    timestamp: '8 hours ago',
    icon: GraduationCap,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
    likes: 10,
    comments: 2,
    liked: false,
  },
];

const familyActivity = [
  {
    id: 'f1',
    type: 'achievement',
    user: { name: 'Dad', avatar: null, initials: 'D' },
    action: 'earned',
    target: 'Mentor of the Month',
    timestamp: '1 day ago',
    icon: Trophy,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    likes: 5,
    comments: 2,
    liked: true,
  },
  {
    id: 'f2',
    type: 'lesson',
    user: { name: 'Emma (Sister)', avatar: null, initials: 'E' },
    action: 'completed',
    target: 'My First Budget',
    timestamp: '2 days ago',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    likes: 8,
    comments: 3,
    liked: true,
  },
];

const challenges = [
  {
    id: 'c1',
    title: 'Family Learning Challenge',
    description: 'Complete 10 lessons as a family this week',
    progress: 7,
    total: 10,
    reward: '500 Family XP',
    daysLeft: 3,
    participants: ['Dad', 'Mom', 'You', 'Emma'],
  },
  {
    id: 'c2',
    title: 'Quiz Master Challenge',
    description: 'Score 90% or higher on 5 quizzes',
    progress: 3,
    total: 5,
    reward: 'Quiz Master Badge',
    daysLeft: 5,
    participants: ['You'],
  },
];

export default function ActivityPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [activities, setActivities] = useState(activityFeed);
  const [newPost, setNewPost] = useState('');

  const handleLike = (activityId: string) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              liked: !activity.liked,
              likes: activity.liked ? activity.likes - 1 : activity.likes + 1,
            }
          : activity
      )
    );
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-yellow-500" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-1">
            See what everyone&apos;s been learning and achieving!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Share Something */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-indigo-500 text-white">YO</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Share an update with your learning community..."
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Award className="h-4 w-4 mr-1" />
                        Badge
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Target className="h-4 w-4 mr-1" />
                        Goal
                      </Button>
                    </div>
                    <Button size="sm" disabled={!newPost.trim()}>
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">
                <Users className="h-4 w-4 mr-1" />
                All Activity
              </TabsTrigger>
              <TabsTrigger value="family">
                <Heart className="h-4 w-4 mr-1" />
                Family
              </TabsTrigger>
              <TabsTrigger value="achievements">
                <Trophy className="h-4 w-4 mr-1" />
                Achievements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onLike={() => handleLike(activity.id)}
                />
              ))}
            </TabsContent>

            <TabsContent value="family" className="space-y-4 mt-4">
              {familyActivity.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onLike={() => {}}
                />
              ))}
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4 mt-4">
              {activities
                .filter(a => ['achievement', 'level', 'streak'].includes(a.type))
                .map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onLike={() => handleLike(activity.id)}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-purple-500" />
                Active Challenges
              </CardTitle>
              <CardDescription>Team up and earn rewards!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                >
                  <h4 className="font-semibold text-sm">{challenge.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {challenge.description}
                  </p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{challenge.progress}/{challenge.total} completed</span>
                      <span className="text-orange-500">{challenge.daysLeft} days left</span>
                    </div>
                    <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                        style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {challenge.participants.slice(0, 3).map((p, i) => (
                        <Avatar key={i} className="h-6 w-6 border-2 border-white">
                          <AvatarFallback className="text-xs bg-indigo-100">
                            {p[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {challenge.participants.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted border-2 border-white flex items-center justify-center text-xs">
                          +{challenge.participants.length - 3}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {challenge.reward}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Achievers This Week */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Achievers
              </CardTitle>
              <CardDescription>This week&apos;s stars</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Alex Chen', xp: 2450, rank: 1 },
                  { name: 'Jordan Smith', xp: 2280, rank: 2 },
                  { name: 'Taylor Kim', xp: 2150, rank: 3 },
                ].map((user, index) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {user.rank}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-indigo-600">
                      {user.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-3" size="sm">
                View Full Leaderboard
              </Button>
            </CardContent>
          </Card>

          {/* Suggested Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-blue-500" />
                Study Buddies
              </CardTitle>
              <CardDescription>Connect with peers your age</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Jamie Brown', mutual: 3, level: 5 },
                  { name: 'Drew Martinez', mutual: 2, level: 4 },
                ].map((user) => (
                  <div
                    key={user.name}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.mutual} mutual connections
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface ActivityCardProps {
  activity: {
    id: string;
    type: string;
    user: { name: string; avatar: string | null; initials: string };
    action: string;
    target: string;
    timestamp: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    likes: number;
    comments: number;
    liked: boolean;
  };
  onLike: () => void;
}

function ActivityCard({ activity, onLike }: ActivityCardProps) {
  const Icon = activity.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={activity.user.avatar || undefined} />
            <AvatarFallback>{activity.user.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm">
                  <span className="font-semibold">{activity.user.name}</span>{' '}
                  {activity.action}{' '}
                  <span className="font-semibold">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.timestamp}
                </p>
              </div>
              <div className={`p-2 rounded-full ${activity.bgColor}`}>
                <Icon className={`h-4 w-4 ${activity.color}`} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className={activity.liked ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-1 ${activity.liked ? 'fill-current' : ''}`} />
                {activity.likes}
              </Button>
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-1" />
                {activity.comments}
              </Button>
              <Button variant="ghost" size="sm">
                <ThumbsUp className="h-4 w-4 mr-1" />
                Cheer
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
