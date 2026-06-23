import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, getAgeBand, getAgeBandLabel, calculateProgress } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Target,
  Settings,
  Edit,
  Shield,
  Clock,
  Trophy,
  Star,
} from 'lucide-react';

async function getProfileData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      badges: {
        include: { badge: true },
        orderBy: { awardedAt: 'desc' },
      },
      lessonProgress: {
        where: { completedAt: { not: null } },
        include: {
          lesson: {
            include: {
              module: {
                include: { track: true },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      },
      quizAttempts: {
        where: { passed: true },
        orderBy: { completedAt: 'desc' },
      },
      householdMemberships: {
        include: { household: true },
      },
      cohortMemberships: {
        include: { cohort: true },
      },
      portfolios: true,
    },
  });

  if (!user) return null;

  // Get total lessons count
  const totalLessons = await prisma.lesson.count({
    where: { isPublished: true },
  });

  // Get total badges count
  const totalBadges = await prisma.badge.count();

  // Calculate stats
  const completedLessons = user.lessonProgress.length;
  const earnedBadges = user.badges.length;
  const passedQuizzes = user.quizAttempts.length;

  // Learning streaks
  const recentActivity = await prisma.lessonProgress.findMany({
    where: {
      usedId: userId,
      completedAt: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    take: 30,
  });

  // Calculate streak
  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const hasActivity = recentActivity.some((a) => {
      const activityDate = new Date(a.completedAt!);
      activityDate.setHours(0, 0, 0, 0);
      return activityDate.getTime() === date.getTime();
    });

    if (hasActivity) {
      currentStreak++;
    } else if (i > 0) {
      break;
    }
  }

  return {
    user,
    stats: {
      completedLessons,
      totalLessons,
      earnedBadges,
      totalBadges,
      passedQuizzes,
      currentStreak,
      learningProgress: calculateProgress(completedLessons, totalLessons),
    },
  };
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent userId={user.id} />
    </Suspense>
  );
}

async function ProfileContent({ userId }: { userId: string }) {
  const data = await getProfileData(userId);

  if (!data) {
    redirect('/login');
  }

  const { user, stats } = data;
  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);
  const isMember = user.roles.some((r) => r.role === 'MEMBER');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-ascent-navy text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-3xl font-bold text-ascent-navy">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {user.roles.map((r) => (
                <Badge key={r.id} variant="secondary" className="capitalize">
                  <Shield className="h-3 w-3 mr-1" />
                  {r.role.toLowerCase().replace('_', ' ')}
                </Badge>
              ))}
              {isMember && (
                <Badge variant="gold">{getAgeBandLabel(ageBand)}</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-ascent-navy" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedLessons}</p>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-ascent-gold/20 flex items-center justify-center">
                <Award className="h-6 w-6 text-ascent-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.earnedBadges}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.passedQuizzes}</p>
                <p className="text-sm text-muted-foreground">Quizzes Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      {isMember && (
        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Your overall progress through the curriculum</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completedLessons} of {stats.totalLessons} lessons
                  </span>
                </div>
                <Progress value={stats.learningProgress} className="h-3" />
                <p className="text-right text-sm font-medium mt-1">
                  {stats.learningProgress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-ascent-gold" />
              Badges ({stats.earnedBadges}/{stats.totalBadges})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.badges.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {user.badges.map((ub) => (
                  <div
                    key={ub.id}
                    className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50"
                  >
                    <div className="h-12 w-12 rounded-full bg-ascent-gold/20 flex items-center justify-center mb-2">
                      <Award className="h-6 w-6 text-ascent-gold" />
                    </div>
                    <p className="font-medium text-sm">{ub.badge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(ub.awardedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No badges earned yet</p>
                <p className="text-sm">Complete lessons and quizzes to earn badges!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.lessonProgress.length > 0 ? (
              <div className="space-y-3">
                {user.lessonProgress.map((progress) => (
                  <div
                    key={progress.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {progress.lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {progress.lesson.module.track.name} · {progress.lesson.module.name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(progress.completedAt!)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start learning to track your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memberships */}
      {(user.householdMemberships.length > 0 || user.cohortMemberships.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Memberships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {user.householdMemberships.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Households</h3>
                  <div className="space-y-2">
                    {user.householdMemberships.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 p-2 rounded bg-muted/50"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{m.household.name}</span>
                        {m.isPrimary && (
                          <Badge variant="gold" className="text-xs ml-auto">
                            Primary
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {user.cohortMemberships.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Cohorts</h3>
                  <div className="space-y-2">
                    {user.cohortMemberships.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 p-2 rounded bg-muted/50"
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{m.cohort.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
