'use client';

import { useState, useCallback } from 'react';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  xp?: number;
  timestamp: string | Date;
  category?: string;
  link?: string;
}

interface ActivityStats {
  totalActivities: number;
  weeklyActivities: number;
  weeklyXp: number;
  lessonsThisWeek: number;
  achievementsThisWeek: number;
}

interface UseActivityReturn {
  activities: Activity[];
  stats: ActivityStats | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  fetchActivities: (type?: string, reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useActivity(initialLimit: number = 20): UseActivityReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [currentType, setCurrentType] = useState<string | undefined>();

  const fetchActivities = useCallback(async (type?: string, reset: boolean = true) => {
    setLoading(true);
    setError(null);

    if (reset) {
      setOffset(0);
      setCurrentType(type);
    }

    try {
      const params = new URLSearchParams({
        limit: initialLimit.toString(),
        offset: reset ? '0' : offset.toString(),
      });

      if (type && type !== 'All') {
        params.append('type', type);
      }

      const response = await fetch(`/api/activity?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();

      if (reset) {
        setActivities(data.activities);
      } else {
        setActivities(prev => [...prev, ...data.activities]);
      }

      setStats(data.stats);
      setHasMore(data.hasMore);
      setOffset(prev => reset ? initialLimit : prev + initialLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [initialLimit, offset]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchActivities(currentType, false);
  }, [hasMore, loading, fetchActivities, currentType]);

  return {
    activities,
    stats,
    loading,
    error,
    hasMore,
    fetchActivities,
    loadMore,
  };
}

// Hook for tracking user actions and logging activity
interface UseActivityTrackerReturn {
  trackActivity: (type: string, data?: Record<string, any>) => Promise<void>;
  recentActivities: Activity[];
}

export function useActivityTracker(): UseActivityTrackerReturn {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  const trackActivity = useCallback(async (type: string, data?: Record<string, any>) => {
    try {
      const response = await fetch('/api/activity/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });

      if (response.ok) {
        const activity = await response.json();
        setRecentActivities(prev => [activity, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }, []);

  return {
    trackActivity,
    recentActivities,
  };
}

// Hook for activity stats
interface UseActivityStatsReturn {
  stats: {
    today: { count: number; xp: number };
    week: { count: number; xp: number };
    month: { count: number; xp: number };
    streak: number;
  } | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useActivityStats(): UseActivityStatsReturn {
  const [stats, setStats] = useState<UseActivityStatsReturn['stats']>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/activity/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch activity stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, loading, refresh };
}

// Hook for activity filters
interface ActivityFilter {
  type: string;
  dateRange: 'today' | 'week' | 'month' | 'all';
  category: string;
}

interface UseActivityFiltersReturn {
  filters: ActivityFilter;
  setFilter: <K extends keyof ActivityFilter>(key: K, value: ActivityFilter[K]) => void;
  resetFilters: () => void;
  buildQueryString: () => string;
}

export function useActivityFilters(initialFilters?: Partial<ActivityFilter>): UseActivityFiltersReturn {
  const defaultFilters: ActivityFilter = {
    type: 'All',
    dateRange: 'week',
    category: 'All',
    ...initialFilters,
  };

  const [filters, setFilters] = useState<ActivityFilter>(defaultFilters);

  const setFilter = useCallback(<K extends keyof ActivityFilter>(key: K, value: ActivityFilter[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();

    if (filters.type !== 'All') {
      params.append('type', filters.type);
    }
    if (filters.dateRange !== 'all') {
      params.append('dateRange', filters.dateRange);
    }
    if (filters.category !== 'All') {
      params.append('category', filters.category);
    }

    return params.toString();
  }, [filters]);

  return {
    filters,
    setFilter,
    resetFilters,
    buildQueryString,
  };
}
