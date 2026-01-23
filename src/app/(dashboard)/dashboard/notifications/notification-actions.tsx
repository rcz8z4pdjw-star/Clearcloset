'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck, Loader2 } from 'lucide-react';

export function MarkAsReadButton({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async () => {
    setIsLoading(true);
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleMarkAsRead}
      disabled={isLoading}
      className="h-8 w-8"
      title="Mark as read"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </Button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleMarkAllRead}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCheck className="h-4 w-4" />
      )}
      Mark All Read
    </Button>
  );
}
