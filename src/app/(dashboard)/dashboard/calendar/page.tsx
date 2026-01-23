'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Video,
  Users,
  Plus,
  Bell,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BookOpen,
  GraduationCap,
  Trophy,
  Target,
} from 'lucide-react';

// Mock events data
const events = [
  {
    id: 'e1',
    title: 'Financial Foundations Workshop',
    type: 'workshop',
    date: '2024-02-20',
    time: '3:00 PM',
    duration: '1 hour',
    location: 'Virtual',
    isVirtual: true,
    meetingLink: 'https://zoom.us/...',
    description: 'Introduction to basic financial concepts and budgeting.',
    instructor: 'Sarah Thompson',
    maxAttendees: 50,
    attendees: 32,
    rsvpStatus: 'going',
    category: 'learning',
  },
  {
    id: 'e2',
    title: 'Mentor Session: Stock Analysis',
    type: 'mentorship',
    date: '2024-02-20',
    time: '4:30 PM',
    duration: '45 min',
    location: null,
    isVirtual: true,
    meetingLink: 'https://zoom.us/...',
    description: 'One-on-one session with Dad about analyzing stocks.',
    instructor: 'Robert Chen',
    maxAttendees: 1,
    attendees: 1,
    rsvpStatus: 'going',
    category: 'mentorship',
  },
  {
    id: 'e3',
    title: 'Family Finance Meeting',
    type: 'family',
    date: '2024-02-22',
    time: '7:00 PM',
    duration: '1 hour',
    location: 'Home',
    isVirtual: false,
    meetingLink: null,
    description: 'Monthly family meeting to discuss financial goals and progress.',
    instructor: null,
    maxAttendees: null,
    attendees: 4,
    rsvpStatus: 'going',
    category: 'family',
  },
  {
    id: 'e4',
    title: 'Teen Investing Challenge Kickoff',
    type: 'challenge',
    date: '2024-02-25',
    time: '2:00 PM',
    duration: '30 min',
    location: 'Virtual',
    isVirtual: true,
    meetingLink: 'https://zoom.us/...',
    description: 'Join the 30-day investing challenge! Learn to research and pick stocks.',
    instructor: 'Morgan Lee',
    maxAttendees: 100,
    attendees: 67,
    rsvpStatus: null,
    category: 'challenge',
  },
  {
    id: 'e5',
    title: 'Quiz: Budgeting Basics',
    type: 'quiz',
    date: '2024-02-21',
    time: '11:59 PM',
    duration: null,
    location: null,
    isVirtual: false,
    meetingLink: null,
    description: 'Complete the Budgeting Basics quiz before the deadline.',
    instructor: null,
    maxAttendees: null,
    attendees: null,
    rsvpStatus: null,
    category: 'deadline',
  },
];

const eventTypeConfig = {
  workshop: { icon: BookOpen, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  mentorship: { icon: GraduationCap, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  family: { icon: Users, color: 'bg-green-100 text-green-600 border-green-200' },
  challenge: { icon: Trophy, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  quiz: { icon: Target, color: 'bg-red-100 text-red-600 border-red-200' },
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 1, 1)); // February 2024
  const [selectedDate, setSelectedDate] = useState<string | null>('2024-02-20');
  const [view, setView] = useState<'month' | 'week'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const getEventsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const selectedDateEvents = selectedDate
    ? events.filter(e => e.date === selectedDate)
    : [];

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-indigo-500" />
            Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your learning sessions, deadlines, and events
          </p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-xl font-bold">
                  {months[month]} {year}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                const dayEvents = getEventsForDate(day);
                const isSelected = dateStr === selectedDate;
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                return (
                  <button
                    key={index}
                    onClick={() => day && setSelectedDate(dateStr)}
                    disabled={!day}
                    className={`
                      min-h-[80px] p-2 rounded-lg border transition-all text-left
                      ${!day ? 'bg-muted/30 cursor-default' : 'hover:bg-muted/50 cursor-pointer'}
                      ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}
                      ${isToday ? 'border-indigo-500' : 'border-transparent'}
                    `}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? 'text-indigo-600' : ''}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => {
                            const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig];
                            return (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded truncate ${config.color}`}
                              >
                                {event.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {Object.entries(eventTypeConfig).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div className={`p-1 rounded ${config.color}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="capitalize text-muted-foreground">{type}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Day Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map(event => {
                    const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig];
                    const Icon = config.icon;

                    return (
                      <div key={event.id} className={`p-4 rounded-lg border ${config.color}`}>
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 text-sm mt-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                              {event.duration && ` · ${event.duration}`}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2 text-sm mt-1">
                                {event.isVirtual ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                {event.location}
                              </div>
                            )}

                            {/* RSVP Status */}
                            {event.rsvpStatus && (
                              <Badge
                                className={`mt-2 ${
                                  event.rsvpStatus === 'going'
                                    ? 'bg-green-500'
                                    : event.rsvpStatus === 'maybe'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                              >
                                {event.rsvpStatus === 'going' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                {event.rsvpStatus === 'maybe' && <HelpCircle className="h-3 w-3 mr-1" />}
                                {event.rsvpStatus === 'not-going' && <XCircle className="h-3 w-3 mr-1" />}
                                {event.rsvpStatus.charAt(0).toUpperCase() + event.rsvpStatus.slice(1)}
                              </Badge>
                            )}

                            {!event.rsvpStatus && event.type !== 'quiz' && (
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="default">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  RSVP
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events on this day</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map(event => {
                const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig];
                const Icon = config.icon;
                const date = new Date(event.date + 'T00:00:00');

                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedDate(event.date)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' · '}{event.time}
                      </p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Schedule Mentor Session
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Create Family Event
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
