'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen, Award, Trophy, Target, Users, MessageCircle,
  Calendar, CheckCircle, Star, Flame, Zap, Gift, Heart,
  GraduationCap, TrendingUp, Clock, ChevronRight
} from 'lucide-react';

interface TimelineEventProps {
  type: string;
  title: string;
  description: string;
  timestamp: string | Date;
  xp?: number;
  icon?: string;
  highlight?: boolean;
  metadata?: Record<string, any>;
  onClick?: () => void;
}

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
  award: <Award className="h-4 w-4" />,
  message: <MessageCircle className="h-4 w-4" />,
  trending: <TrendingUp className="h-4 w-4" />,
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
  badge: 'bg-amber-100 text-amber-700 border-amber-200',
  mentorship: 'bg-violet-100 text-violet-700 border-violet-200',
};

export function TimelineEvent({
  type,
  title,
  description,
  timestamp,
  xp,
  icon,
  highlight,
  metadata,
  onClick,
}: TimelineEventProps) {
  const formatTime = (ts: string | Date) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md cursor-pointer ${highlight ? 'ring-2 ring-indigo-200' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${typeColors[type] || 'bg-gray-100'}`}>
            {iconMap[icon || 'star'] || <Star className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
              </div>
              {xp && xp > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 shrink-0">
                  <Zap className="h-3 w-3 mr-1" />
                  +{xp} XP
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{formatTime(timestamp)}</span>
              <Badge variant="outline" className="text-xs capitalize">{type}</Badge>
            </div>
          </div>
          {onClick && (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebars and smaller spaces
export function TimelineEventCompact({
  type,
  title,
  timestamp,
  xp,
  icon,
}: Omit<TimelineEventProps, 'description' | 'highlight' | 'metadata' | 'onClick'>) {
  const formatTime = (ts: string | Date) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`p-1.5 rounded ${typeColors[type] || 'bg-gray-100'}`}>
        {iconMap[icon || 'star'] || <Star className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground">{formatTime(timestamp)}</p>
      </div>
      {xp && xp > 0 && (
        <span className="text-xs font-medium text-indigo-600">+{xp}</span>
      )}
    </div>
  );
}

// Timeline group header
export function TimelineGroupHeader({ date }: { date: string | Date }) {
  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
        <Calendar className="h-4 w-4 text-white" />
      </div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {formatDate(date)}
      </h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// Timeline list component
interface TimelineListProps {
  events: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    xp?: number;
    icon?: string;
    highlight?: boolean;
  }>;
  grouped?: boolean;
  onEventClick?: (id: string) => void;
}

export function TimelineList({ events, grouped = true, onEventClick }: TimelineListProps) {
  if (!grouped) {
    return (
      <div className="space-y-3">
        {events.map((event) => (
          <TimelineEvent
            key={event.id}
            {...event}
            onClick={onEventClick ? () => onEventClick(event.id) : undefined}
          />
        ))}
      </div>
    );
  }

  // Group events by date
  const groupedEvents: Record<string, typeof events> = {};
  events.forEach((event) => {
    const dateKey = new Date(event.timestamp).toDateString();
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
        <div key={dateKey}>
          <TimelineGroupHeader date={dateKey} />
          <div className="space-y-3 ml-14">
            {dateEvents.map((event) => (
              <TimelineEvent
                key={event.id}
                {...event}
                onClick={onEventClick ? () => onEventClick(event.id) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
