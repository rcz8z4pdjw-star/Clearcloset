'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen, Award, Trophy, Target, Users, MessageCircle,
  Calendar, CheckCircle, Star, Flame, Zap, Gift, Heart,
  GraduationCap, TrendingUp, Filter, Clock
} from 'lucide-react';

const timelineEvents = [
  {
    id: '1',
    type: 'achievement',
    title: 'Earned "Quiz Whiz" Badge',
    description: 'Scored 100% on the Budgeting Basics quiz',
    timestamp: '2024-02-15T14:30:00',
    xp: 150,
    icon: 'trophy',
    highlight: true,
  },
  {
    id: '2',
    type: 'lesson',
    title: 'Completed: Introduction to Investing',
    description: 'Finished lesson 3 of 8 in the Investing 101 track',
    timestamp: '2024-02-15T10:15:00',
    xp: 50,
    icon: 'book',
  },
  {
    id: '3',
    type: 'streak',
    title: '14-Day Streak!',
    description: 'You\'ve been learning consistently for 2 weeks',
    timestamp: '2024-02-14T09:00:00',
    xp: 100,
    icon: 'flame',
    highlight: true,
  },
  {
    id: '4',
    type: 'social',
    title: 'Connected with Sarah M.',
    description: 'You and Sarah are now learning buddies',
    timestamp: '2024-02-13T16:45:00',
    icon: 'users',
  },
  {
    id: '5',
    type: 'goal',
    title: 'Goal Progress: Emergency Fund',
    description: 'Reached 60% of your $5,000 savings goal',
    timestamp: '2024-02-12T11:30:00',
    icon: 'target',
  },
  {
    id: '6',
    type: 'quiz',
    title: 'Quiz Completed: Tax Basics',
    description: 'Scored 85% on the tax fundamentals quiz',
    timestamp: '2024-02-11T15:20:00',
    xp: 75,
    icon: 'check',
  },
  {
    id: '7',
    type: 'level',
    title: 'Level Up! Now Level 8',
    description: 'You earned 500 XP and advanced to the next level',
    timestamp: '2024-02-10T17:00:00',
    xp: 0,
    icon: 'star',
    highlight: true,
  },
  {
    id: '8',
    type: 'workshop',
    title: 'Attended: Building Your First Budget',
    description: 'Live workshop with 45 other learners',
    timestamp: '2024-02-09T19:00:00',
    xp: 100,
    icon: 'calendar',
  },
  {
    id: '9',
    type: 'comment',
    title: 'Your comment was liked',
    description: 'Marcus liked your insight on compound interest',
    timestamp: '2024-02-08T14:10:00',
    icon: 'heart',
  },
  {
    id: '10',
    type: 'certificate',
    title: 'Certificate Earned',
    description: 'Completed the Financial Fundamentals track',
    timestamp: '2024-02-05T12:00:00',
    xp: 500,
    icon: 'graduation',
    highlight: true,
  },
];

const filters = ['All', 'achievements', 'lessons', 'social', 'goals'];

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
  flame: <Flame className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
  check: <CheckCircle className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  heart: <Heart className="h-4 w-4" />,
  graduation: <GraduationCap className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  achievement: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  lesson: 'bg-blue-100 text-blue-700 border-blue-200',
  streak: 'bg-orange-100 text-orange-700 border-orange-200',
  social: 'bg-purple-100 text-purple-700 border-purple-200',
  goal: 'bg-green-100 text-green-700 border-green-200',
  quiz: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  level: 'bg-pink-100 text-pink-700 border-pink-200',
  workshop: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  comment: 'bg-rose-100 text-rose-700 border-rose-200',
  certificate: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function TimelinePage() {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filteredEvents = timelineEvents.filter((event) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'achievements') return ['achievement', 'level', 'certificate'].includes(event.type);
    if (selectedFilter === 'lessons') return ['lesson', 'quiz', 'workshop'].includes(event.type);
    if (selectedFilter === 'social') return ['social', 'comment'].includes(event.type);
    if (selectedFilter === 'goals') return ['goal', 'streak'].includes(event.type);
    return true;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const totalXP = timelineEvents.reduce((sum, e) => sum + (e.xp || 0), 0);

  // Group events by date
  const groupedEvents: Record<string, typeof timelineEvents> = {};
  filteredEvents.forEach((event) => {
    const dateKey = new Date(event.timestamp).toDateString();
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Timeline</h1>
          <p className="text-muted-foreground">Track your learning journey and achievements</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-lg">
            <Zap className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-indigo-700">{totalXP.toLocaleString()} XP earned</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{timelineEvents.filter(e => e.type === 'lesson').length}</p>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{timelineEvents.filter(e => e.type === 'achievement').length}</p>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">14</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">Level 8</p>
              <p className="text-sm text-muted-foreground">Current Level</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium mr-2">Filter:</span>
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([dateKey, events]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center z-10">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-semibold">
                  {new Date(dateKey).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
              </div>

              {/* Events for this date */}
              <div className="space-y-4 ml-8 pl-8 border-l-2 border-gray-100">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className={`overflow-hidden transition-all hover:shadow-md ${event.highlight ? 'ring-2 ring-indigo-200' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${typeColors[event.type] || 'bg-gray-100'}`}>
                          {iconMap[event.icon] || <Star className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                            {event.xp && event.xp > 0 && (
                              <Badge className="bg-indigo-100 text-indigo-700">
                                <Zap className="h-3 w-3 mr-1" />
                                +{event.xp} XP
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</span>
                            <Badge variant="outline" className="text-xs capitalize">{event.type}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or complete more activities</p>
        </Card>
      )}
    </div>
  );
}
