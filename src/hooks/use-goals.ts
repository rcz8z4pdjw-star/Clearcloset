'use client';

import { useState, useCallback, useEffect } from 'react';

interface Goal {
  id: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  status: 'in_progress' | 'completed' | 'paused';
  priority: 'high' | 'medium' | 'low';
  milestones?: Array<{ amount: number; reached: boolean; reachedAt?: string }>;
  createdAt: string;
  completedAt?: string;
}

interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  totalSaved: number;
  totalTarget: number;
}

interface UseGoalsReturn {
  goals: Goal[];
  stats: GoalStats;
  loading: boolean;
  error: string | null;
  fetchGoals: (filters?: { status?: string; category?: string }) => Promise<void>;
  createGoal: (data: Partial<Goal>) => Promise<Goal | null>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<boolean>;
  logProgress: (id: string, amount: number, note?: string) => Promise<{ success: boolean; xpAwarded?: number; milestonesReached?: number }>;
  deleteGoal: (id: string) => Promise<boolean>;
  pauseGoal: (id: string) => Promise<boolean>;
  resumeGoal: (id: string) => Promise<boolean>;
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    totalSaved: 0,
    totalTarget: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async (filters?: { status?: string; category?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category) params.set('category', filters.category);

      const response = await fetch(`/api/goals?${params}`);
      if (!response.ok) throw new Error('Failed to fetch goals');

      const data = await response.json();
      setGoals(data.goals);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (data: Partial<Goal>): Promise<Goal | null> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create goal');

      const result = await response.json();
      await fetchGoals(); // Refresh list
      return result.goal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal');
      return null;
    }
  }, [fetchGoals]);

  const updateGoal = useCallback(async (id: string, data: Partial<Goal>): Promise<boolean> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, action: 'update', ...data }),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      await fetchGoals(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal');
      return false;
    }
  }, [fetchGoals]);

  const logProgress = useCallback(async (
    id: string,
    amount: number,
    note?: string
  ): Promise<{ success: boolean; xpAwarded?: number; milestonesReached?: number }> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, action: 'log_progress', amount, note }),
      });

      if (!response.ok) throw new Error('Failed to log progress');

      const result = await response.json();
      await fetchGoals(); // Refresh list

      return {
        success: true,
        xpAwarded: result.xpAwarded,
        milestonesReached: result.milestonesReached,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log progress');
      return { success: false };
    }
  }, [fetchGoals]);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      await fetchGoals(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
      return false;
    }
  }, [fetchGoals]);

  const pauseGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, action: 'pause' }),
      });

      if (!response.ok) throw new Error('Failed to pause goal');

      await fetchGoals(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause goal');
      return false;
    }
  }, [fetchGoals]);

  const resumeGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: id, action: 'resume' }),
      });

      if (!response.ok) throw new Error('Failed to resume goal');

      await fetchGoals(); // Refresh list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume goal');
      return false;
    }
  }, [fetchGoals]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    stats,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    logProgress,
    deleteGoal,
    pauseGoal,
    resumeGoal,
  };
}

// Hook for single goal details
export function useGoal(goalId: string | null) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = useCallback(async () => {
    if (!goalId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`);
      if (response.ok) {
        const data = await response.json();
        setGoal(data.goal);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goal');
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  return { goal, loading, error, refetch: fetchGoal };
}

// Helper functions for goal calculations
export function calculateGoalProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function getDaysUntilDeadline(deadline: string | Date): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getGoalStatus(goal: Goal): 'on_track' | 'behind' | 'ahead' | 'completed' {
  if (goal.status === 'completed') return 'completed';

  const daysRemaining = getDaysUntilDeadline(goal.deadline);
  const totalDays = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPassed = totalDays - daysRemaining;

  const expectedProgress = daysPassed > 0 ? (daysPassed / totalDays) * 100 : 0;
  const actualProgress = calculateGoalProgress(goal.currentAmount, goal.targetAmount);

  if (actualProgress >= expectedProgress + 10) return 'ahead';
  if (actualProgress <= expectedProgress - 10) return 'behind';
  return 'on_track';
}

export function formatGoalAmount(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}
