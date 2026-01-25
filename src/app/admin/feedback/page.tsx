'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare, Search, Star, ThumbsUp, ThumbsDown, CheckCircle,
  Clock, AlertCircle, Filter, Reply, Trash2, Tag, Calendar,
  TrendingUp, Users, Heart
} from 'lucide-react';

const feedbackItems = [
  {
    id: '1',
    type: 'feature_request',
    title: 'Add dark mode support',
    description: 'It would be great to have a dark mode option for the platform. Easier on the eyes during evening study sessions.',
    user: { name: 'Emma J.', avatar: null },
    status: 'planned',
    priority: 'medium',
    votes: 45,
    comments: 12,
    createdAt: '2024-02-10',
    tags: ['ui', 'accessibility'],
  },
  {
    id: '2',
    type: 'bug_report',
    title: 'Quiz progress not saving',
    description: 'When I close the quiz and come back, my progress is lost. This happened twice this week.',
    user: { name: 'Marcus W.', avatar: null },
    status: 'in_progress',
    priority: 'high',
    votes: 28,
    comments: 8,
    createdAt: '2024-02-12',
    tags: ['bug', 'quiz'],
  },
  {
    id: '3',
    type: 'suggestion',
    title: 'More interactive simulations',
    description: 'The simulations are great but would love to see more scenarios, especially for retirement planning.',
    user: { name: 'Sarah C.', avatar: null },
    status: 'under_review',
    priority: 'medium',
    votes: 67,
    comments: 15,
    createdAt: '2024-02-08',
    tags: ['content', 'simulations'],
  },
  {
    id: '4',
    type: 'praise',
    title: 'Amazing learning experience!',
    description: 'Just wanted to say thank you for creating such an engaging platform. My kids love the gamification!',
    user: { name: 'David G.', avatar: null },
    status: 'acknowledged',
    priority: 'low',
    votes: 15,
    comments: 3,
    createdAt: '2024-02-14',
    tags: ['praise', 'gamification'],
  },
  {
    id: '5',
    type: 'bug_report',
    title: 'Mobile navigation issue',
    description: 'The side menu overlaps with content on smaller screens. Using iPhone 12.',
    user: { name: 'Olivia B.', avatar: null },
    status: 'resolved',
    priority: 'high',
    votes: 32,
    comments: 6,
    createdAt: '2024-02-05',
    resolvedAt: '2024-02-11',
    tags: ['bug', 'mobile'],
  },
  {
    id: '6',
    type: 'feature_request',
    title: 'Export progress reports as PDF',
    description: 'Would be helpful to export my progress reports as PDF to share with my parents.',
    user: { name: 'James M.', avatar: null },
    status: 'planned',
    priority: 'medium',
    votes: 38,
    comments: 7,
    createdAt: '2024-02-01',
    tags: ['feature', 'reports'],
  },
];

const types = ['All', 'feature_request', 'bug_report', 'suggestion', 'praise'];
const statuses = ['All', 'new', 'under_review', 'planned', 'in_progress', 'resolved', 'acknowledged'];
const priorities = ['All', 'high', 'medium', 'low'];

export default function AdminFeedbackPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [activeTab, setActiveTab] = useState('all');

  const filteredFeedback = feedbackItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesPriority = selectedPriority === 'All' || item.priority === selectedPriority;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'bugs' && item.type === 'bug_report') ||
      (activeTab === 'features' && item.type === 'feature_request') ||
      (activeTab === 'resolved' && item.status === 'resolved');

    return matchesSearch && matchesType && matchesStatus && matchesPriority && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      feature_request: <Star className="h-4 w-4" />,
      bug_report: <AlertCircle className="h-4 w-4" />,
      suggestion: <ThumbsUp className="h-4 w-4" />,
      praise: <Heart className="h-4 w-4" />,
    };
    return icons[type] || <MessageSquare className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feature_request: 'bg-purple-100 text-purple-700',
      bug_report: 'bg-red-100 text-red-700',
      suggestion: 'bg-blue-100 text-blue-700',
      praise: 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: 'bg-yellow-100 text-yellow-700',
      under_review: 'bg-blue-100 text-blue-700',
      planned: 'bg-purple-100 text-purple-700',
      in_progress: 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      acknowledged: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={variants[status] || variants.new}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const getPriorityIndicator = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return <div className={`w-2 h-2 rounded-full ${colors[priority] || colors.medium}`} />;
  };

  const bugCount = feedbackItems.filter(f => f.type === 'bug_report').length;
  const featureCount = feedbackItems.filter(f => f.type === 'feature_request').length;
  const resolvedCount = feedbackItems.filter(f => f.status === 'resolved').length;
  const totalVotes = feedbackItems.reduce((sum, f) => sum + f.votes, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Feedback</h1>
          <p className="text-muted-foreground">Manage feedback, bug reports, and feature requests</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{feedbackItems.length}</p>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{bugCount}</p>
              <p className="text-sm text-muted-foreground">Bug Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{featureCount}</p>
              <p className="text-sm text-muted-foreground">Feature Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalVotes}</p>
              <p className="text-sm text-muted-foreground">Total Votes</p>
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
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {types.map((type) => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : type.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{status === 'All' ? 'All Statuses' : status.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>{priority === 'All' ? 'All Priorities' : priority}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Feedback</TabsTrigger>
          <TabsTrigger value="bugs">Bugs ({bugCount})</TabsTrigger>
          <TabsTrigger value="features">Features ({featureCount})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIndicator(item.priority)}
                        <h3 className="font-semibold">{item.title}</h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{item.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs">{item.user.name[0]}</AvatarFallback>
                          </Avatar>
                          <span>{item.user.name}</span>
                        </div>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {item.votes} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {item.comments} comments
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        Update Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredFeedback.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No feedback found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
