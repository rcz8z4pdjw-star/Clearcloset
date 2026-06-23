'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Search,
  MessageCircle,
  Calendar,
  BookOpen,
  Trophy,
  Flame,
  Star,
  Clock,
  Crown,
  UserPlus,
  Settings,
  Bell,
  ChevronRight,
  Target,
  Sparkles,
  Video,
  FileText,
} from 'lucide-react';

// Mock study groups data
const myGroups = [
  {
    id: 'g1',
    name: 'Teen Investing Club',
    description: 'Learn about investing together with fellow teens',
    memberCount: 24,
    maxMembers: 30,
    category: 'investing',
    ageBand: 'TEEN_SKILLS',
    isOwner: false,
    isModerator: true,
    lastActivity: '2h ago',
    nextEvent: '2024-02-22T16:00:00',
    weeklyGoal: { target: 5, current: 3 },
    members: [
      { id: 'm1', name: 'Alex J.', avatar: null, level: 8 },
      { id: 'm2', name: 'Jamie S.', avatar: null, level: 6 },
      { id: 'm3', name: 'Morgan L.', avatar: null, level: 10 },
    ],
    recentMessages: 12,
  },
  {
    id: 'g2',
    name: 'Budget Beginners',
    description: 'Master budgeting basics with peers your age',
    memberCount: 18,
    maxMembers: 25,
    category: 'budgeting',
    ageBand: 'TEEN_SKILLS',
    isOwner: true,
    isModerator: true,
    lastActivity: '30m ago',
    nextEvent: null,
    weeklyGoal: { target: 3, current: 3 },
    members: [
      { id: 'm4', name: 'Taylor C.', avatar: null, level: 5 },
      { id: 'm5', name: 'Riley A.', avatar: null, level: 7 },
    ],
    recentMessages: 5,
  },
];

const discoverGroups = [
  {
    id: 'dg1',
    name: 'Saving Superstars',
    description: 'A group focused on developing saving habits',
    memberCount: 32,
    maxMembers: 40,
    category: 'saving',
    ageBand: 'TEEN_SKILLS',
    topics: ['emergency-fund', 'savings-goals', 'compound-interest'],
  },
  {
    id: 'dg2',
    name: 'Future Entrepreneurs',
    description: 'Learn entrepreneurship and business basics',
    memberCount: 15,
    maxMembers: 20,
    category: 'entrepreneurship',
    ageBand: 'TEEN_SKILLS',
    topics: ['business-planning', 'marketing', 'side-hustles'],
  },
  {
    id: 'dg3',
    name: 'Credit & Debt 101',
    description: 'Understanding credit scores and managing debt',
    memberCount: 28,
    maxMembers: 35,
    category: 'credit',
    ageBand: 'LAUNCH',
    topics: ['credit-score', 'debt-management', 'loans'],
  },
];

const categoryIcons: Record<string, typeof BookOpen> = {
  investing: Trophy,
  budgeting: Target,
  saving: Sparkles,
  entrepreneurship: Star,
  credit: FileText,
};

const categoryColors: Record<string, string> = {
  investing: 'bg-blue-100 text-blue-700',
  budgeting: 'bg-green-100 text-green-700',
  saving: 'bg-yellow-100 text-yellow-700',
  entrepreneurship: 'bg-purple-100 text-purple-700',
  credit: 'bg-red-100 text-red-700',
};

