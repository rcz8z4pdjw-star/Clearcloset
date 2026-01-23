import { Suspense } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatRelativeTime, getAgeBand, getAgeBandShortLabel } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Award,
  Video,
  FileText,
  Plus,
} from 'lucide-react';

async function getMentorData(userId: string) {
  // Get mentor's mentees
  const assignments = await prisma.mentorAssignment.findMany({
    where: {
      mentorId: userId,
      isActive: true,
    },
    include: {
      mentee: {
        include: {
          roles: true,
          lessonProgress: {
            where: { completedAt: { not: null } },
          },
          badges: {
            include: { badge: true },
            orderBy: { awardedAt: 'desc' },
            take: 3,
          },
          quizAttempts: {
            where: { passed: true },
          },
        },
      },
    },
  });

  // Get upcoming sessions
  const upcomingSessions = await prisma.mentorshipSession.findMany({
    where: {
      mentorId: userId,
      status: { in: ['SCHEDULED', 'REQUESTED'] },
      scheduledAt: { gte: new Date() },
    },
    include: {
      mentee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
  });

  // Get pending session requests
  const pendingRequests = await prisma.mentorshipSession.findMany({
    where: {
      mentorId: userId,
      status: 'REQUESTED',
    },
    include: {
      mentee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get recent completed sessions
  const recentSessions = await prisma.mentorshipSession.findMany({
    where: {
      mentorId: userId,
      status: 'COMPLETED',
    },
    include: {
      mentee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  // Get total lessons for progress calculation
  const totalLessons = await prisma.lesson.count({
    where: { isPublished: true },
  });

  // Stats
  const totalMentees = assignments.length;
  const totalSessionsCompleted = await prisma.mentorshipSession.count({
    where: {
      mentorId: userId,
      status: 'COMPLETED',
    },
  });
  const totalSessionsThisMonth = await prisma.mentorshipSession.count({
    where: {
      mentorId: userId,
      status: 'COMPLETED',
      completedAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  return {
    assignments,
    upcomingSessions,
    pendingRequests,
    recentSessions,
    totalLessons,
    stats: {
      totalMentees,
      totalSessionsCompleted,
      totalSessionsThisMonth,
      pendingRequestsCount: pendingRequests.length,
    },
  };
}

function MentorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function MentorDashboardPage() {
  const user = await requireRole(['MENTOR', 'CIO', 'PROGRAM_DIRECTOR']);

  return (
    <Suspense fallback={<MentorSkeleton />}>
      <MentorDashboardContent userId={user.id} />
    </Suspense>
  );
}

async function MentorDashboardContent({ userId }: { userId: string }) {
  const data = await getMentorData(userId);

  const {
    assignments,
    upcomingSessions,
    pendingRequests,
    recentSessions,
    totalLessons,
    stats,
  } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your mentees and track their progress
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/mentor/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            Schedule Session
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-ascent-navy" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMentees}</p>
                <p className="text-sm text-muted-foreground">Active Mentees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessionsCompleted}</p>
                <p className="text-sm text-muted-foreground">Sessions Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSessionsThisMonth}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pendingRequestsCount > 0 ? 'border-orange-300' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingRequestsCount}</p>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending Session Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.mentee.avatarUrl || undefined} />
                      <AvatarFallback>
                        {request.mentee.firstName[0]}
                        {request.mentee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {request.mentee.firstName} {request.mentee.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested {formatRelativeTime(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Decline
                    </Button>
                    <Button size="sm">Schedule</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="mentees" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mentees" className="gap-2">
            <Users className="h-4 w-4" />
            My Mentees
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Mentees Tab */}
        <TabsContent value="mentees" className="space-y-6">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Mentees Assigned</h3>
                <p className="text-muted-foreground">
                  You don't have any mentees assigned yet. Check with your program director.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {assignments.map((assignment) => {
                const mentee = assignment.mentee;
                const ageBand = getAgeBand(mentee.dateOfBirth, mentee.ageBandOverride);
                const completedLessons = mentee.lessonProgress.length;
                const progress =
                  totalLessons > 0
                    ? Math.round((completedLessons / totalLessons) * 100)
                    : 0;

                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={mentee.avatarUrl || undefined} />
                            <AvatarFallback className="bg-ascent-navy text-white">
                              {mentee.firstName[0]}
                              {mentee.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {mentee.firstName} {mentee.lastName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {getAgeBandShortLabel(ageBand)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Since {formatDate(assignment.assignedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/mentor/mentee/${mentee.id}`}>
                            View Profile
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Learning Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-lg font-bold text-ascent-navy">
                            {completedLessons}
                          </p>
                          <p className="text-xs text-muted-foreground">Lessons</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-lg font-bold text-ascent-gold">
                            {mentee.badges.length}
                          </p>
                          <p className="text-xs text-muted-foreground">Badges</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <p className="text-lg font-bold text-green-600">
                            {mentee.quizAttempts.length}
                          </p>
                          <p className="text-xs text-muted-foreground">Quizzes</p>
                        </div>
                      </div>

                      {/* Recent Badges */}
                      {mentee.badges.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Recent Achievements
                          </p>
                          <div className="flex gap-2">
                            {mentee.badges.map((ub) => (
                              <div
                                key={ub.id}
                                className="flex items-center gap-1 px-2 py-1 bg-ascent-gold/10 rounded text-xs"
                                title={ub.badge.name}
                              >
                                <Award className="h-3 w-3 text-ascent-gold" />
                                {ub.badge.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/mentor/sessions/new?mentee=${mentee.id}`}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <Link href={`/dashboard/mentor/notes/${mentee.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            Notes
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No upcoming sessions</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="h-12 w-12 rounded-lg bg-blue-100 flex flex-col items-center justify-center text-blue-600">
                          <span className="text-xs">
                            {new Date(session.scheduledAt!).toLocaleDateString('en-US', {
                              month: 'short',
                            })}
                          </span>
                          <span className="text-lg font-bold">
                            {new Date(session.scheduledAt!).getDate()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {session.mentee.firstName} {session.mentee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.scheduledAt!).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {session.duration && ` · ${session.duration} min`}
                          </p>
                        </div>
                        <Badge variant={session.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No completed sessions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <Avatar>
                          <AvatarImage src={session.mentee.avatarUrl || undefined} />
                          <AvatarFallback>
                            {session.mentee.firstName[0]}
                            {session.mentee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {session.mentee.firstName} {session.mentee.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(session.completedAt!)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/mentor/sessions/${session.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
