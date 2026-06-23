'use client';

import { useState, useCallback, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  change?: number;
}

interface CurrentUserRank {
  rank: number;
  xp: number;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  currentUser: CurrentUserRank | null;
  loading: boolean;
  error: string | null;
  period: 'weekly' | 'monthly' | 'allTime';
  filter: 'all' | 'ageBand' | 'connections';
  setPeriod: (period: 'weekly' | 'monthly' | 'allTime') => void;
  setFilter: (filter: 'all' | 'ageBand' | 'connections') => void;
  refresh: () => Promise<void>;
}

export function useLeaderboard(initialPeriod: 'weekly' | 'monthly' | 'allTime' = 'weekly'): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserRank | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>(initialPeriod);
  const [filter, setFilter] = useState<'all' | 'ageBand' | 'connections'>('all');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period,
        filter,
        limit: '10',
      });

      const response = await fetch(`/api/leaderboard?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.leaderboard);
      setCurrentUser(data.currentUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [period, filter]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    currentUser,
    loading,
    error,
    period,
    filter,
    setPeriod,
    setFilter,
    refresh: fetchLeaderboard,
  };
}

// Hook for comparing with other users
interface ComparisonData {
  user1: { name: string; xp: number; level: number; lessonsCompleted: number };
  user2: { name: string; xp: number; level: number; lessonsCompleted: number };
}

export function useLeaderboardComparison(userId: string | null) {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);

  const compare = useCallback(async (otherUserId: string) => {
    if (!otherUserId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard/compare?userId=${otherUserId}`);
      if (response.ok) {
        const data = await response.json();
        setComparison(data);
      }
    } catch (error) {
      console.error('Failed to compare users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { comparison, loading, compare };
}

// Hook for leaderboard position tracking
interface PositionHistory {
  date: string;
  rank: number;
  xp: number;
}

export function useLeaderboardHistory() {
  const [history, setHistory] = useState<PositionHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (period: 'week' | 'month' | 'year' = 'month') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard/history?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch position history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { history, loading, fetchHistory };
}

// Helper function to get rank display
export function getRankDisplay(rank: number): { icon: string; color: string; label: string } {
  if (rank === 1) {
    return { icon: '👑', color: 'text-yellow-500', label: '1st' };
  }
  if (rank === 2) {
    return { icon: '🥈', color: 'text-gray-400', label: '2nd' };
  }
  if (rank === 3) {
    return { icon: '🥉', color: 'text-amber-600', label: '3rd' };
  }
  return { icon: '', color: 'text-muted-foreground', label: `#${rank}` };
}

// Helper function to calculate rank change indicator
export function getRankChange(current: number, previous: number): { direction: 'up' | 'down' | 'same'; amount: number } {
  if (current < previous) {
    return { direction: 'up', amount: previous - current };
  }
  if (current > previous) {
    return { direction: 'down', amount: current - previous };
  }
  return { direction: 'same', amount: 0 };
}
