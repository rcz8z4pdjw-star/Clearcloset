'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

interface MarkCompleteButtonProps {
  lessonId: string;
}

export function MarkCompleteButton({ lessonId }: MarkCompleteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleMarkComplete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lessons/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lessonId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark lesson as complete');
      }

      router.refresh();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleMarkComplete}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4" />
      )}
      Mark as Complete
    </Button>
  );
}
