'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, MessageCircle, Calendar, Clock, Star, TrendingUp,
  BookOpen, Target, Award, ChevronRight, Video, FileText
} from 'lucide-react';

const mentees = [
  {
    id: '1',
    name: 'Alex Johnson',
    ageBand: 'TEEN_SKILLS',
    age: 14,
    avatar: null,
    level: 4,
    xp: 1250,
    streak: 12,
    lessonsCompleted: 28,
    currentTrack: 'Investment Basics',
    trackProgress: 65,
    lastActive: '2 hours ago',
    status: 'online',
    upcomingSession: '2024-02-15 4:00 PM',
    notes: 'Great progress on budgeting module. Focus on quiz practice.',
  },
  {
    id: '2',
    name: 'Jamie Smith',
    ageBand: 'JUNIOR_FOUNDATIONS',
    age: 11,
    avatar: null,
    level: 3,
    xp: 850,
    streak: 7,
    lessonsCompleted: 18,
    currentTrack: 'Money Basics',
    trackProgress: 45,
    lastActive: '1 day ago',
    status: 'offline',
    upcomingSession: '2024-02-16 3:00 PM',
    notes: 'Needs more help with compound interest concepts.',
  },
  {
    id: '3',
    name: 'Morgan Lee',
    ageBand: 'LAUNCH',
    age: 18,
    avatar: null,
    level: 6,
    xp: 2100,
    streak: 21,
    lessonsCompleted: 52,
    currentTrack: 'Portfolio Management',
    trackProgress: 78,
    lastActive: '30 minutes ago',
    status: 'learning',
    upcomingSession: '2024-02-14 5:00 PM',
    notes: 'Advanced learner, ready for real portfolio simulation.',
  },
];

const upcomingSessions = [
  { id: '1', mentee: 'Morgan Lee', topic: 'Portfolio Review', date: '2024-02-14', time: '5:00 PM', duration: '45 min' },
  { id: '2', mentee: 'Alex Johnson', topic: 'Quiz Preparation', date: '2024-02-15', time: '4:00 PM', duration: '30 min' },
  { id: '3', mentee: 'Jamie Smith', topic: 'Compound Interest', date: '2024-02-16', time: '3:00 PM', duration: '30 min' },
];

const recentActivity = [
  { mentee: 'Alex', action: 'Completed lesson', item: 'Understanding Stocks', time: '2 hours ago' },
  { mentee: 'Morgan', action: 'Passed quiz', item: 'Portfolio Diversification (95%)', time: '30 min ago' },
  { mentee: 'Jamie', action: 'Started track', item: 'Saving Fundamentals', time: '1 day ago' },
  { mentee: 'Morgan', action: 'Earned badge', item: 'Quiz Master', time: '2 days ago' },
];

export default function MenteePage() {
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);

  const totalMentees = mentees.length;
  const activeMentees = mentees.filter(m => m.status !== 'offline').length;
  const totalSessions = 24; // This month
  const avgProgress = Math.round(mentees.reduce((sum, m) => sum + m.trackProgress, 0) / mentees.length);

  const selectedMenteeData = mentees.find(m => m.id === selectedMentee);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Mentees</h1>
          <p className="text-muted-foreground">Track and support your mentees' progress</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Mentees</p>
                <p className="text-3xl font-bold">{totalMentees}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold">{activeMentees}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions This Month</p>
                <p className="text-2xl font-bold">{totalSessions}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Progress</p>
                <p className="text-2xl font-bold">{avgProgress}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mentees List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Your Mentees</h2>
          {mentees.map((mentee) => (
            <Card
              key={mentee.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMentee === mentee.id ? 'ring-2 ring-indigo-500' : ''
              }`}
              onClick={() => setSelectedMentee(mentee.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={mentee.avatar || undefined} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
                        {mentee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      mentee.status === 'online' ? 'bg-green-500' :
                      mentee.status === 'learning' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{mentee.name}</h3>
                      <Badge variant="outline">Age {mentee.age}</Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Level {mentee.level}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        {mentee.lessonsCompleted} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-orange-500" />
                        {mentee.streak} day streak
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{mentee.currentTrack}</span>
                        <span className="font-medium">{mentee.trackProgress}%</span>
                      </div>
                      <Progress value={mentee.trackProgress} className="h-2" />
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Last active: {mentee.lastActive}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mentee Details */}
          {selectedMenteeData && (
            <Card>
              <CardHeader>
                <CardTitle>Mentee Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedMenteeData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedMenteeData.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMenteeData.ageBand.replace(/_/g, ' ')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Notes:</p>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {selectedMenteeData.notes}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Next Session:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedMenteeData.upcomingSession}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button className="flex-1" size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{session.mentee}</p>
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{session.date}</span>
                        <span>•</span>
                        <span>{session.time}</span>
                        <span>•</span>
                        <span>{session.duration}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Video className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2" />
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.mentee}</span>{' '}
                        <span className="text-muted-foreground">{activity.action}</span>{' '}
                        <span className="font-medium">{activity.item}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
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