export default function GroupsPage() {
  const [activeTab, setActiveTab] = useState('my-groups');
  const [selectedGroup, setSelectedGroup] = useState<typeof myGroups[0] | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-500" />
            Study Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Learn together with peers on your financial journey
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a Study Group</DialogTitle>
              <DialogDescription>
                Start a new study group and invite friends to learn together
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input id="name" placeholder="e.g., Teen Money Masters" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What will your group focus on?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investing">Investing</SelectItem>
                    <SelectItem value="budgeting">Budgeting</SelectItem>
                    <SelectItem value="saving">Saving</SelectItem>
                    <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                    <SelectItem value="credit">Credit & Debt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Members</Label>
                <Select defaultValue="25">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 members</SelectItem>
                    <SelectItem value="15">15 members</SelectItem>
                    <SelectItem value="25">25 members</SelectItem>
                    <SelectItem value="50">50 members</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-700">{myGroups.length}</p>
            <p className="text-xs text-blue-600">My Groups</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">
              {myGroups.filter(g => g.weeklyGoal.current >= g.weeklyGoal.target).length}/{myGroups.length}
            </p>
            <p className="text-xs text-green-600">Goals Met</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <MessageCircle className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">
              {myGroups.reduce((sum, g) => sum + g.recentMessages, 0)}
            </p>
            <p className="text-xs text-yellow-600">New Messages</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">
              {myGroups.filter(g => g.nextEvent).length}
            </p>
            <p className="text-xs text-purple-600">Upcoming Events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="mt-6 space-y-4">
          {myGroups.map((group) => {
            const CategoryIcon = categoryIcons[group.category] || BookOpen;
            return (
              <Card
                key={group.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${categoryColors[group.category] || 'bg-gray-100'}`}>
                      <CategoryIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{group.name}</h3>
                            {group.isOwner && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                            {group.isModerator && !group.isOwner && (
                              <Badge variant="outline">Moderator</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                        </div>
                        {group.recentMessages > 0 && (
                          <Badge className="bg-indigo-500">
                            {group.recentMessages} new
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {group.memberCount}/{group.maxMembers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Active {group.lastActivity}
                        </span>
                        {group.nextEvent && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <Calendar className="h-4 w-4" />
                            Event {new Date(group.nextEvent).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Weekly Goal Progress */}
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Weekly Group Goal</span>
                          <span className="text-sm text-muted-foreground">
                            {group.weeklyGoal.current}/{group.weeklyGoal.target} lessons
                          </span>
                        </div>
                        <div className="h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              group.weeklyGoal.current >= group.weeklyGoal.target
                                ? 'bg-green-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.min((group.weeklyGoal.current / group.weeklyGoal.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Member Avatars */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex -space-x-2">
                          {group.members.slice(0, 5).map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {group.memberCount > 5 && (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                              +{group.memberCount - 5}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          Open Group
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="discover" className="mt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search study groups..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoverGroups.map((group) => {
              const CategoryIcon = categoryIcons[group.category] || BookOpen;
              return (
                <Card key={group.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl ${categoryColors[group.category] || 'bg-gray-100'} mb-4`}>
                      <CategoryIcon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">{group.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {group.memberCount}/{group.maxMembers} members
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {group.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>

                    <Button className="w-full">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Join Group
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Group Detail Dialog */}
      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedGroup && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${categoryColors[selectedGroup.category] || 'bg-gray-100'}`}>
                    {(() => {
                      const CategoryIcon = categoryIcons[selectedGroup.category] || BookOpen;
                      return <CategoryIcon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedGroup.name}</DialogTitle>
                    <DialogDescription>{selectedGroup.description}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Quick Actions */}
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" className="flex flex-col h-auto py-4">
                    <MessageCircle className="h-5 w-5 mb-1" />
                    <span className="text-xs">Chat</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-auto py-4">
                    <Video className="h-5 w-5 mb-1" />
                    <span className="text-xs">Meet</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-auto py-4">
                    <Calendar className="h-5 w-5 mb-1" />
                    <span className="text-xs">Events</span>
                  </Button>
                  <Button variant="outline" className="flex flex-col h-auto py-4">
                    <Settings className="h-5 w-5 mb-1" />
                    <span className="text-xs">Settings</span>
                  </Button>
                </div>

                {/* Members */}
                <div>
                  <h3 className="font-semibold mb-3">Members ({selectedGroup.memberCount})</h3>
                  <div className="space-y-2">
                    {selectedGroup.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">Level {member.level}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      View All Members
                    </Button>
                  </div>
                </div>

                {/* Upcoming Event */}
                {selectedGroup.nextEvent && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Next Group Meeting</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedGroup.nextEvent).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
