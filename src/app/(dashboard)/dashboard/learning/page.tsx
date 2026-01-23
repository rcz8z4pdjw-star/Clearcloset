import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAgeBand, calculateProgress } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, Award, ChevronRight, Lock } from 'lucide-react';

async function getTracksData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  // Get all published tracks with their modules and user progress
  const tracks = await prisma.track.findMany({
    where: {
      isPublished: true,
    },
    include: {
      ageBands: true,
      modules: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
          },
          quizzes: {
            where: { isPublished: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  // Get user's lesson progress
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      completedAt: { not: null },
    },
    select: { lessonId: true },
  });

  const completedLessonIds = new Set(lessonProgress.map((p) => p.lessonId));

  // Calculate progress for each track
  const tracksWithProgress = tracks.map((track) => {
    const isEligible = track.ageBands.some((ab) => ab.type === ageBand);
    const totalLessons = track.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = track.modules.reduce(
      (sum, m) => sum + m.lessons.filter((l) => completedLessonIds.has(l.id)).length,
      0
    );

    return {
      ...track,
      isEligible,
      totalLessons,
      completedLessons,
      progressPercent: calculateProgress(completedLessons, totalLessons),
    };
  });

  return {
    tracks: tracksWithProgress,
    ageBand,
  };
}

function TracksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}

export default async function LearningHubPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<TracksSkeleton />}>
      <LearningHubContent userId={user.id} />
    </Suspense>
  );
}

async function LearningHubContent({ userId }: { userId: string }) {
  const data = await getTracksData(userId);

  if (!data) {
    redirect('/login');
  }

  const { tracks, ageBand } = data;

  // Separate eligible and locked tracks
  const eligibleTracks = tracks.filter((t) => t.isEligible);
  const lockedTracks = tracks.filter((t) => !t.isEligible);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Learning Hub</h1>
        <p className="text-muted-foreground mt-1">
          Explore tracks and modules tailored to your journey
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-ascent-navy">
                {tracks.reduce((sum, t) => sum + t.completedLessons, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Lessons Completed</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-ascent-navy">
                {eligibleTracks.length}
              </p>
              <p className="text-sm text-muted-foreground">Available Tracks</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-ascent-navy">
                {eligibleTracks.filter((t) => t.progressPercent === 100).length}
              </p>
              <p className="text-sm text-muted-foreground">Tracks Completed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Tracks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Tracks</h2>
        {eligibleTracks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {eligibleTracks.map((track) => (
              <Link key={track.id} href={`/dashboard/learning/${track.slug}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                        <BookOpen className="h-6 w-6 text-ascent-navy" />
                      </div>
                      {track.progressPercent === 100 && (
                        <Badge variant="success">Completed</Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{track.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {track.shortDescription || track.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{track.modules.length} modules</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{track.totalLessons} lessons</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{track.progressPercent}%</span>
                        </div>
                        <Progress value={track.progressPercent} />
                      </div>
                      <Button variant="outline" className="w-full">
                        {track.progressPercent > 0 ? 'Continue' : 'Start'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No tracks available for your current level yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Locked Tracks */}
      {lockedTracks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lockedTracks.map((track) => (
              <Card key={track.id} className="h-full opacity-60">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Badge variant="outline">
                      {track.ageBands.map((ab) => ab.name).join(', ')}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{track.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {track.shortDescription || track.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This track will be available when you reach the appropriate age band.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
