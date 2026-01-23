import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAgeBand, getAgeBandShortLabel, formatRelativeTime, calculateProgress } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  Users,
  Calendar,
  Target,
  Award,
  ArrowRight,
  Clock,
  TrendingUp,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      lessonProgress: {
        where: { completedAt: { not: null } },
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  track: true,
                },
              },
            },
          },
        },
      },
      badges: {
        orderBy: { awardedAt: 'desc' },
        take: 4,
        include: {
          badge: true,
        },
      },
      mentorAssignmentsAsMentee: {
        where: { isActive: true },
        include: {
          mentor: true,
          sessions: {
            where: {
              status: { in: ['SCHEDULED', 'REQUESTED'] },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 3,
          },
          actionPlans: {
            where: { isCompleted: false },
            take: 5,
          },
        },
      },
      cohortMemberships: {
        include: {
          cohort: {
            include: {
              events: {
                where: {
                  startTime: { gte: new Date() },
                },
                orderBy: { startTime: 'asc' },
                take: 3,
              },
            },
          },
        },
      },
      portfolios: {
        where: { isActive: true },
        include: {
          holdings: true,
          tradeRequests: {
            where: { status: 'PENDING' },
          },
        },
      },
    },
  });

  if (!user) return null;

  // Get total lesson count
  const totalLessons = await prisma.lesson.count({
    where: { isPublished: true },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId,
      completedAt: { not: null },
    },
  });

  return {
    user,
    stats: {
      totalLessons,
      completedLessons,
      totalBadges: user.badges.length,
      pendingActionPlans: user.mentorAssignmentsAsMentee.reduce(
        (sum, a) => sum + a.actionPlans.length,
        0
      ),
    },
  };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent userId={currentUser.id} />
    </Suspense>
  );
}

async function DashboardContent({ userId }: { userId: string }) {
  const data = await getDashboardData(userId);

  if (!data) {
    redirect('/login');
  }

  const { user, stats } = data;
  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);
  const progressPercent = calculateProgress(stats.completedLessons, stats.totalLessons);

  const upcomingEvents = user.cohortMemberships.flatMap((m) => m.cohort.events);
  const upcomingSessions = user.mentorAssignmentsAsMentee.flatMap((a) => a.sessions);
  const mentor = user.mentorAssignmentsAsMentee[0]?.mentor;

  const portfolio = user.portfolios[0];
  const portfolioValue = portfolio
    ? portfolio.holdings.reduce((sum, h) => sum + h.quantity * (h.currentPrice || h.averageCost), 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">
          <Badge variant="gold" className="mr-2">
            {getAgeBandShortLabel(ageBand)}
          </Badge>
          Here's your learning journey overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <Progress value={progressPercent} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completedLessons} of {stats.totalLessons} lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBadges}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep learning to earn more!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Plans</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingActionPlans}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Pending completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Continue Learning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Continue Learning
            </CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent>
            {user.lessonProgress.length > 0 ? (
              <div className="space-y-4">
                {user.lessonProgress.slice(0, 3).map((progress) => (
                  <Link
                    key={progress.id}
                    href={`/dashboard/learning/${progress.lesson.module.track.slug}/${progress.lesson.module.slug}/${progress.lesson.slug}`}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-ascent-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{progress.lesson.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {progress.lesson.module.name}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Start your learning journey
                </p>
                <Button asChild>
                  <Link href="/dashboard/learning">
                    Browse Tracks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentorship */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mentorship
            </CardTitle>
            <CardDescription>Your mentor and upcoming sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {mentor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={mentor.avatarUrl || undefined} />
                    <AvatarFallback className="bg-ascent-navy text-white">
                      {mentor.firstName[0]}{mentor.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{mentor.firstName} {mentor.lastName}</p>
                    <p className="text-sm text-muted-foreground">Your Mentor</p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link href="/dashboard/mentorship">
                      <MessageSquare className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {upcomingSessions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Upcoming Sessions</p>
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-2 rounded border text-sm"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {session.scheduledAt
                            ? new Date(session.scheduledAt).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : 'To be scheduled'}
                        </span>
                        <Badge variant="outline" className="ml-auto">
                          {session.status.toLowerCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/dashboard/mentorship/sessions">
                      Schedule a Session
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No mentor assigned yet
                </p>
                <p className="text-sm text-muted-foreground">
                  A mentor will be assigned to guide your journey
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Badges
            </CardTitle>
            <CardDescription>Your achievements</CardDescription>
          </CardHeader>
          <CardContent>
            {user.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {user.badges.map((userBadge) => (
                  <div
                    key={userBadge.id}
                    className="flex flex-col items-center p-4 rounded-lg border text-center"
                  >
                    <div className="h-12 w-12 rounded-full bg-ascent-gold/20 flex items-center justify-center mb-2">
                      <Award className="h-6 w-6 text-ascent-gold" />
                    </div>
                    <p className="font-medium text-sm">{userBadge.badge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(userBadge.awardedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Complete lessons and quizzes to earn badges
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Summary (if applicable) */}
        {portfolio && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Portfolio Summary
              </CardTitle>
              <CardDescription>{portfolio.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">
                    ${portfolioValue.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Holdings</span>
                  <span className="font-medium">{portfolio.holdings.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pending Trades</span>
                  <Badge variant={portfolio.tradeRequests.length > 0 ? 'warning' : 'outline'}>
                    {portfolio.tradeRequests.length}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/practicum/portfolio">
                    View Portfolio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="h-10 w-10 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-ascent-navy" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/community/events/${event.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/learning">
                <BookOpen className="h-6 w-6" />
                <span>Continue Learning</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/mentorship/sessions">
                <Calendar className="h-6 w-6" />
                <span>Schedule Session</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/community">
                <MessageSquare className="h-6 w-6" />
                <span>Community</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/resources/library">
                <Target className="h-6 w-6" />
                <span>Resources</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
