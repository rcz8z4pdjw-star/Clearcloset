'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, Plus, Search, Edit, Trash2, Eye, GripVertical,
  CheckCircle, Clock, Users, Star, TrendingUp, Layers, ArrowRight
} from 'lucide-react';

const tracks = [
  {
    id: '1',
    title: 'Financial Fundamentals',
    description: 'Master the basics of personal finance, budgeting, and saving.',
    status: 'published',
    modulesCount: 6,
    lessonsCount: 24,
    ageBands: ['TEEN_SKILLS', 'LAUNCH'],
    enrolledCount: 1240,
    completionRate: 72,
    avgRating: 4.8,
    thumbnail: null,
    order: 1,
  },
  {
    id: '2',
    title: 'Investing 101',
    description: 'Learn the fundamentals of investing and building wealth.',
    status: 'published',
    modulesCount: 8,
    lessonsCount: 32,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM'],
    enrolledCount: 890,
    completionRate: 58,
    avgRating: 4.9,
    thumbnail: null,
    order: 2,
  },
  {
    id: '3',
    title: 'Career Growth & Income',
    description: 'Strategies for career advancement and increasing your earning potential.',
    status: 'published',
    modulesCount: 5,
    lessonsCount: 20,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    enrolledCount: 650,
    completionRate: 64,
    avgRating: 4.7,
    thumbnail: null,
    order: 3,
  },
  {
    id: '4',
    title: 'Tax Essentials',
    description: 'Understanding taxes and tax-advantaged accounts.',
    status: 'draft',
    modulesCount: 4,
    lessonsCount: 16,
    ageBands: ['STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    enrolledCount: 0,
    completionRate: 0,
    avgRating: 0,
    thumbnail: null,
    order: 4,
  },
  {
    id: '5',
    title: 'Junior Money Skills',
    description: 'Age-appropriate financial education for younger learners.',
    status: 'published',
    modulesCount: 4,
    lessonsCount: 16,
    ageBands: ['JUNIOR_FOUNDATIONS'],
    enrolledCount: 420,
    completionRate: 85,
    avgRating: 4.9,
    thumbnail: null,
    order: 5,
  },
];

const statuses = ['All', 'published', 'draft', 'archived'];

export default function AdminTracksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || track.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      published: { color: 'bg-green-100 text-green-700', label: 'Published' },
      draft: { color: 'bg-yellow-100 text-yellow-700', label: 'Draft' },
      archived: { color: 'bg-gray-100 text-gray-700', label: 'Archived' },
    };
    const variant = variants[status] || variants.draft;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const formatAgeBand = (band: string) => {
    return band.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const totalLessons = tracks.reduce((sum, t) => sum + t.lessonsCount, 0);
  const totalEnrolled = tracks.reduce((sum, t) => sum + t.enrolledCount, 0);
  const avgCompletion = tracks.filter(t => t.completionRate > 0).reduce((sum, t) => sum + t.completionRate, 0) /
    tracks.filter(t => t.completionRate > 0).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Tracks</h1>
          <p className="text-muted-foreground">Manage learning tracks and curriculum</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
          <Plus className="h-4 w-4 mr-2" />
          Create Track
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tracks.length}</p>
              <p className="text-sm text-muted-foreground">Total Tracks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLessons}</p>
              <p className="text-sm text-muted-foreground">Total Lessons</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEnrolled.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgCompletion.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Avg Completion</p>
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
                placeholder="Search tracks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
        </CardContent>
      </Card>

      {/* Tracks List */}
      <div className="space-y-4">
        {filteredTracks.map((track, index) => (
          <Card key={track.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GripVertical className="h-5 w-5 cursor-grab" />
                  <span className="text-lg font-bold">#{track.order}</span>
                </div>

                <div className="w-24 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <BookOpen className="h-8 w-8 text-white/70" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{track.title}</h3>
                    {getStatusBadge(track.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{track.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Layers className="h-4 w-4" />
                      {track.modulesCount} modules
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      {track.lessonsCount} lessons
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {track.enrolledCount.toLocaleString()} enrolled
                    </span>
                    {track.avgRating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {track.avgRating}
                      </span>
                    )}
                  </div>

                  {track.status === 'published' && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Avg Completion Rate</span>
                        <span className="font-medium">{track.completionRate}%</span>
                      </div>
                      <Progress value={track.completionRate} className="h-2" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {track.ageBands.map((band) => (
                      <Badge key={band} variant="outline" className="text-xs">
                        {formatAgeBand(band)}
                      </Badge>
                    ))}
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
                  <Button variant="outline" size="sm">
                    <Layers className="h-4 w-4 mr-1" />
                    Modules
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTracks.length === 0 && (
        <Card className="p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tracks found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Track
          </Button>
        </Card>
      )}
    </div>
  );
}
