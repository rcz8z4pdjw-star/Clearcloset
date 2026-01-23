import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelativeTime } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Award,
  Calendar,
  MessageSquare,
  BookOpen,
  Users,
  AlertCircle,
  Settings,
  Trash2,
} from 'lucide-react';
import { MarkAsReadButton, MarkAllReadButton } from './notification-actions';

async function getNotificationsData(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Group notifications by type
  const grouped = {
    all: notifications,
    unread: notifications.filter((n) => !n.readAt),
    badges: notifications.filter((n) => n.type === 'BADGE_AWARDED'),
    sessions: notifications.filter((n) => ['SESSION_SCHEDULED', 'SESSION_REMINDER', 'SESSION_CANCELLED'].includes(n.type)),
    community: notifications.filter((n) => ['NEW_COMMENT', 'POST_REPLY', 'COHORT_ANNOUNCEMENT'].includes(n.type)),
    learning: notifications.filter((n) => ['QUIZ_RESULT', 'MODULE_COMPLETED', 'LESSON_REMINDER'].includes(n.type)),
    system: notifications.filter((n) => ['SYSTEM_ANNOUNCEMENT', 'ACCOUNT_UPDATE'].includes(n.type)),
  };

  return {
    notifications,
    grouped,
    unreadCount,
  };
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}

const typeIcons: Record<string, any> = {
  BADGE_AWARDED: Award,
  SESSION_SCHEDULED: Calendar,
  SESSION_REMINDER: Calendar,
  SESSION_CANCELLED: Calendar,
  NEW_COMMENT: MessageSquare,
  POST_REPLY: MessageSquare,
  COHORT_ANNOUNCEMENT: Users,
  QUIZ_RESULT: BookOpen,
  MODULE_COMPLETED: BookOpen,
  LESSON_REMINDER: BookOpen,
  SYSTEM_ANNOUNCEMENT: AlertCircle,
  ACCOUNT_UPDATE: Settings,
};

const typeColors: Record<string, string> = {
  BADGE_AWARDED: 'bg-ascent-gold/20 text-ascent-gold',
  SESSION_SCHEDULED: 'bg-blue-100 text-blue-600',
  SESSION_REMINDER: 'bg-blue-100 text-blue-600',
  SESSION_CANCELLED: 'bg-red-100 text-red-600',
  NEW_COMMENT: 'bg-purple-100 text-purple-600',
  POST_REPLY: 'bg-purple-100 text-purple-600',
  COHORT_ANNOUNCEMENT: 'bg-green-100 text-green-600',
  QUIZ_RESULT: 'bg-orange-100 text-orange-600',
  MODULE_COMPLETED: 'bg-green-100 text-green-600',
  LESSON_REMINDER: 'bg-orange-100 text-orange-600',
  SYSTEM_ANNOUNCEMENT: 'bg-red-100 text-red-600',
  ACCOUNT_UPDATE: 'bg-gray-100 text-gray-600',
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsContent userId={user.id} />
    </Suspense>
  );
}

async function NotificationsContent({ userId }: { userId: string }) {
  const { notifications, grouped, unreadCount } = await getNotificationsData(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && <MarkAllReadButton />}
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings?tab=notifications">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all" className="gap-2">
            <Bell className="h-4 w-4" />
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <BellOff className="h-4 w-4" />
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learning
          </TabsTrigger>
        </TabsList>

        {Object.entries(grouped).map(([key, items]) => (
          <TabsContent key={key} value={key} className="space-y-3">
            {items.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {key === 'unread'
                      ? 'You\'ve read all your notifications!'
                      : 'No notifications in this category yet.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              items.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || 'bg-gray-100 text-gray-600';

                return (
                  <Card
                    key={notification.id}
                    className={`transition-colors ${
                      !notification.readAt
                        ? 'border-l-4 border-l-ascent-navy bg-ascent-navy/5'
                        : ''
                    }`}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold">{notification.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                              {!notification.readAt && (
                                <MarkAsReadButton notificationId={notification.id} />
                              )}
                            </div>
                          </div>
                          {notification.link && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto mt-2"
                              asChild
                            >
                              <Link href={notification.link}>View Details →</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
