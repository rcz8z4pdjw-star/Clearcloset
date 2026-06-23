'use client';

import { cn } from '@/lib/utils';
import { Star, Crown, Flame, Zap, Award, Trophy, Medal, Shield } from 'lucide-react';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

const levelConfig = [
  { min: 1, max: 2, color: 'from-gray-400 to-gray-500', icon: Star, label: 'Newcomer' },
  { min: 3, max: 4, color: 'from-green-400 to-green-500', icon: Zap, label: 'Explorer' },
  { min: 5, max: 6, color: 'from-blue-400 to-blue-500', icon: Medal, label: 'Learner' },
  { min: 7, max: 8, color: 'from-purple-400 to-purple-500', icon: Shield, label: 'Scholar' },
  { min: 9, max: 10, color: 'from-orange-400 to-orange-500', icon: Award, label: 'Expert' },
  { min: 11, max: 15, color: 'from-red-400 to-red-500', icon: Trophy, label: 'Master' },
  { min: 16, max: 20, color: 'from-yellow-400 to-yellow-500', icon: Flame, label: 'Champion' },
  { min: 21, max: Infinity, color: 'from-yellow-300 via-yellow-400 to-amber-500', icon: Crown, label: 'Legend' },
];

export function LevelBadge({ level, size = 'md', showLabel = false, className }: LevelBadgeProps) {
  const config = levelConfig.find(c => level >= c.min && level <= c.max) || levelConfig[0];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center bg-gradient-to-br font-bold text-white shadow-lg',
        `bg-gradient-to-br ${config.color}`,
        sizeClasses[size]
      )}>
        {level}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium">{config.label}</span>
      )}
    </div>
  );
}

interface LevelProgressProps {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  size?: 'sm' | 'md' | 'lg';
  showXP?: boolean;
  className?: string;
}

export function LevelProgress({
  level,
  currentXP,
  xpForNextLevel,
  size = 'md',
  showXP = true,
  className,
}: LevelProgressProps) {
  const config = levelConfig.find(c => level >= c.min && level <= c.max) || levelConfig[0];
  const progress = Math.min(100, Math.round((currentXP / xpForNextLevel) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LevelBadge level={level} size="sm" />
          <span className="text-sm font-medium">Level {level}</span>
        </div>
        {showXP && (
          <span className="text-sm text-muted-foreground">
            {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </span>
        )}
      </div>
      <div className={cn('bg-muted rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all bg-gradient-to-r', config.color)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface XPDisplayProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

export function XPDisplay({ xp, size = 'md', showIcon = true, animated = false, className }: XPDisplayProps) {
  const formatXP = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn(
      'flex items-center gap-1 font-bold',
      textSizes[size],
      animated && 'animate-pulse',
      className
    )}>
      {showIcon && <Star className={cn('text-yellow-500', iconSizes[size])} />}
      <span>{formatXP(xp)} XP</span>
    </div>
  );
}

interface StreakDisplayProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function StreakDisplay({
  streak,
  size = 'md',
  showIcon = true,
  showLabel = false,
  className,
}: StreakDisplayProps) {
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const isHot = streak >= 7;
  const isOnFire = streak >= 30;

  return (
    <div className={cn(
      'flex items-center gap-1 font-bold',
      textSizes[size],
      isOnFire ? 'text-red-500' : isHot ? 'text-orange-500' : 'text-muted-foreground',
      className
    )}>
      {showIcon && (
        <Flame className={cn(
          iconSizes[size],
          isOnFire && 'animate-pulse'
        )} />
      )}
      <span>{streak}</span>
      {showLabel && <span className="font-normal text-muted-foreground">day streak</span>}
    </div>
  );
}

interface UserStatsRowProps {
  level: number;
  xp: number;
  streak: number;
  className?: string;
}

export function UserStatsRow({ level, xp, streak, className }: UserStatsRowProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <LevelBadge level={level} size="sm" />
      <XPDisplay xp={xp} size="sm" />
      <StreakDisplay streak={streak} size="sm" showIcon />
    </div>
  );
}
