'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Trophy, Lock, CheckCircle, Star } from 'lucide-react';

interface AchievementCardProps {
  name: string;
  description: string;
  icon?: ReactNode;
  earned: boolean;
  earnedAt?: Date;
  progress?: {
    current: number;
    target: number;
  };
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward?: number;
  className?: string;
}

const rarityConfig = {
  common: { color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-300', label: 'Common' },
  uncommon: { color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-300', label: 'Uncommon' },
  rare: { color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-300', label: 'Rare' },
  epic: { color: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-300', label: 'Epic' },
  legendary: { color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400', label: 'Legendary' },
};

export function AchievementCard({
  name,
  description,
  icon,
  earned,
  earnedAt,
  progress,
  rarity = 'common',
  xpReward,
  className,
}: AchievementCardProps) {
  const config = rarityConfig[rarity];
  const progressPercent = progress ? Math.round((progress.current / progress.target) * 100) : 0;

  return (
    <Card className={cn(
      'transition-all',
      earned ? `border-2 ${config.borderColor} ${config.bgColor}` : 'opacity-60',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            'p-3 rounded-full',
            earned ? config.bgColor : 'bg-muted'
          )}>
            {earned ? (
              icon || <Trophy className={cn('h-6 w-6', config.color)} />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{name}</h4>
              {earned && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(config.color, config.bgColor)}>
                {config.label}
              </Badge>
              {xpReward && (
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1 text-yellow-500" />
                  +{xpReward} XP
                </Badge>
              )}
            </div>

            {!earned && progress && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progress.current}/{progress.target}</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {earned && earnedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                Earned on {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AchievementBadgeProps {
  name: string;
  icon?: ReactNode;
  earned: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({
  name,
  icon,
  earned,
  rarity = 'common',
  size = 'md',
}: AchievementBadgeProps) {
  const config = rarityConfig[rarity];
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        'rounded-full flex items-center justify-center border-2',
        sizeClasses[size],
        earned ? `${config.bgColor} ${config.borderColor}` : 'bg-muted border-muted opacity-40'
      )}>
        {earned ? (
          icon || <Trophy className={cn(iconSizes[size], config.color)} />
        ) : (
          <Lock className={cn(iconSizes[size], 'text-muted-foreground')} />
        )}
      </div>
      <span className={cn(
        'text-xs text-center font-medium',
        earned ? '' : 'text-muted-foreground'
      )}>
        {name}
      </span>
    </div>
  );
}

interface AchievementListProps {
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    earned: boolean;
    earnedAt?: Date;
    progress?: { current: number; target: number };
    rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    xpReward?: number;
  }>;
  showLocked?: boolean;
  columns?: 1 | 2;
}

export function AchievementList({
  achievements,
  showLocked = true,
  columns = 1,
}: AchievementListProps) {
  const displayedAchievements = showLocked
    ? achievements
    : achievements.filter(a => a.earned);

  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'md:grid-cols-2'
    )}>
      {displayedAchievements.map(achievement => (
        <AchievementCard
          key={achievement.id}
          name={achievement.name}
          description={achievement.description}
          earned={achievement.earned}
          earnedAt={achievement.earnedAt}
          progress={achievement.progress}
          rarity={achievement.rarity}
          xpReward={achievement.xpReward}
        />
      ))}
    </div>
  );
}

interface AchievementProgressProps {
  earned: number;
  total: number;
}

export function AchievementProgress({ earned, total }: AchievementProgressProps) {
  const percent = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Achievement Progress</span>
        <span className="font-medium">{earned}/{total} ({percent}%)</span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}
