import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, getAgeBand, getAgeBandShortLabel, calculateProgress } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Award,
  Calendar,
  TrendingUp,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

async function getHouseholdData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      householdMemberships: {
        include: {
          household: {
            include: {
              members: {
                include: {
                  user: {
                    include: {
                      roles: true,
                      badges: {
                        orderBy: { awardedAt: 'desc' },
                        take: 3,
                        include: { badge: true },
                      },
                      lessonProgress: {
                        where: { completedAt: { not: null } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const isParent = user.roles.some((r) => r.role === 'PARENT');
  const households = user.householdMemberships.map((m) => m.household);

  // Get upcoming events for household members
  const householdUserIds = households.flatMap((h) =>
    h.members.map((m) => m.userId)
  );

  const upcomingEvents = await prisma.event.findMany({
    where: {
      startTime: { gte: new Date() },
      cohort: {
        memberships: {
          some: {
            userId: { in: householdUserIds },
          },
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
    include: {
      cohort: true,
    },
  });

  // Get total lessons for progress calculation
  const totalLessons = await prisma.lesson.count({
    where: { isPublished: true },
  });

  return {
    user,
    households,
    upcomingEvents,
    totalLessons,
    isParent,
  };
}

function HouseholdSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default async function HouseholdPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<HouseholdSkeleton />}>
      <HouseholdContent userId={user.id} />
    </Suspense>
  );
}

async function HouseholdContent({ userId }: { userId: string }) {
  const data = await getHouseholdData(userId);

  if (!data) {
    redirect('/login');
  }

  const { households, upcomingEvents, totalLessons, isParent } = data;

  if (households.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Household</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Household Assigned</h3>
            <p className="text-muted-foreground">
              You haven't been assigned to a household yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">
          {isParent ? 'Family Dashboard' : 'Household'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isParent
            ? 'View your family members\' progress and milestones'
            : 'Your family on the platform'}
        </p>
      </div>

      {/* Privacy Notice for Parents */}
      {isParent && (
        <Card className="border-ascent-gold/50 bg-ascent-cream/30">
          <CardContent className="flex items-start gap-4 py-4">
            <Lock className="h-5 w-5 text-ascent-gold mt-0.5" />
            <div>
              <p className="font-medium text-sm">Privacy-Protected View</p>
              <p className="text-sm text-muted-foreground">
                You can see progress percentages, milestones, and badges. Private reflections
                and detailed session notes are only visible if explicitly shared by your family member.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {households.map((household) => (
        <div key={household.id} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{household.name}</CardTitle>
              {household.description && (
                <CardDescription>{household.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {household.members.map((membership) => {
                  const member = membership.user;
                  const ageBand = getAgeBand(member.dateOfBirth, member.ageBandOverride);
                  const completedLessons = member.lessonProgress.length;
                  const progressPercent = calculateProgress(completedLessons, totalLessons);
                  const isMemberRole = member.roles.some((r) => r.role === 'MEMBER');

                  return (
                    <Card key={member.id} className="overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatarUrl || undefined} />
                            <AvatarFallback className="bg-ascent-navy text-white">
                              {member.firstName[0]}{member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">
                                {member.firstName} {member.lastName}
                              </p>
                              {membership.isPrimary && (
                                <Badge variant="gold" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {isMemberRole && (
                                <Badge variant="secondary" className="text-xs">
                                  {getAgeBandShortLabel(ageBand)}
                                </Badge>
                              )}
                              {member.roles.map((r) => (
                                <Badge key={r.id} variant="outline" className="text-xs capitalize">
                                  {r.role.toLowerCase()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Progress for Members (visible to parents) */}
                        {isMemberRole && isParent && (
                          <div className="mt-4 space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Learning Progress</span>
                                <span className="font-medium">{progressPercent}%</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>

                            {/* Recent Badges */}
                            {member.badges.length > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Recent Badges</p>
                                <div className="flex gap-2">
                                  {member.badges.map((ub) => (
                                    <div
                                      key={ub.id}
                                      className="h-8 w-8 rounded-full bg-ascent-gold/20 flex items-center justify-center"
                                      title={ub.badge.name}
                                    >
                                      <Award className="h-4 w-4 text-ascent-gold" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Private indicator */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <EyeOff className="h-3 w-3" />
                              <span>Private reflections hidden</span>
                            </div>
                          </div>
                        )}

                        {/* Self view - link to profile */}
                        {member.id === userId && (
                          <Button variant="outline" className="w-full mt-4" asChild>
                            <Link href="/dashboard/profile">
                              View My Profile
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Family Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
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
                      {event.cohort && ` · ${event.cohort.name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats for Parents */}
      {isParent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Family Progress Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {households.flatMap((h) => h.members).filter((m) =>
                m.user.roles.some((r) => r.role === 'MEMBER')
              ).length > 0 ? (
                <>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-ascent-navy">
                      {households.flatMap((h) => h.members).filter((m) =>
                        m.user.roles.some((r) => r.role === 'MEMBER')
                      ).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-ascent-gold">
                      {households.flatMap((h) =>
                        h.members.flatMap((m) => m.user.badges)
                      ).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Badges Earned</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-ascent-navy">
                      {upcomingEvents.length}
                    </p>
                    <p className="text-sm text-muted-foreground">Upcoming Events</p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground col-span-3 text-center py-4">
                  No member data to display
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
