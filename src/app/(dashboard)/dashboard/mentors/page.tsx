'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  MessageCircle,
  Calendar,
  Star,
  Clock,
  BookOpen,
  Video,
  Send,
  CheckCircle,
  XCircle,
  Award,
  Briefcase,
  GraduationCap,
  Heart,
} from 'lucide-react';

// Mock mentor data
const myMentors = [
  {
    id: 'm1',
    name: 'Robert Chen',
    relation: 'Dad',
    title: 'Investment Advisor',
    avatar: null,
    expertise: ['Investing', 'Portfolio Management', 'Real Estate'],
    rating: 4.9,
    sessionsCompleted: 24,
    availability: 'Available',
    bio: 'Over 20 years of experience in wealth management and investment strategy.',
  },
  {
    id: 'm2',
    name: 'Sarah Thompson',
    relation: 'Family Mentor',
    title: 'Financial Educator',
    avatar: null,
    expertise: ['Budgeting', 'Financial Planning', 'Career Development'],
    rating: 5.0,
    sessionsCompleted: 12,
    availability: 'Available',
    bio: 'Passionate about helping young people build strong financial foundations.',
  },
];

const upcomingSessions = [
  {
    id: 's1',
    mentor: 'Robert Chen',
    topic: 'Introduction to Stock Analysis',
    date: '2024-02-20',
    time: '4:00 PM',
    duration: '45 min',
    status: 'scheduled',
  },
  {
    id: 's2',
    mentor: 'Sarah Thompson',
    topic: 'Creating Your First Budget',
    date: '2024-02-22',
    time: '3:30 PM',
    duration: '30 min',
    status: 'scheduled',
  },
];

const pastSessions = [
  {
    id: 'ps1',
    mentor: 'Robert Chen',
    topic: 'Understanding Market Trends',
    date: '2024-02-15',
    duration: '45 min',
    notes: 'Learned about reading market indicators and basic chart patterns.',
    rating: 5,
  },
  {
    id: 'ps2',
    mentor: 'Sarah Thompson',
    topic: 'Emergency Fund Basics',
    date: '2024-02-10',
    duration: '30 min',
    notes: 'Discussed the importance of having 3-6 months of expenses saved.',
    rating: 5,
  },
  {
    id: 'ps3',
    mentor: 'Robert Chen',
    topic: 'Types of Investment Accounts',
    date: '2024-02-05',
    duration: '45 min',
    notes: 'Covered 401k, IRA, Roth IRA, and brokerage accounts.',
    rating: 5,
  },
];

const messages = [
  {
    id: 'msg1',
    from: 'Robert Chen',
    content: "Great job on completing the investing module! Ready to dive deeper?",
    time: '2 hours ago',
    read: true,
  },
  {
    id: 'msg2',
    from: 'Sarah Thompson',
    content: "Don't forget our session tomorrow at 3:30 PM!",
    time: '1 day ago',
    read: true,
  },
  {
    id: 'msg3',
    from: 'Robert Chen',
    content: "I've added some reading materials to your learning track. Check them out when you have time.",
    time: '3 days ago',
    read: true,
  },
];

export default function MentorsPage() {
  const [activeTab, setActiveTab] = useState('mentors');
  const [newMessage, setNewMessage] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-indigo-500" />
            Mentorship
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with mentors and accelerate your learning
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mentors">My Mentors</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="mentors" className="space-y-6 mt-6">
          {/* Mentor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myMentors.map((mentor) => (
              <Card key={mentor.id} className="overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <CardContent className="pt-0 -mt-12">
                  <div className="flex items-end gap-4 mb-4">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={mentor.avatar || undefined} />
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xl">
                        {mentor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{mentor.name}</h3>
                        <Badge variant="secondary">{mentor.relation}</Badge>
                      </div>
                      <p className="text-muted-foreground">{mentor.title}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.expertise.map((exp) => (
                      <Badge key={exp} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mb-4 py-4 border-y">
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold">{mentor.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div>
                      <p className="font-bold">{mentor.sessionsCompleted}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div>
                      <Badge className={mentor.availability === 'Available' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}>
                        {mentor.availability}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button className="flex-1">
                      <Video className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto py-4">
                  <BookOpen className="h-5 w-5 mr-3 text-blue-500" />
                  <div className="text-left">
                    <p className="font-medium">Ask a Question</p>
                    <p className="text-xs text-muted-foreground">Get help with lessons</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <GraduationCap className="h-5 w-5 mr-3 text-green-500" />
                  <div className="text-left">
                    <p className="font-medium">Career Advice</p>
                    <p className="text-xs text-muted-foreground">Plan your future</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-4">
                  <Briefcase className="h-5 w-5 mr-3 text-purple-500" />
                  <div className="text-left">
                    <p className="font-medium">Real-World Projects</p>
                    <p className="text-xs text-muted-foreground">Apply your knowledge</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6 mt-6">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{session.topic}</h4>
                      <p className="text-sm text-muted-foreground">with {session.mentor}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(session.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.time} ({session.duration})
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Reschedule
                    </Button>
                    <Button size="sm">
                      Join
                    </Button>
                  </div>
                </div>
              ))}

              {upcomingSessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming sessions scheduled</p>
                  <Button className="mt-4">Schedule a Session</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Past Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{session.topic}</h4>
                      <p className="text-sm text-muted-foreground">with {session.mentor}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                        <span>{session.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < session.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {session.notes && (
                    <div className="mt-3 p-3 bg-white rounded border text-sm">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Session Notes:</p>
                      {session.notes}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mentor List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Conversations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {myMentors.map((mentor) => (
                  <button
                    key={mentor.id}
                    onClick={() => setSelectedMentor(mentor.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedMentor === mentor.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {mentor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{mentor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {messages.find(m => m.from === mentor.name)?.content || 'No messages'}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>RC</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Robert Chen</CardTitle>
                    <CardDescription>Investment Advisor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {messages.filter(m => m.from === 'Robert Chen').map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">RC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
                      </div>
                    </div>
                  ))}

                  {/* Example user message */}
                  <div className="flex gap-3 flex-row-reverse">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs bg-indigo-500 text-white">YO</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-indigo-500 text-white rounded-lg p-3 ml-auto max-w-[80%]">
                        <p className="text-sm">Thanks! I&apos;m excited to learn more about investing!</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 text-right">1 hour ago</p>
                    </div>
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                    <Button className="h-full">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
