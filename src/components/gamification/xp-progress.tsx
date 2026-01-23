'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Zap, Star } from 'lucide-react';

interface XPProgressProps {
  currentXP: number;
  level: number;
  title: string;
  xpToNext: number;
  xpProgress: number;
  color?: string;
  showAnimation?: boolean;
}

export function XPProgress({
  currentXP,
  level,
  title,
  xpToNext,
  xpProgress,
  color = 'gold',
  showAnimation = true,
}: XPProgressProps) {
  const levelColors: Record<string, string> = {
    gray: 'from-gray-400 to-gray-600',
    green: 'from-green-400 to-green-600',
    blue: 'from-blue-400 to-blue-600',
    purple: 'from-purple-400 to-purple-600',
    indigo: 'from-indigo-400 to-indigo-600',
    orange: 'from-orange-400 to-orange-600',
    red: 'from-red-400 to-red-600',
    pink: 'from-pink-400 to-pink-600',
    yellow: 'from-yellow-400 to-yellow-600',
    gold: 'from-yellow-500 to-amber-600',
  };

  return (
    <div className="relative">
      {/* Level Badge */}
      <div className="flex items-center gap-4 mb-3">
        <motion.div
          initial={showAnimation ? { scale: 0 } : undefined}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className={`h-14 w-14 rounded-full bg-gradient-to-br ${levelColors[color]} flex items-center justify-center shadow-lg`}
        >
          <span className="text-xl font-bold text-white">{level}</span>
        </motion.div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{title}</h3>
            {level >= 5 && (
              <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Level {level} • {currentXP.toLocaleString()} XP total
          </p>
        </div>
      </div>

      {/* XP Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress to Level {level + 1}</span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            {xpToNext} XP needed
          </span>
        </div>
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={showAnimation ? { width: 0 } : undefined}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${levelColors[color]} rounded-full`}
          />
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
        </div>
        <p className="text-right text-xs font-medium">{xpProgress}%</p>
      </div>
    </div>
  );
}

interface XPGainProps {
  amount: number;
  reason: string;
}

export function XPGainNotification({ amount, reason }: XPGainProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
    >
      <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
        <Star className="h-6 w-6" />
      </div>
      <div>
        <p className="font-bold text-lg">+{amount} XP</p>
        <p className="text-sm text-white/80">{reason}</p>
      </div>
    </motion.div>
  );
}

interface StreakDisplayProps {
  streak: number;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  const getStreakColor = () => {
    if (streak >= 30) return 'text-red-500';
    if (streak >= 14) return 'text-orange-500';
    if (streak >= 7) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getStreakEmoji = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '✨';
    return '';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <TrendingUp className={`h-4 w-4 ${getStreakColor()}`} />
        <span className="font-bold">{streak}</span>
        <span className="text-xs">{getStreakEmoji()}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-200">
      <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
        <TrendingUp className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-bold text-lg">{streak} Day Streak {getStreakEmoji()}</p>
        <p className="text-sm text-muted-foreground">
          {streak >= 7
            ? 'Amazing consistency!'
            : streak >= 3
            ? 'Keep it going!'
            : 'Build your streak!'}
        </p>
      </div>
    </div>
  );
}
