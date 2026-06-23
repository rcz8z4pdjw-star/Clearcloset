import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelativeTime, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  MessageSquare,
  Calendar,
  Plus,
  ChevronRight,
  Flag,
  Pin,
  Heart,
  MessageCircle,
} from 'lucide-react';

async function getCommunityData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      cohortMemberships: {
        include: {
          cohort: {
            include: {
              _count: {
                select: {
                  memberships: true,
                  posts: true,
                  events: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);
  const cohortIds = user.cohortMemberships.map((m) => m.cohortId);

  // Get recent posts from user's cohorts
  const recentPosts = await prisma.communityPost.findMany({
    where: {
      cohortId: { in: cohortIds },
      status: 'APPROVED',
    },
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      cohort: {
        select: {
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          comments: true,
          flags: true,
        },
      },
    },
    orderBy: [
      { isPinned: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 10,
  });

  // Get upcoming events from user's cohorts
  const upcomingEvents = await prisma.event.findMany({
    where: {
      cohortId: { in: cohortIds },
      startTime: { gte: new Date() },
    },
    include: {
      cohort: {
        select: {
          name: true,
          slug: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
          attendance: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  });

  return {
    user,
    cohorts: user.cohortMemberships.map((m) => m.cohort),
    recentPosts,
    upcomingEvents,
    ageBand,
  };
}

function CommunitySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function CommunityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<CommunitySkeleton />}>
      <CommunityContent userId={user.id} />
    </Suspense>
  );
}

async function CommunityContent({ userId }: { userId: string }) {
  const data = await getCommunityData(userId);

  if (!data) {
    redirect('/login');
  }

  const { cohorts, recentPosts, upcomingEvents, ageBand } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Community</h1>
          <p className="text-muted-foreground mt-1">
            Connect with peers in your cohorts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/community/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Cohorts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your Cohorts</h2>
        {cohorts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href={`/dashboard/community/cohorts/${cohort.slug}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{cohort.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {cohort.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {cohort._count.memberships} members
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {cohort._count.posts} posts
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                You haven't been assigned to any cohorts yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs for Posts and Events */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Recent Posts</TabsTrigger>
          <TabsTrigger value="events">Upcoming Events</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {!post.isAnonymous ? (
                        <Avatar>
                          <AvatarImage src={post.author.avatarUrl || undefined} />
                          <AvatarFallback className="bg-ascent-navy text-white">
                            {post.author.firstName[0]}{post.author.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar>
                          <AvatarFallback className="bg-muted">?</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {post.isPinned && (
                            <Pin className="h-4 w-4 text-ascent-gold" />
                          )}
                          <span className="font-medium">
                            {post.isAnonymous ? 'Anonymous' : `${post.author.firstName} ${post.author.lastName}`}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            in {post.cohort.name}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            · {formatRelativeTime(post.createdAt)}
                          </span>
                        </div>
                        {post.title && (
                          <h3 className="font-semibold mb-2">{post.title}</h3>
                        )}
                        <p className="text-muted-foreground line-clamp-3">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/community/posts/${post.id}`}>
                              <MessageCircle className="mr-1 h-4 w-4" />
                              {post._count.comments} comments
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No posts yet. Be the first to start a conversation!
                </p>
                <Button asChild>
                  <Link href="/dashboard/community/posts/new">
                    Create First Post
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-lg bg-ascent-navy/10 flex flex-col items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.startTime).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-xl font-bold text-ascent-navy">
                          {new Date(event.startTime).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant="secondary">{event.cohort?.name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(event.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {event.location && ` · ${event.location}`}
                        </p>
                        {event.description && (
                          <p className="text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-sm text-muted-foreground">
                            {event._count.rsvps} RSVPs
                          </span>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/community/events/${event.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No upcoming events scheduled.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
