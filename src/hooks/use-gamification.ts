'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  badges: number;
  isLoading: boolean;
}

interface XPGainResult {
  newXP: number;
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  completed: boolean;
  progress: number;
  target: number;
}

export function useGamification() {
  const [state, setState] = useState<GamificationState>({
    xp: 0,
    level: 1,
    streak: 0,
    badges: 0,
    isLoading: true,
  });
  const { toast } = useToast();

  // Fetch current gamification state
  const fetchState = useCallback(async () => {
    try {
      const response = await fetch('/api/progress?type=overview');
      if (response.ok) {
        const data = await response.json();
        setState({
          xp: data.overview.xp,
          level: data.overview.level,
          streak: data.overview.streak,
          badges: data.overview.earnedBadges,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to fetch gamification state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Award XP
  const awardXP = useCallback(async (
    amount: number,
    reason: string,
    entityType?: string,
    entityId?: string
  ): Promise<XPGainResult | null> => {
    try {
      const response = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason, entityType, entityId }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update local state
        setState(prev => ({
          ...prev,
          xp: result.newXP,
          level: result.leveledUp ? result.newLevel : prev.level,
        }));

        // Show toast for XP gain
        toast({
          title: `+${amount} XP`,
          description: reason,
        });

        // Show level up toast if applicable
        if (result.leveledUp) {
          toast({
            title: '🎉 Level Up!',
            description: `Congratulations! You're now Level ${result.newLevel}!`,
          });
        }

        return result;
      }
    } catch (error) {
      console.error('Failed to award XP:', error);
    }
    return null;
  }, [toast]);

  // Check streak
  const checkStreak = useCallback(async () => {
    try {
      const response = await fetch('/api/streak');
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({ ...prev, streak: data.streak }));
        return data;
      }
    } catch (error) {
      console.error('Failed to check streak:', error);
    }
    return null;
  }, []);

  // Get daily challenges
  const getDailyChallenges = useCallback(async (): Promise<Challenge[] | null> => {
    try {
      const response = await fetch('/api/challenges');
      if (response.ok) {
        const data = await response.json();
        return data.challenges;
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    }
    return null;
  }, []);

  // Complete a challenge
  const completeChallenge = useCallback(async (challengeId: string, xpReward: number) => {
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, xpReward }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update XP
        setState(prev => ({ ...prev, xp: prev.xp + xpReward }));

        toast({
          title: 'Challenge Complete! 🎯',
          description: `+${xpReward} XP earned`,
        });

        if (result.bonusXp) {
          toast({
            title: 'Daily Champion! 🏆',
            description: `All challenges complete! +${result.bonusXp} bonus XP`,
          });
        }

        return result;
      }
    } catch (error) {
      console.error('Failed to complete challenge:', error);
    }
    return null;
  }, [toast]);

  // Calculate level from XP
  const calculateLevel = useCallback((xp: number): number => {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (xp >= thresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }, []);

  // Get XP progress to next level
  const getXPProgress = useCallback((xp: number): { current: number; required: number; percent: number } => {
    const thresholds = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000];
    const level = calculateLevel(xp);
    const currentThreshold = thresholds[level - 1] || 0;
    const nextThreshold = thresholds[level] || thresholds[thresholds.length - 1];

    const xpInLevel = xp - currentThreshold;
    const xpRequired = nextThreshold - currentThreshold;
    const percent = Math.round((xpInLevel / xpRequired) * 100);

    return {
      current: xpInLevel,
      required: xpRequired,
      percent: Math.min(100, percent),
    };
  }, [calculateLevel]);

  // Format XP for display
  const formatXP = useCallback((xp: number): string => {
    if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
    return xp.toString();
  }, []);

  return {
    ...state,
    awardXP,
    checkStreak,
    getDailyChallenges,
    completeChallenge,
    calculateLevel,
    getXPProgress,
    formatXP,
    refresh: fetchState,
  };
}

// Hook for tracking lesson progress
export function useLessonProgress(lessonId: string) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { awardXP } = useGamification();
  const { toast } = useToast();

  const updateProgress = useCallback(async (newProgress: number, positionSeconds?: number) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          action: 'progress',
          progress: newProgress,
          positionSeconds,
        }),
      });
      setProgress(newProgress);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }, [lessonId]);

  const completeLesson = useCallback(async () => {
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, action: 'complete' }),
      });

      if (response.ok) {
        const result = await response.json();
        setIsCompleted(true);
        setProgress(100);

        toast({
          title: 'Lesson Complete! 📚',
          description: `+${result.xp?.xpGained || 50} XP`,
        });

        return result;
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
    return null;
  }, [lessonId, toast]);

  const toggleBookmark = useCallback(async () => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, action: 'bookmark', isBookmarked: !isBookmarked }),
      });
      setIsBookmarked(!isBookmarked);

      toast({
        title: isBookmarked ? 'Bookmark Removed' : 'Lesson Bookmarked',
        description: isBookmarked ? 'Removed from your bookmarks' : 'Added to your bookmarks',
      });
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, [lessonId, isBookmarked, toast]);

  return {
    progress,
    isCompleted,
    isBookmarked,
    updateProgress,
    completeLesson,
    toggleBookmark,
  };
}

// Hook for quiz tracking
export function useQuizProgress(quizId: string) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const submitQuiz = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, answers }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.passed) {
          toast({
            title: '🎉 Quiz Passed!',
            description: `Score: ${result.score}% | +${result.xp?.xpGained || 0} XP`,
          });
        } else {
          toast({
            title: 'Quiz Not Passed',
            description: `Score: ${result.score}%. You need 70% to pass.`,
            variant: 'destructive',
          });
        }

        return result;
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
    return null;
  }, [quizId, answers, toast]);

  return {
    answers,
    setAnswer,
    submitQuiz,
    isSubmitting,
  };
}
