'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  HelpCircle,
  BookOpen,
  CheckCircle,
  Layers,
  Star,
  Users,
  FolderOpen,
  TrendingUp,
  BarChart3,
  Calendar,
  Award,
  Search,
  Heart,
  Shield,
  MessageSquare,
  Target,
  Crown,
  Zap,
  Gift,
  Clock,
  ChevronRight,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  video: Video,
  quiz: HelpCircle,
  book: BookOpen,
  check: CheckCircle,
  layers: Layers,
  star: Star,
  users: Users,
  folder: FolderOpen,
  trending: TrendingUp,
  chart: BarChart3,
  calendar: Calendar,
  award: Award,
  search: Search,
  heart: Heart,
  shield: Shield,
  message: MessageSquare,
  target: Target,
  crown: Crown,
};

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: string;
  completed?: boolean;
  progress?: number;
}

interface DailyChallengesProps {
  challenges: Challenge[];
  completedChallenges: string[];
  onChallengeClick?: (challengeId: string) => void;
}

export function DailyChallenges({
  challenges,
  completedChallenges,
  onChallengeClick,
}: DailyChallengesProps) {
  const completedCount = completedChallenges.length;
  const totalXP = challenges.reduce((sum, c) => sum + c.xp, 0);
  const earnedXP = challenges
    .filter((c) => completedChallenges.includes(c.id))
    .reduce((sum, c) => sum + c.xp, 0);

  // Calculate time until reset (midnight)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursUntilReset = Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            >
              <Zap className="h-6 w-6" />
            </motion.div>
            <div>
              <CardTitle className="text-white">Daily Challenges</CardTitle>
              <p className="text-purple-100 text-sm">
                Complete challenges to earn bonus XP!
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-purple-100">
              <Clock className="h-4 w-4" />
              Resets in {hoursUntilReset}h
            </div>
            <Badge variant="secondary" className="mt-1 bg-white/20 text-white hover:bg-white/30">
              {earnedXP}/{totalXP} XP
            </Badge>
          </div>
        </div>
        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-purple-100 mb-1">
            <span>{completedCount}/{challenges.length} completed</span>
            {completedCount === challenges.length && (
              <span className="flex items-center gap-1">
                <Gift className="h-4 w-4" />
                All complete! 🎉
              </span>
            )}
          </div>
          <Progress
            value={(completedCount / challenges.length) * 100}
            className="h-2 bg-purple-400"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <AnimatePresence>
            {challenges.map((challenge, index) => {
              const Icon = iconMap[challenge.icon] || Star;
              const isCompleted = completedChallenges.includes(challenge.id);

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${
                    isCompleted
                      ? 'bg-green-50 border-green-200'
                      : 'hover:bg-muted/50 cursor-pointer'
                  }`}
                  onClick={() => !isCompleted && onChallengeClick?.(challenge.id)}
                >
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500'
                        : 'bg-gradient-to-br from-purple-400 to-indigo-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Icon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {challenge.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={isCompleted ? 'success' : 'secondary'}
                      className="font-bold"
                    >
                      +{challenge.xp} XP
                    </Badge>
                    {!isCompleted && (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or smaller spaces
export function DailyChallengesCompact({
  challenges,
  completedChallenges,
}: {
  challenges: Challenge[];
  completedChallenges: string[];
}) {
  const completedCount = completedChallenges.length;

  return (
    <div className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          <span className="font-semibold">Daily Challenges</span>
        </div>
        <Badge variant="secondary" className="bg-white/20 text-white">
          {completedCount}/{challenges.length}
        </Badge>
      </div>
      <Progress
        value={(completedCount / challenges.length) * 100}
        className="h-2 bg-purple-400"
      />
      <p className="text-sm text-purple-100 mt-2">
        {completedCount === challenges.length
          ? '🎉 All complete!'
          : `${challenges.length - completedCount} left to go!`}
      </p>
    </div>
  );
}
