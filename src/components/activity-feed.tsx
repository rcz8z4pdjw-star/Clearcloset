'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen, Trophy, MessageCircle, Calendar, Users, Star,
  Target, Zap, TrendingUp, Clock, ChevronRight
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  xp?: number;
  timestamp: string | Date;
  link?: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  activities: Activity[];
  showTimeline?: boolean;
  compact?: boolean;
  maxItems?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function ActivityFeed({
  activities,
  showTimeline = true,
  compact = false,
  maxItems,
  onLoadMore,
  hasMore = false,
  className,
}: ActivityFeedProps) {
  const displayActivities = maxItems ? activities.slice(0, maxItems) : activities;

  const getActivityIcon = (type: string) => {
    const icons: Record<string, { icon: React.ReactNode; color: string }> = {
      lesson_completed: { icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
      quiz_completed: { icon: <Star className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-100' },
      achievement_earned: { icon: <Trophy className="h-4 w-4" />, color: 'text-yellow-600 bg-yellow-100' },
      workshop_attended: { icon: <Calendar className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
      connection_made: { icon: <Users className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100' },
      message_received: { icon: <MessageCircle className="h-4 w-4" />, color: 'text-cyan-600 bg-cyan-100' },
      goal_completed: { icon: <Target className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-100' },
      goal_progress: { icon: <Target className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-100' },
      streak_milestone: { icon: <Zap className="h-4 w-4" />, color: 'text-orange-600 bg-orange-100' },
      level_up: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-pink-600 bg-pink-100' },
    };
    return icons[type] || { icon: <Star className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100' };
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {displayActivities.map((activity) => {
          const { icon, color } = getActivityIcon(activity.type);
          return (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={cn('p-1.5 rounded-full', color)}>
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {activity.xp && activity.xp > 0 && (
                  <Badge variant="secondary" className="text-xs">+{activity.xp} XP</Badge>
                )}
                <span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {displayActivities.map((activity, index) => {
        const { icon, color } = getActivityIcon(activity.type);
        return (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline */}
            {showTimeline && (
              <div className="flex flex-col items-center">
                <div className={cn('p-2 rounded-full', color)}>
                  {icon}
                </div>
                {index < displayActivities.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-2" />
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(activity.timestamp)}
                  </span>
                  {activity.xp && activity.xp > 0 && (
                    <Badge variant="secondary" className="text-xs">+{activity.xp} XP</Badge>
                  )}
                </div>
              </div>
              {activity.link && (
                <Button variant="link" size="sm" className="px-0 mt-2" asChild>
                  <a href={activity.link}>
                    View details <ChevronRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {hasMore && onLoadMore && (
        <Button variant="outline" className="w-full" onClick={onLoadMore}>
          Load More
        </Button>
      )}
    </div>
  );
}

// Activity summary card
interface ActivitySummaryProps {
  period?: 'today' | 'week' | 'month';
  stats: {
    activities: number;
    xpEarned: number;
    lessonsCompleted: number;
    achievements: number;
  };
  className?: string;
}

export function ActivitySummary({ period = 'week', stats, className }: ActivitySummaryProps) {
  const periodLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-2xl font-bold text-blue-600">{stats.activities}</p>
        <p className="text-sm text-muted-foreground">Activities {periodLabels[period]}</p>
      </div>
      <div className="p-4 bg-green-50 rounded-lg">
        <p className="text-2xl font-bold text-green-600">{stats.xpEarned}</p>
        <p className="text-sm text-muted-foreground">XP Earned</p>
      </div>
      <div className="p-4 bg-purple-50 rounded-lg">
        <p className="text-2xl font-bold text-purple-600">{stats.lessonsCompleted}</p>
        <p className="text-sm text-muted-foreground">Lessons Completed</p>
      </div>
      <div className="p-4 bg-yellow-50 rounded-lg">
        <p className="text-2xl font-bold text-yellow-600">{stats.achievements}</p>
        <p className="text-sm text-muted-foreground">Achievements</p>
      </div>
    </div>
  );
}

// Single activity item for inline use
interface ActivityItemProps {
  activity: Activity;
  showIcon?: boolean;
  className?: string;
}

export function ActivityItem({ activity, showIcon = true, className }: ActivityItemProps) {
  const { icon, color } = getActivityIcon(activity.type);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, { icon: React.ReactNode; color: string }> = {
      lesson_completed: { icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-600 bg-blue-100' },
      quiz_completed: { icon: <Star className="h-4 w-4" />, color: 'text-indigo-600 bg-indigo-100' },
      achievement_earned: { icon: <Trophy className="h-4 w-4" />, color: 'text-yellow-600 bg-yellow-100' },
      workshop_attended: { icon: <Calendar className="h-4 w-4" />, color: 'text-green-600 bg-green-100' },
      connection_made: { icon: <Users className="h-4 w-4" />, color: 'text-purple-600 bg-purple-100' },
    };
    return icons[type] || { icon: <Star className="h-4 w-4" />, color: 'text-gray-600 bg-gray-100' };
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showIcon && (
        <div className={cn('p-2 rounded-full', color)}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{activity.title}</p>
        {activity.description && (
          <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
        )}
      </div>
      <div className="text-right">
        {activity.xp && activity.xp > 0 && (
          <Badge variant="secondary" className="text-xs">+{activity.xp}</Badge>
        )}
        <p className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</p>
      </div>
    </div>
  );
}
