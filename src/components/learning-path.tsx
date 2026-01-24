'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, Lock, Play, BookOpen, ChevronRight,
  Clock, Star, Trophy, Circle
} from 'lucide-react';

interface LearningPathNode {
  id: string;
  title: string;
  description?: string;
  type: 'lesson' | 'quiz' | 'module' | 'milestone';
  status: 'completed' | 'current' | 'locked' | 'available';
  xpReward?: number;
  duration?: string;
  href?: string;
}

interface LearningPathProps {
  nodes: LearningPathNode[];
  title?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function LearningPath({
  nodes,
  title,
  orientation = 'vertical',
  className,
}: LearningPathProps) {
  const getStatusIcon = (status: LearningPathNode['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Play className="h-5 w-5 text-indigo-500" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getTypeIcon = (type: LearningPathNode['type']) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />;
      case 'quiz':
        return <Star className="h-4 w-4" />;
      case 'module':
        return <ChevronRight className="h-4 w-4" />;
      case 'milestone':
        return <Trophy className="h-4 w-4" />;
    }
  };

  if (orientation === 'horizontal') {
    return (
      <div className={cn('space-y-4', className)}>
        {title && <h3 className="font-semibold text-lg">{title}</h3>}
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {nodes.map((node, index) => (
            <div key={node.id} className="flex items-center">
              <Link
                href={node.status !== 'locked' && node.href ? node.href : '#'}
                className={cn(
                  'flex flex-col items-center p-4 rounded-lg border-2 min-w-[140px] transition-all',
                  node.status === 'completed' && 'border-green-200 bg-green-50',
                  node.status === 'current' && 'border-indigo-500 bg-indigo-50 shadow-md',
                  node.status === 'available' && 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50',
                  node.status === 'locked' && 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="mb-2">{getStatusIcon(node.status)}</div>
                <p className="text-sm font-medium text-center line-clamp-2">{node.title}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {getTypeIcon(node.type)}
                  {node.duration && <span>{node.duration}</span>}
                </div>
              </Link>
              {index < nodes.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1',
                  node.status === 'completed' ? 'bg-green-400' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        {nodes.map((node, index) => (
          <div key={node.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
            {/* Node icon */}
            <div className={cn(
              'relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2',
              node.status === 'completed' && 'bg-green-100 border-green-500',
              node.status === 'current' && 'bg-indigo-100 border-indigo-500',
              node.status === 'available' && 'bg-white border-gray-300',
              node.status === 'locked' && 'bg-gray-100 border-gray-300'
            )}>
              {getStatusIcon(node.status)}
            </div>

            {/* Content */}
            <div className={cn(
              'flex-1 p-4 rounded-lg border transition-all',
              node.status === 'completed' && 'border-green-200 bg-green-50/50',
              node.status === 'current' && 'border-indigo-200 bg-indigo-50/50 shadow-sm',
              node.status === 'available' && 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30',
              node.status === 'locked' && 'border-gray-200 bg-gray-50 opacity-60'
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getTypeIcon(node.type)}
                      <span className="ml-1 capitalize">{node.type}</span>
                    </Badge>
                    {node.xpReward && (
                      <Badge variant="secondary" className="text-xs">
                        +{node.xpReward} XP
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-medium">{node.title}</h4>
                  {node.description && (
                    <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
                  )}
                  {node.duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      {node.duration}
                    </div>
                  )}
                </div>

                {node.status !== 'locked' && node.href && (
                  <Button size="sm" variant={node.status === 'current' ? 'default' : 'outline'} asChild>
                    <Link href={node.href}>
                      {node.status === 'completed' ? 'Review' : node.status === 'current' ? 'Continue' : 'Start'}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  title: string;
  description?: string;
  lessonsCount: number;
  completedLessons: number;
  duration?: string;
  xpReward?: number;
  status: 'completed' | 'in-progress' | 'locked' | 'available';
  href?: string;
  className?: string;
}

export function ModuleCard({
  title,
  description,
  lessonsCount,
  completedLessons,
  duration,
  xpReward,
  status,
  href,
  className,
}: ModuleCardProps) {
  const progress = lessonsCount > 0 ? Math.round((completedLessons / lessonsCount) * 100) : 0;

  const content = (
    <div className={cn(
      'p-4 rounded-lg border transition-all',
      status === 'completed' && 'border-green-200 bg-green-50',
      status === 'in-progress' && 'border-indigo-200 bg-indigo-50',
      status === 'available' && 'border-gray-200 hover:border-indigo-300 hover:shadow-sm',
      status === 'locked' && 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed',
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'in-progress' && <Play className="h-5 w-5 text-indigo-500" />}
          {status === 'locked' && <Lock className="h-5 w-5 text-gray-400" />}
          {status === 'available' && <BookOpen className="h-5 w-5 text-gray-400" />}
          <h4 className="font-semibold">{title}</h4>
        </div>
        {xpReward && (
          <Badge variant="secondary">+{xpReward} XP</Badge>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">{completedLessons}/{lessonsCount} lessons</span>
        {duration && (
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration}
          </span>
        )}
      </div>

      <Progress value={progress} className="h-2" />
    </div>
  );

  if (status !== 'locked' && href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface TrackProgressProps {
  trackName: string;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  totalXP: number;
  earnedXP: number;
  className?: string;
}

export function TrackProgress({
  trackName,
  totalModules,
  completedModules,
  totalLessons,
  completedLessons,
  totalXP,
  earnedXP,
  className,
}: TrackProgressProps) {
  const moduleProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const lessonProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const xpProgress = totalXP > 0 ? Math.round((earnedXP / totalXP) * 100) : 0;

  return (
    <div className={cn('space-y-4 p-4 bg-muted/50 rounded-lg', className)}>
      <h3 className="font-semibold">{trackName} Progress</h3>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Modules</span>
            <span className="font-medium">{completedModules}/{totalModules}</span>
          </div>
          <Progress value={moduleProgress} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Lessons</span>
            <span className="font-medium">{completedLessons}/{totalLessons}</span>
          </div>
          <Progress value={lessonProgress} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">XP Earned</span>
            <span className="font-medium">{earnedXP}/{totalXP}</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
        </div>
      </div>
    </div>
  );
}
