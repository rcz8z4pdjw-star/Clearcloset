import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Calendar,
  MessageSquare,
  CheckCircle,
  Clock,
  Target,
  ChevronRight,
  Plus,
} from 'lucide-react';

async function getMentorshipData(userId: string) {
  const assignments = await prisma.mentorAssignment.findMany({
    where: {
      menteeId: userId,
      isActive: true,
    },
    include: {
      mentor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          bio: true,
        },
      },
      sessions: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        include: {
          notes: {
            where: {
              OR: [
                { isPrivate: false },
                { authorId: userId },
              ],
            },
          },
        },
      },
      actionPlans: {
        orderBy: [{ isCompleted: 'asc' }, { dueDate: 'asc' }],
        include: {
          reminders: true,
        },
      },
    },
  });

  return { assignments };
}

function MentorshipSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-64" />
    </div>
  );
}

export default async function MentorshipPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<MentorshipSkeleton />}>
      <MentorshipContent userId={user.id} />
    </Suspense>
  );
}

async function MentorshipContent({ userId }: { userId: string }) {
  const data = await getMentorshipData(userId);
  const { assignments } = data;

  const assignment = assignments[0];
  const mentor = assignment?.mentor;
  const sessions = assignment?.sessions || [];
  const actionPlans = assignment?.actionPlans || [];

  const upcomingSessions = sessions.filter(
    (s) => s.status === 'SCHEDULED' && s.scheduledAt && new Date(s.scheduledAt) > new Date()
  );
  const pastSessions = sessions.filter(
    (s) => s.status === 'COMPLETED' || (s.scheduledAt && new Date(s.scheduledAt) <= new Date())
  );
  const pendingPlans = actionPlans.filter((p) => !p.isCompleted);
  const completedPlans = actionPlans.filter((p) => p.isCompleted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Mentorship</h1>
        <p className="text-muted-foreground mt-1">
          Connect with your mentor and track your progress
        </p>
      </div>

      {mentor ? (
        <>
          {/* Mentor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Mentor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={mentor.avatarUrl || undefined} />
                  <AvatarFallback className="bg-ascent-navy text-white text-lg">
                    {mentor.firstName[0]}{mentor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {mentor.firstName} {mentor.lastName}
                  </h3>
                  <p className="text-muted-foreground">{mentor.email}</p>
                  {mentor.bio && (
                    <p className="mt-2 text-sm">{mentor.bio}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/mentorship/sessions">
                      <Calendar className="mr-2 h-4 w-4" />
                      Sessions
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/dashboard/mentorship/sessions/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Request Session
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{upcomingSessions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pastSessions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingPlans.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{completedPlans.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sessions">
            <TabsList>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="plans">Action Plans</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Sessions</CardTitle>
                    <Button size="sm" asChild>
                      <Link href="/dashboard/mentorship/sessions/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Request Session
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {sessions.length > 0 ? (
                    <div className="space-y-4">
                      {sessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center gap-4 p-4 rounded-lg border"
                        >
                          <div className="h-10 w-10 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                            {session.status === 'COMPLETED' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : session.status === 'SCHEDULED' ? (
                              <Calendar className="h-5 w-5 text-ascent-navy" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {session.scheduledAt
                                  ? formatDate(session.scheduledAt)
                                  : 'To be scheduled'}
                              </span>
                              <Badge
                                variant={
                                  session.status === 'COMPLETED'
                                    ? 'success'
                                    : session.status === 'SCHEDULED'
                                    ? 'default'
                                    : 'warning'
                                }
                              >
                                {session.status.toLowerCase()}
                              </Badge>
                            </div>
                            {session.agenda && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {session.agenda}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/mentorship/sessions/${session.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No sessions yet</p>
                      <Button asChild>
                        <Link href="/dashboard/mentorship/sessions/new">
                          Request Your First Session
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Action Plans</CardTitle>
                  <CardDescription>
                    Tasks and goals from your mentorship sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {actionPlans.length > 0 ? (
                    <div className="space-y-4">
                      {actionPlans.map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-start gap-4 p-4 rounded-lg border"
                        >
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center ${
                              plan.isCompleted
                                ? 'bg-green-100 text-green-600'
                                : 'bg-ascent-navy/10 text-ascent-navy'
                            }`}
                          >
                            {plan.isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Target className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                plan.isCompleted ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {plan.title}
                            </p>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                              </p>
                            )}
                            {plan.dueDate && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Due: {formatDate(plan.dueDate)}
                              </p>
                            )}
                          </div>
                          {!plan.isCompleted && (
                            <Button variant="outline" size="sm">
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No action plans yet. They'll appear here after your sessions.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Mentor Assigned Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              A mentor will be assigned to guide you through your learning journey.
              Check back soon or contact the program team.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/community">
                Explore Community
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
