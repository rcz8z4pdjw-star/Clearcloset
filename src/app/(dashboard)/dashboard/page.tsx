import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAgeBand, getAgeBandShortLabel, getAgeBandLabel, formatRelativeTime, calculateProgress } from '@/lib/utils';
import { getLevelFromXP, getXPToNextLevel, getDailyChallenges, calculateStreak } from '@/lib/gamification';
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
  Zap,
  Flame,
  Trophy,
  Star,
  Sparkles,
  Play,
  Rocket,
  Gift,
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
      dailyChallengeProgress: {
        where: {
          completedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
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
      usedId: userId,
      completedAt: { not: null },
    },
  });

  // Calculate streak
  const streak = await calculateStreak(userId);

  // Get leaderboard position
  const usersRanked = await prisma.user.findMany({
    where: {
      roles: { some: { role: 'MEMBER' } },
    },
    select: { id: true, totalXP: true },
    orderBy: { totalXP: 'desc' },
  });
  const leaderboardPosition = usersRanked.findIndex((u) => u.id === userId) + 1;

  // Get next lesson to continue
  const nextLesson = await prisma.lesson.findFirst({
    where: {
      isPublished: true,
      NOT: {
        progress: {
          some: {
            usedId: userId,
            completedAt: { not: null },
          },
        },
      },
    },
    include: {
      module: {
        include: { track: true },
      },
    },
    orderBy: [
      { module: { track: { sortOrder: 'asc' } } },
      { module: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
    ],
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
      streak,
      leaderboardPosition,
    },
    nextLesson,
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

  const { user, stats, nextLesson } = data;
  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);
  const progressPercent = calculateProgress(stats.completedLessons, stats.totalLessons);

  // Gamification data
  const totalXP = user.totalXP || 0;
  const level = getLevelFromXP(totalXP, ageBand);
  const xpProgress = getXPToNextLevel(totalXP, ageBand);
  const dailyChallenges = getDailyChallenges(ageBand);
  const completedChallengeIds = user.dailyChallengeProgress?.map((p) => p.challengeId) || [];

  const upcomingEvents = user.cohortMemberships.flatMap((m) => m.cohort.events);
  const upcomingSessions = user.mentorAssignmentsAsMentee.flatMap((a) => a.sessions);
  const mentor = user.mentorAssignmentsAsMentee[0]?.mentor;

  const portfolio = user.portfolios[0];

  // Age-specific greeting messages
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (ageBand === 'JUNIOR_FOUNDATIONS') {
      if (hour < 12) return "Good morning, superstar! 🌟";
      if (hour < 17) return "Hey there, champion! 🏆";
      return "Great evening, explorer! 🚀";
    }
    if (ageBand === 'TEEN_SKILLS') {
      if (hour < 12) return "What's up, " + user.firstName + "! 👋";
      if (hour < 17) return "Hey " + user.firstName + "! Ready to level up? 🎮";
      return "Evening, " + user.firstName + "! Let's crush some goals 💪";
    }
    return `Welcome back, ${user.firstName}`;
  };

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    if (stats.streak >= 7) return "You're on fire! 🔥 Keep that streak going!";
    if (progressPercent >= 75) return "Almost there! You're making incredible progress!";
    if (progressPercent >= 50) return "Halfway hero! Keep pushing forward!";
    if (progressPercent >= 25) return "Great start! You've got momentum!";
    if (stats.completedLessons > 0) return "You're on your way! Every lesson counts!";
    return "Ready to start your journey? Let's go!";
  };

  return (
    <div className="space-y-6">
      {/* Header with Level & XP */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">
            {getGreeting()}
          </h1>
          <p className="text-muted-foreground mt-1">
            {getMotivationalMessage()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="gold">{getAgeBandShortLabel(ageBand)}</Badge>
            <Badge variant="secondary" className="gap-1">
              <Trophy className="h-3 w-3" />
              Level {level.level} {level.title}
            </Badge>
          </div>
        </div>

        {/* XP & Level Card */}
        <Card className="w-full md:w-80 bg-gradient-to-br from-ascent-navy to-ascent-navy/80 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg`}>
                <span className="text-xl font-bold">{level.level}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{level.title}</span>
                  <span className="text-sm text-white/70">{totalXP.toLocaleString()} XP</span>
                </div>
                <Progress value={xpProgress.progress} className="h-2 mt-2 bg-white/20" />
                <p className="text-xs text-white/60 mt-1">
                  {xpProgress.required - xpProgress.current} XP to Level {level.level + 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {/* Streak */}
        <Card className={`${stats.streak >= 3 ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' : ''}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stats.streak >= 3 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-muted'}`}>
                <Flame className={`h-5 w-5 ${stats.streak >= 3 ? 'text-white' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedLessons}</p>
                <p className="text-xs text-muted-foreground">Lessons Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBadges}</p>
                <p className="text-xs text-muted-foreground">Badges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">#{stats.leaderboardPosition || '-'}</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Challenges */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <CardTitle className="text-white text-lg">Daily Challenges</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {completedChallengeIds.length}/{dailyChallenges.length} done
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {dailyChallenges.map((challenge) => {
              const isCompleted = completedChallengeIds.includes(challenge.id);
              return (
                <div
                  key={challenge.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : 'bg-gradient-to-br from-purple-400 to-indigo-500'
                  }`}>
                    {isCompleted ? (
                      <Star className="h-5 w-5 text-white" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {challenge.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{challenge.description}</p>
                  </div>
                  <Badge variant={isCompleted ? 'success' : 'secondary'}>
                    +{challenge.xp} XP
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Continue Learning / Next Lesson */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-ascent-navy to-blue-600 text-white">
            <CardTitle className="text-white flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              {nextLesson ? 'Continue Your Journey' : 'Start Learning'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {nextLesson ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Next up</p>
                  <h3 className="font-semibold text-lg">{nextLesson.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {nextLesson.module.track.name} • {nextLesson.module.name}
                  </p>
                  <Button className="w-full mt-4 gap-2" asChild>
                    <Link href={`/dashboard/learning/${nextLesson.module.track.slug}/${nextLesson.module.slug}/${nextLesson.slug}`}>
                      <Play className="h-4 w-4" />
                      Start Lesson
                    </Link>
                  </Button>
                </div>

                {/* Recent Progress */}
                {user.lessonProgress.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Recently Completed</p>
                    <div className="space-y-2">
                      {user.lessonProgress.slice(0, 2).map((progress) => (
                        <div key={progress.id} className="flex items-center gap-3 text-sm">
                          <Star className="h-4 w-4 text-green-500" />
                          <span className="truncate flex-1">{progress.lesson.title}</span>
                          <span className="text-muted-foreground">+50 XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Your learning adventure awaits!
                </p>
                <Button asChild>
                  <Link href="/dashboard/learning">
                    Explore Tracks
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Badges & Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Your Achievements
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/badges">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {user.badges.length > 0 ? (
              <div className="grid grid-cols-4 gap-4">
                {user.badges.map((ub) => (
                  <div key={ub.id} className="text-center">
                    <div className="h-14 w-14 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-xs font-medium mt-2 truncate">{ub.badge.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Complete lessons and quizzes to earn badges!
                </p>
              </div>
            )}

            {/* Progress to next badge hint */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">🎯 Next badge:</span>{' '}
                Complete {5 - Math.min(stats.completedLessons, 5)} more lessons to earn "Quick Learner"!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid - Events & Mentor */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex flex-col items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-ascent-navy">
                        {new Date(event.startTime).getDate()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming events</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentor Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Mentor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mentor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={mentor.avatarUrl || undefined} />
                    <AvatarFallback className="bg-ascent-navy text-white text-lg">
                      {mentor.firstName[0]}{mentor.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{mentor.firstName} {mentor.lastName}</p>
                    <p className="text-sm text-muted-foreground">{mentor.email}</p>
                  </div>
                </div>
                {upcomingSessions.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Next session: {new Date(upcomingSessions[0].scheduledAt!).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/mentorship">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    View Mentorship Hub
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No mentor assigned yet</p>
                <p className="text-sm">Check back soon!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Curriculum Completion</span>
                <span className="font-bold">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-4" />
              <p className="text-sm text-muted-foreground mt-2">
                {stats.completedLessons} of {stats.totalLessons} lessons completed
              </p>
            </div>
            <div className="text-center px-6 border-l">
              <p className="text-3xl font-bold text-ascent-navy">{progressPercent}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
