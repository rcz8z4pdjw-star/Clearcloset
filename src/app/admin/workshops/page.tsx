'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video, Calendar, Clock, Users, Plus, Search, Edit, Trash2,
  Eye, Play, CheckCircle, XCircle, Link, Upload, Download
} from 'lucide-react';

const workshops = [
  {
    id: '1',
    title: 'Introduction to Stock Market Investing',
    instructor: { id: '1', name: 'Marcus Williams, CFA' },
    scheduledAt: '2024-02-15T16:00:00Z',
    duration: 60,
    maxCapacity: 50,
    enrolledCount: 45,
    attendedCount: 0,
    status: 'scheduled',
    category: 'Investing',
    level: 'Beginner',
    xpReward: 100,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM'],
    recordingUrl: null,
  },
  {
    id: '2',
    title: 'Building Your First Budget',
    instructor: { id: '2', name: 'Sarah Chen' },
    scheduledAt: '2024-02-18T15:00:00Z',
    duration: 45,
    maxCapacity: 40,
    enrolledCount: 32,
    attendedCount: 0,
    status: 'scheduled',
    category: 'Budgeting',
    level: 'Beginner',
    xpReward: 75,
    ageBands: ['TEEN_SKILLS', 'LAUNCH'],
    recordingUrl: null,
  },
  {
    id: '3',
    title: 'Understanding Compound Interest',
    instructor: { id: '3', name: 'Dr. James Park' },
    scheduledAt: '2024-02-10T17:00:00Z',
    duration: 30,
    maxCapacity: 50,
    enrolledCount: 50,
    attendedCount: 47,
    status: 'completed',
    category: 'Saving',
    level: 'Beginner',
    xpReward: 50,
    ageBands: ['JUNIOR_FOUNDATIONS', 'TEEN_SKILLS'],
    recordingUrl: 'https://example.com/recording/3',
  },
  {
    id: '4',
    title: 'Portfolio Diversification Strategies',
    instructor: { id: '4', name: 'Emily Rodriguez, CFP' },
    scheduledAt: '2024-02-20T18:00:00Z',
    duration: 90,
    maxCapacity: 35,
    enrolledCount: 28,
    attendedCount: 0,
    status: 'scheduled',
    category: 'Investing',
    level: 'Intermediate',
    xpReward: 150,
    ageBands: ['STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    recordingUrl: null,
  },
  {
    id: '5',
    title: 'Tax Planning for Young Investors',
    instructor: { id: '5', name: 'Robert Kim, CPA' },
    scheduledAt: '2024-02-05T16:30:00Z',
    duration: 60,
    maxCapacity: 40,
    enrolledCount: 40,
    attendedCount: 38,
    status: 'completed',
    category: 'Taxes',
    level: 'Intermediate',
    xpReward: 100,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM'],
    recordingUrl: 'https://example.com/recording/5',
  },
];

const categories = ['All', 'Investing', 'Budgeting', 'Saving', 'Taxes', 'Career'];
const statuses = ['All', 'scheduled', 'live', 'completed', 'cancelled'];

export default function AdminWorkshopsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  const filteredWorkshops = workshops.filter((workshop) => {
    const matchesSearch = workshop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workshop.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || workshop.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || workshop.status === selectedStatus;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'upcoming' && workshop.status === 'scheduled') ||
      (activeTab === 'past' && workshop.status === 'completed');

    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      scheduled: { color: 'bg-blue-100 text-blue-700', label: 'Scheduled' },
      live: { color: 'bg-red-100 text-red-700', label: 'Live Now' },
      completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
      cancelled: { color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
    };
    const variant = variants[status] || variants.scheduled;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Workshop Management</h1>
          <p className="text-muted-foreground">Schedule and manage live workshops</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Workshop
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workshops.filter(w => w.status === 'scheduled').length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workshops.filter(w => w.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workshops.reduce((sum, w) => sum + w.enrolledCount, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Video className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{workshops.filter(w => w.recordingUrl).length}</p>
              <p className="text-sm text-muted-foreground">Recordings</p>
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
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Workshops</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredWorkshops.map((workshop) => (
              <Card key={workshop.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Video className="h-8 w-8 text-white/70" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{workshop.title}</h3>
                          {getStatusBadge(workshop.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Instructor: {workshop.instructor.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(workshop.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {workshop.duration} min
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {workshop.enrolledCount}/{workshop.maxCapacity}
                          </span>
                          {workshop.status === 'completed' && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              {workshop.attendedCount} attended
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">{workshop.category}</Badge>
                          <Badge variant="outline">{workshop.level}</Badge>
                          <Badge variant="secondary">+{workshop.xpReward} XP</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {workshop.status === 'completed' && (
                        <div className="flex gap-1">
                          {workshop.recordingUrl ? (
                            <Button variant="outline" size="sm">
                              <Play className="h-3 w-3 mr-1" />
                              Recording
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                          )}
                        </div>
                      )}
                      {workshop.status === 'scheduled' && (
                        <Button variant="outline" size="sm">
                          <Link className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredWorkshops.length === 0 && (
        <Card className="p-12 text-center">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workshops found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Workshop
          </Button>
        </Card>
      )}
    </div>
  );
}
