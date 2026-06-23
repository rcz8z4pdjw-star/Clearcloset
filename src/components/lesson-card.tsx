'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, Play, CheckCircle, Clock, Lock, Star,
  ChevronRight, Zap, Video, FileText, Headphones
} from 'lucide-react';

// Lesson card for course/module view
interface LessonCardProps {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'article' | 'interactive' | 'audio';
  duration: number; // in minutes
  xpReward: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress?: number;
  order: number;
  isCurrentLesson?: boolean;
  onClick?: () => void;
}

export function LessonCard({
  id,
  title,
  description,
  type,
  duration,
  xpReward,
  status,
  progress = 0,
  order,
  isCurrentLesson,
  onClick,
}: LessonCardProps) {
  const getTypeIcon = () => {
    const icons = {
      video: <Video className="h-4 w-4" />,
      article: <FileText className="h-4 w-4" />,
      interactive: <Play className="h-4 w-4" />,
      audio: <Headphones className="h-4 w-4" />,
    };
    return icons[type] || <BookOpen className="h-4 w-4" />;
  };

  const getStatusDisplay = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-400" />;
      case 'in_progress':
        return (
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 rounded-full bg-indigo-100" />
            <div
              className="absolute inset-0 rounded-full bg-indigo-500"
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((progress / 100) * 2 * Math.PI)}% ${50 - 50 * Math.cos((progress / 100) * 2 * Math.PI)}%, 50% 50%)`,
              }}
            />
          </div>
        );
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        status === 'locked' ? 'opacity-60' : ''
      } ${isCurrentLesson ? 'ring-2 ring-indigo-300 bg-indigo-50/50' : ''}`}
      onClick={status !== 'locked' ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Order number and status */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-bold text-muted-foreground">{order}</span>
            {getStatusDisplay()}
          </div>

          {/* Lesson info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{title}</h3>
              {status === 'completed' && (
                <Badge className="bg-green-100 text-green-700">Complete</Badge>
              )}
              {isCurrentLesson && (
                <Badge className="bg-indigo-100 text-indigo-700">Current</Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                {type}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration} min
              </span>
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {xpReward} XP
              </Badge>
            </div>
            {status === 'in_progress' && progress > 0 && (
              <Progress value={progress} className="h-1 mt-2" />
            )}
          </div>

          {/* Action */}
          {status !== 'locked' && (
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact lesson item for lists
interface LessonItemProps {
  title: string;
  duration: number;
  completed: boolean;
  onClick?: () => void;
}

export function LessonItem({ title, duration, completed, onClick }: LessonItemProps) {
  return (
    <div
      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
    >
      {completed ? (
        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
      )}
      <span className={`flex-1 text-sm truncate ${completed ? 'text-muted-foreground line-through' : ''}`}>
        {title}
      </span>
      <span className="text-xs text-muted-foreground">{duration}m</span>
    </div>
  );
}

// Module card containing multiple lessons
interface ModuleCardProps {
  id: string;
  title: string;
  description?: string;
  lessonsCount: number;
  completedLessons: number;
  duration: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  order: number;
  onClick?: () => void;
}

export function ModuleCard({
  id,
  title,
  description,
  lessonsCount,
  completedLessons,
  duration,
  status,
  order,
  onClick,
}: ModuleCardProps) {
  const progress = lessonsCount > 0 ? Math.round((completedLessons / lessonsCount) * 100) : 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        status === 'locked' ? 'opacity-60' : ''
      }`}
      onClick={status !== 'locked' ? onClick : undefined}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              status === 'completed'
                ? 'bg-green-100'
                : status === 'locked'
                ? 'bg-gray-100'
                : 'bg-gradient-to-br from-indigo-100 to-purple-100'
            }`}>
              {status === 'completed' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : status === 'locked' ? (
                <Lock className="h-5 w-5 text-gray-400" />
              ) : (
                <span className="font-bold text-indigo-600">{order}</span>
              )}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {status !== 'locked' && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {lessonsCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {duration} min
          </span>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedLessons}/{lessonsCount}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// Featured lesson card for homepage/recommendations
interface FeaturedLessonProps {
  id: string;
  title: string;
  description: string;
  track: string;
  type: string;
  duration: number;
  xpReward: number;
  thumbnail?: string;
  onClick?: () => void;
}

export function FeaturedLessonCard({
  id,
  title,
  description,
  track,
  type,
  duration,
  xpReward,
  thumbnail,
  onClick,
}: FeaturedLessonProps) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={onClick}>
      <div className={`h-32 ${thumbnail ? '' : 'bg-gradient-to-br from-indigo-500 to-purple-600'} flex items-center justify-center`}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="h-12 w-12 text-white/50" />
        )}
      </div>
      <CardContent className="p-4">
        <Badge variant="outline" className="mb-2">{track}</Badge>
        <h3 className="font-semibold line-clamp-2 mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {duration} min
          </span>
          <Badge className="bg-indigo-100 text-indigo-700">
            <Zap className="h-3 w-3 mr-1" />
            {xpReward} XP
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Continue learning card
interface ContinueLearningProps {
  lessonTitle: string;
  trackTitle: string;
  progress: number;
  timeRemaining: number;
  onClick?: () => void;
}

export function ContinueLearningCard({
  lessonTitle,
  trackTitle,
  progress,
  timeRemaining,
  onClick,
}: ContinueLearningProps) {
  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-all" onClick={onClick}>
      <CardContent className="p-6">
        <p className="text-white/70 text-sm mb-1">Continue Learning</p>
        <h3 className="text-xl font-bold mb-2">{lessonTitle}</h3>
        <p className="text-white/80 text-sm mb-4">{trackTitle}</p>
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">{progress}% complete</span>
              <span className="text-white/70">{timeRemaining}m left</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
          <Button variant="secondary" size="sm">
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
