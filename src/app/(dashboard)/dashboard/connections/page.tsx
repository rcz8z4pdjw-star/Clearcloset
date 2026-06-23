'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Search,
  MessageCircle,
  Trophy,
  Flame,
  Star,
  Heart,
  UserCheck,
  Clock,
  Send,
  X,
  Check,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mock connections data
const connections = [
  {
    id: 'c1',
    name: 'Alex Johnson',
    avatar: null,
    relationship: 'friend',
    level: 8,
    streak: 15,
    xp: 2450,
    status: 'online',
    lastActive: 'Just now',
    sharedAchievements: 3,
    mutualConnections: 5,
  },
  {
    id: 'c2',
    name: 'Jamie Smith',
    avatar: null,
    relationship: 'sibling',
    level: 6,
    streak: 12,
    xp: 1820,
    status: 'online',
    lastActive: '5m ago',
    sharedAchievements: 7,
    mutualConnections: 8,
  },
  {
    id: 'c3',
    name: 'Morgan Lee',
    avatar: null,
    relationship: 'friend',
    level: 10,
    streak: 30,
    xp: 3200,
    status: 'offline',
    lastActive: '2h ago',
    sharedAchievements: 5,
    mutualConnections: 3,
  },
  {
    id: 'c4',
    name: 'Taylor Chen',
    avatar: null,
    relationship: 'cousin',
    level: 5,
    streak: 7,
    xp: 1200,
    status: 'offline',
    lastActive: 'Yesterday',
    sharedAchievements: 2,
    mutualConnections: 6,
  },
];

const pendingRequests = [
  {
    id: 'p1',
    name: 'Riley Anderson',
    avatar: null,
    level: 7,
    mutualConnections: 4,
    requestedAt: '2024-02-19',
    type: 'incoming',
  },
  {
    id: 'p2',
    name: 'Jordan Williams',
    avatar: null,
    level: 9,
    mutualConnections: 2,
    requestedAt: '2024-02-18',
    type: 'incoming',
  },
];

const suggestedConnections = [
  {
    id: 's1',
    name: 'Casey Brown',
    avatar: null,
    level: 8,
    mutualConnections: 6,
    reason: 'Same age band',
  },
  {
    id: 's2',
    name: 'Quinn Davis',
    avatar: null,
    level: 6,
    mutualConnections: 4,
    reason: 'Family member',
  },
  {
    id: 's3',
    name: 'Avery Miller',
    avatar: null,
    level: 11,
    mutualConnections: 3,
    reason: 'Top learner',
  },
];

const relationshipColors: Record<string, string> = {
  friend: 'bg-blue-100 text-blue-700',
  sibling: 'bg-green-100 text-green-700',
  cousin: 'bg-purple-100 text-purple-700',
  parent: 'bg-orange-100 text-orange-700',
  mentor: 'bg-yellow-100 text-yellow-700',
};

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState('connections');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<typeof connections[0] | null>(null);

  const filteredConnections = connections.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-500" />
            Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with family and friends on your learning journey
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Connection</DialogTitle>
              <DialogDescription>
                Search for family members or friends to connect with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or email..." className="pl-9" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested</p>
                {suggestedConnections.slice(0, 3).map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{suggestion.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.mutualConnections} mutual connections
                        </p>
                      </div>
                    </div>
                    <Button size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Request
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-700">{connections.length}</p>
            <p className="text-xs text-blue-600">Connections</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">
              {connections.filter(c => c.status === 'online').length}
            </p>
            <p className="text-xs text-green-600">Online Now</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">{pendingRequests.length}</p>
            <p className="text-xs text-yellow-600">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">
              {connections.reduce((sum, c) => sum + c.sharedAchievements, 0)}
            </p>
            <p className="text-xs text-purple-600">Shared Achievements</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connections">
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="suggested">Suggested</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connections..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConnections.map((connection) => (
              <Card
                key={connection.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedConnection(connection)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={connection.avatar || undefined} />
                        <AvatarFallback className="text-lg">
                          {connection.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        connection.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{connection.name}</h3>
                          <Badge className={relationshipColors[connection.relationship] || 'bg-gray-100'}>
                            {connection.relationship}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trophy className="h-4 w-4 mr-2" />
                              Challenge
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          Level {connection.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          {connection.streak} day streak
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {connection.status === 'online' ? 'Online' : `Last active ${connection.lastActive}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">
                  You&apos;re all caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>
                          {request.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Level {request.level} • {request.mutualConnections} mutual connections
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="suggested" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestedConnections.map((suggestion) => (
              <Card key={suggestion.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-4 text-center">
                  <Avatar className="h-16 w-16 mx-auto mb-3">
                    <AvatarFallback className="text-lg">
                      {suggestion.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold">{suggestion.name}</h3>
                  <p className="text-sm text-muted-foreground">Level {suggestion.level}</p>
                  <Badge variant="outline" className="mt-2">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {suggestion.reason}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {suggestion.mutualConnections} mutual connections
                  </p>
                  <Button className="w-full mt-4" size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Connection Detail Dialog */}
      <Dialog open={!!selectedConnection} onOpenChange={() => setSelectedConnection(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedConnection && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-3">
                    <AvatarFallback className="text-2xl">
                      {selectedConnection.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <DialogTitle>{selectedConnection.name}</DialogTitle>
                  <Badge className={relationshipColors[selectedConnection.relationship] || 'bg-gray-100'}>
                    {selectedConnection.relationship}
                  </Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <Star className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
                    <p className="font-bold">{selectedConnection.level}</p>
                    <p className="text-xs text-muted-foreground">Level</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                    <p className="font-bold">{selectedConnection.streak}</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <Sparkles className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                    <p className="font-bold">{selectedConnection.xp.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Shared Achievements</span>
                  <span className="font-bold">{selectedConnection.sharedAchievements}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Mutual Connections</span>
                  <span className="font-bold">{selectedConnection.mutualConnections}</span>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Trophy className="h-4 w-4 mr-1" />
                    Challenge
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
