'use client';

import { useState, useCallback, useEffect } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark_read' }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' }),
      });

      if (!response.ok) throw new Error('Failed to clear notifications');

      setNotifications([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear notifications');
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

// Hook for toast notifications (in-app alerts)
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
    clearToasts,
  };
}

// Hook for push notification permissions
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [supported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!supported || permission !== 'granted') return;

    new Notification(title, options);
  }, [supported, permission]);

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
  };
}

// Notification type icons
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    ACHIEVEMENT_EARNED: 'trophy',
    LEVEL_UP: 'star',
    STREAK_MILESTONE: 'flame',
    GOAL_COMPLETED: 'target',
    LESSON_REMINDER: 'book',
    CHALLENGE_AVAILABLE: 'zap',
    MENTOR_MESSAGE: 'message',
    WORKSHOP_REMINDER: 'calendar',
    BADGE_EARNED: 'award',
    CERTIFICATE_READY: 'graduation',
    FAMILY_UPDATE: 'users',
    SYSTEM: 'bell',
  };

  return icons[type] || 'bell';
}

// Notification type colors
export function getNotificationColor(type: string): string {
  const colors: Record<string, string> = {
    ACHIEVEMENT_EARNED: 'text-yellow-500',
    LEVEL_UP: 'text-purple-500',
    STREAK_MILESTONE: 'text-orange-500',
    GOAL_COMPLETED: 'text-green-500',
    LESSON_REMINDER: 'text-blue-500',
    CHALLENGE_AVAILABLE: 'text-indigo-500',
    MENTOR_MESSAGE: 'text-pink-500',
    WORKSHOP_REMINDER: 'text-cyan-500',
    BADGE_EARNED: 'text-amber-500',
    CERTIFICATE_READY: 'text-emerald-500',
    FAMILY_UPDATE: 'text-violet-500',
    SYSTEM: 'text-gray-500',
  };

  return colors[type] || 'text-gray-500';
}
