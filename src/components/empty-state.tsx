'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText, Search, BookOpen, Users, MessageCircle, Bell,
  Calendar, Award, Target, Folder, Plus
} from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'p-6',
    md: 'p-12',
    lg: 'p-16',
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  return (
    <Card className={cn('text-center', className)}>
      <CardContent className={sizeClasses[size]}>
        {icon && (
          <div className={cn('mx-auto text-muted-foreground mb-4', iconSizes[size])}>
            {icon}
          </div>
        )}
        <h3 className={cn('font-semibold mb-2', titleSizes[size])}>{title}</h3>
        {description && (
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
        )}
        {(action || secondaryAction) && (
          <div className="flex items-center justify-center gap-2">
            {action && (
              <Button asChild={!!action.href} onClick={action.onClick}>
                {action.href ? (
                  <a href={action.href}>{action.label}</a>
                ) : (
                  action.label
                )}
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" asChild={!!secondaryAction.href} onClick={secondaryAction.onClick}>
                {secondaryAction.href ? (
                  <a href={secondaryAction.href}>{secondaryAction.label}</a>
                ) : (
                  secondaryAction.label
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-built empty states for common scenarios
export function NoSearchResults({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12" />}
      title="No results found"
      description={query ? `We couldn't find anything matching "${query}"` : 'Try adjusting your search or filters'}
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  );
}

export function NoLessons() {
  return (
    <EmptyState
      icon={<BookOpen className="h-12 w-12" />}
      title="No lessons yet"
      description="Start your learning journey by exploring available tracks"
      action={{ label: 'Browse Tracks', href: '/dashboard/learn' }}
    />
  );
}

export function NoConnections() {
  return (
    <EmptyState
      icon={<Users className="h-12 w-12" />}
      title="No connections yet"
      description="Connect with family members and other learners"
      action={{ label: 'Find Connections', href: '/dashboard/connections' }}
    />
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={<MessageCircle className="h-12 w-12" />}
      title="No messages"
      description="Start a conversation with your connections"
      action={{ label: 'New Message', href: '/dashboard/messages/new' }}
    />
  );
}

export function NoNotifications() {
  return (
    <EmptyState
      icon={<Bell className="h-12 w-12" />}
      title="All caught up!"
      description="You have no new notifications"
      size="sm"
    />
  );
}

export function NoEvents() {
  return (
    <EmptyState
      icon={<Calendar className="h-12 w-12" />}
      title="No upcoming events"
      description="Check back later for workshops and sessions"
      action={{ label: 'Browse Workshops', href: '/dashboard/workshops' }}
    />
  );
}

export function NoBadges() {
  return (
    <EmptyState
      icon={<Award className="h-12 w-12" />}
      title="No badges earned yet"
      description="Complete lessons and quizzes to earn badges"
      action={{ label: 'Start Learning', href: '/dashboard/learn' }}
    />
  );
}

export function NoChallenges() {
  return (
    <EmptyState
      icon={<Target className="h-12 w-12" />}
      title="All challenges completed!"
      description="Great job! Check back tomorrow for new challenges"
      size="sm"
    />
  );
}

export function NoFiles() {
  return (
    <EmptyState
      icon={<Folder className="h-12 w-12" />}
      title="No files"
      description="Upload documents or resources to get started"
      action={{ label: 'Upload File', onClick: () => {} }}
    />
  );
}

export function NoData({ title, description }: { title?: string; description?: string }) {
  return (
    <EmptyState
      icon={<FileText className="h-12 w-12" />}
      title={title || "No data available"}
      description={description || "There's nothing to display here yet"}
    />
  );
}

// Loading placeholder
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12', className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

// Error state
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn('text-center', className)}>
      <CardContent className="p-12">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-red-600 text-2xl">!</span>
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Coming soon state
interface ComingSoonProps {
  feature?: string;
  className?: string;
}

export function ComingSoon({ feature, className }: ComingSoonProps) {
  return (
    <Card className={cn('text-center', className)}>
      <CardContent className="p-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <span className="text-3xl">🚀</span>
        </div>
        <h3 className="font-semibold text-lg mb-2">Coming Soon</h3>
        <p className="text-muted-foreground">
          {feature ? `${feature} is` : 'This feature is'} currently under development
        </p>
      </CardContent>
    </Card>
  );
}
