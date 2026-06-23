'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Users, Search, UserPlus, Star, MessageCircle, Calendar,
  Award, TrendingUp, CheckCircle, Clock, Edit, Eye
} from 'lucide-react';

const mentors = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@example.com',
    avatar: null,
    specialty: ['Budgeting', 'Saving'],
    status: 'active',
    menteesCount: 5,
    maxMentees: 8,
    sessionsCompleted: 42,
    rating: 4.9,
    reviewsCount: 38,
    joinedAt: '2023-06-15',
    lastActive: '2024-02-10',
    xpAwarded: 4200,
  },
  {
    id: '2',
    firstName: 'Marcus',
    lastName: 'Williams',
    email: 'marcus.williams@example.com',
    avatar: null,
    specialty: ['Investing', 'Portfolio Management'],
    status: 'active',
    menteesCount: 8,
    maxMentees: 8,
    sessionsCompleted: 68,
    rating: 4.8,
    reviewsCount: 52,
    joinedAt: '2023-04-20',
    lastActive: '2024-02-10',
    xpAwarded: 6800,
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@example.com',
    avatar: null,
    specialty: ['Tax Planning', 'Career Growth'],
    status: 'active',
    menteesCount: 3,
    maxMentees: 6,
    sessionsCompleted: 28,
    rating: 5.0,
    reviewsCount: 24,
    joinedAt: '2023-09-10',
    lastActive: '2024-02-09',
    xpAwarded: 2800,
  },
  {
    id: '4',
    firstName: 'James',
    lastName: 'Park',
    email: 'james.park@example.com',
    avatar: null,
    specialty: ['Investing', 'Financial Planning'],
    status: 'on_leave',
    menteesCount: 0,
    maxMentees: 5,
    sessionsCompleted: 85,
    rating: 4.7,
    reviewsCount: 72,
    joinedAt: '2022-11-05',
    lastActive: '2024-01-15',
    xpAwarded: 8500,
  },
  {
    id: '5',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.thompson@example.com',
    avatar: null,
    specialty: ['Budgeting', 'Debt Management'],
    status: 'pending',
    menteesCount: 0,
    maxMentees: 5,
    sessionsCompleted: 0,
    rating: 0,
    reviewsCount: 0,
    joinedAt: '2024-02-01',
    lastActive: null,
    xpAwarded: 0,
  },
];

const specialties = ['All', 'Budgeting', 'Saving', 'Investing', 'Portfolio Management', 'Tax Planning', 'Career Growth'];
const statuses = ['All', 'active', 'on_leave', 'pending', 'inactive'];

export default function AdminMentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All' || mentor.specialty.includes(selectedSpecialty);
    const matchesStatus = selectedStatus === 'All' || mentor.status === selectedStatus;

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      active: { color: 'bg-green-100 text-green-700', label: 'Active' },
      on_leave: { color: 'bg-yellow-100 text-yellow-700', label: 'On Leave' },
      pending: { color: 'bg-blue-100 text-blue-700', label: 'Pending Approval' },
      inactive: { color: 'bg-gray-100 text-gray-700', label: 'Inactive' },
    };
    const variant = variants[status] || variants.inactive;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const totalMentees = mentors.reduce((sum, m) => sum + m.menteesCount, 0);
  const totalSessions = mentors.reduce((sum, m) => sum + m.sessionsCompleted, 0);
  const avgRating = mentors.filter(m => m.rating > 0).reduce((sum, m) => sum + m.rating, 0) /
    mentors.filter(m => m.rating > 0).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mentor Management</h1>
          <p className="text-muted-foreground">Manage mentors and mentorship assignments</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Mentor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mentors.length}</p>
              <p className="text-sm text-muted-foreground">Total Mentors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMentees}</p>
              <p className="text-sm text-muted-foreground">Active Mentorships</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSessions}</p>
              <p className="text-sm text-muted-foreground">Sessions Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
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
                placeholder="Search mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>{spec === 'All' ? 'All Specialties' : spec}</option>
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

      {/* Mentors Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {mentor.firstName[0]}{mentor.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{mentor.firstName} {mentor.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{mentor.email}</p>
                  </div>
                </div>
                {getStatusBadge(mentor.status)}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {mentor.specialty.map((spec) => (
                  <Badge key={spec} variant="outline">{spec}</Badge>
                ))}
              </div>

              {/* Capacity */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Mentee Capacity</span>
                  <span className="font-medium">{mentor.menteesCount}/{mentor.maxMentees}</span>
                </div>
                <Progress value={(mentor.menteesCount / mentor.maxMentees) * 100} className="h-2" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{mentor.sessionsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold">{mentor.rating > 0 ? mentor.rating.toFixed(1) : '-'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{mentor.reviewsCount} reviews</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{(mentor.xpAwarded / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground">XP Awarded</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {mentor.status === 'pending' && (
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMentors.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No mentors found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Mentor
          </Button>
        </Card>
      )}
    </div>
  );
}
