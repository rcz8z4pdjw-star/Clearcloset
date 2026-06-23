'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Video, Play, Clock, Users, Star, BookOpen, Filter,
  Search, Calendar, Award, TrendingUp, CheckCircle, Lock
} from 'lucide-react';

const workshops = [
  {
    id: '1',
    title: 'Introduction to Stock Market Investing',
    instructor: 'Marcus Williams, CFA',
    date: '2024-02-15',
    time: '4:00 PM EST',
    duration: '60 min',
    enrolled: 45,
    maxCapacity: 50,
    status: 'upcoming',
    category: 'Investing',
    level: 'Beginner',
    xpReward: 100,
    thumbnail: null,
    description: 'Learn the fundamentals of stock market investing.',
  },
  {
    id: '2',
    title: 'Building Your First Budget',
    instructor: 'Sarah Chen',
    date: '2024-02-18',
    time: '3:00 PM EST',
    duration: '45 min',
    enrolled: 32,
    maxCapacity: 40,
    status: 'upcoming',
    category: 'Budgeting',
    level: 'Beginner',
    xpReward: 75,
    thumbnail: null,
    description: 'Create a personal budget that works for you.',
  },
  {
    id: '3',
    title: 'Understanding Compound Interest',
    instructor: 'Dr. James Park',
    date: '2024-02-10',
    time: '5:00 PM EST',
    duration: '30 min',
    enrolled: 50,
    maxCapacity: 50,
    status: 'completed',
    category: 'Saving',
    level: 'Beginner',
    xpReward: 50,
    thumbnail: null,
    description: 'Discover the power of compound interest.',
    recording: true,
  },
  {
    id: '4',
    title: 'Portfolio Diversification Strategies',
    instructor: 'Emily Rodriguez, CFP',
    date: '2024-02-20',
    time: '6:00 PM EST',
    duration: '90 min',
    enrolled: 28,
    maxCapacity: 35,
    status: 'upcoming',
    category: 'Investing',
    level: 'Intermediate',
    xpReward: 150,
    thumbnail: null,
    description: 'Advanced strategies for portfolio management.',
  },
  {
    id: '5',
    title: 'Tax Planning for Young Investors',
    instructor: 'Robert Kim, CPA',
    date: '2024-02-05',
    time: '4:30 PM EST',
    duration: '60 min',
    enrolled: 40,
    maxCapacity: 40,
    status: 'completed',
    category: 'Taxes',
    level: 'Intermediate',
    xpReward: 100,
    thumbnail: null,
    description: 'Understand tax implications of investing.',
    recording: true,
  },
];

const categories = ['All', 'Investing', 'Budgeting', 'Saving', 'Taxes', 'Career'];
const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function WorkshopsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [activeTab, setActiveTab] = useState('upcoming');

  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch = workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || workshop.category === selectedCategory;
    const matchesLevel = selectedLevel === 'All' || workshop.level === selectedLevel;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'upcoming' && workshop.status === 'upcoming') ||
      (activeTab === 'completed' && workshop.status === 'completed');

    return matchesSearch && matchesCategory && matchesLevel && matchesTab;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live Workshops</h1>
          <p className="text-muted-foreground">Join interactive sessions with industry experts</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
          <Calendar className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Total Workshops</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Attended</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">450</p>
              <p className="text-sm text-muted-foreground">XP Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workshops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {levels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredWorkshops.map((workshop) => (
              <Card key={workshop.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-indigo-500 to-purple-600">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-12 w-12 text-white/50" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge className={workshop.status === 'upcoming' ? 'bg-green-500' : 'bg-gray-500'}>
                      {workshop.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90">
                      +{workshop.xpReward} XP
                    </Badge>
                  </div>
                  {workshop.recording && (
                    <div className="absolute bottom-3 right-3">
                      <Badge className="bg-red-500">
                        <Play className="h-3 w-3 mr-1" />
                        Recording Available
                      </Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{workshop.category}</Badge>
                    <Badge variant="outline">{workshop.level}</Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{workshop.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{workshop.description}</p>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <BookOpen className="h-4 w-4" />
                    <span>{workshop.instructor}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(workshop.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{workshop.duration}</span>
                    </div>
                  </div>

                  {workshop.status === 'upcoming' && (
                    <>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Enrollment</span>
                        <span className="font-medium">{workshop.enrolled}/{workshop.maxCapacity}</span>
                      </div>
                      <Progress value={(workshop.enrolled / workshop.maxCapacity) * 100} className="h-2 mb-4" />
                    </>
                  )}

                  <Button className="w-full" variant={workshop.status === 'completed' ? 'secondary' : 'default'}>
                    {workshop.status === 'upcoming' ? (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Register Now
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Watch Recording
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
