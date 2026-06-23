import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDuration, getAgeBand, calculateProgress } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Lock,
  Play,
  FileText,
  HelpCircle,
  ChevronRight,
  Award,
} from 'lucide-react';

async function getTrackData(trackSlug: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      lessonProgress: {
        where: { completedAt: { not: null } },
      },
      quizAttempts: {
        where: { passed: true },
      },
      badges: {
        include: { badge: true },
      },
    },
  });

  if (!user) return null;

  const track = await prisma.track.findUnique({
    where: { slug: trackSlug },
    include: {
      ageBands: true,
      modules: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: 'asc' },
          },
          quizzes: {
            where: { isPublished: true },
          },
          exercises: {
            where: { isPublished: true },
          },
          badges: true,
          ageBands: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!track || !track.isPublished) return null;

  const userAgeBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);
  const completedLessonIds = new Set(user.lessonProgress.map((p) => p.lessonId));
  const passedQuizIds = new Set(user.quizAttempts.map((a) => a.quizId));

  // Calculate progress for each module
  const modulesWithProgress = track.modules.map((module) => {
    const totalLessons = module.lessons.length;
    const completedLessons = module.lessons.filter((l) => completedLessonIds.has(l.id)).length;
    const progress = calculateProgress(completedLessons, totalLessons);

    const totalQuizzes = module.quizzes.length;
    const passedQuizzes = module.quizzes.filter((q) => passedQuizIds.has(q.id)).length;

    // Check if module is locked based on prerequisites
    let isLocked = false;
    if (module.prerequisites && module.prerequisites.length > 0) {
      // Check if all prerequisite modules are completed
      // For simplicity, we'll check if all lessons in prerequisites are done
      isLocked = true; // Default to locked, unlock if prereqs met
    }

    return {
      ...module,
      progress,
      completedLessons,
      totalLessons,
      passedQuizzes,
      totalQuizzes,
      isLocked,
    };
  });

  // Calculate overall track progress
  const totalLessons = modulesWithProgress.reduce((sum, m) => sum + m.totalLessons, 0);
  const completedLessons = modulesWithProgress.reduce((sum, m) => sum + m.completedLessons, 0);
  const trackProgress = calculateProgress(completedLessons, totalLessons);

  return {
    user,
    track: {
      ...track,
      modules: modulesWithProgress,
    },
    trackProgress,
    totalLessons,
    completedLessons,
    userAgeBand,
    completedLessonIds,
  };
}

function TrackSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-24" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default async function TrackDetailPage({
  params,
}: {
  params: { trackSlug: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<TrackSkeleton />}>
      <TrackContent trackSlug={params.trackSlug} userId={user.id} />
    </Suspense>
  );
}

async function TrackContent({
  trackSlug,
  userId,
}: {
  trackSlug: string;
  userId: string;
}) {
  const data = await getTrackData(trackSlug, userId);

  if (!data) {
    notFound();
  }

  const { track, trackProgress, totalLessons, completedLessons, completedLessonIds } = data;

  // Find the next lesson to continue
  let nextLesson: { moduleSlug: string; lessonSlug: string } | null = null;
  for (const module of track.modules) {
    if (module.isLocked) continue;
    for (const lesson of module.lessons) {
      if (!completedLessonIds.has(lesson.id)) {
        nextLesson = { moduleSlug: module.slug, lessonSlug: lesson.slug };
        break;
      }
    }
    if (nextLesson) break;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/learning" className="hover:text-foreground">
          Learning Hub
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{track.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">
            {track.name}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {track.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {track.ageBands.map((ab) => (
              <Badge key={ab.id} variant="secondary">
                {ab.name}
              </Badge>
            ))}
          </div>
        </div>
        {nextLesson && (
          <Button asChild>
            <Link
              href={`/dashboard/learning/${track.slug}/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`}
            >
              <Play className="mr-2 h-4 w-4" />
              {completedLessons > 0 ? 'Continue' : 'Start Learning'}
            </Link>
          </Button>
        )}
      </div>

      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Track Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completedLessons} of {totalLessons} lessons
                </span>
              </div>
              <Progress value={trackProgress} className="h-3" />
            </div>
            <div className="text-center px-6 border-l">
              <p className="text-3xl font-bold text-ascent-navy">{trackProgress}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
            <div className="text-center px-6 border-l">
              <p className="text-3xl font-bold text-ascent-gold">{track.modules.length}</p>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modules</h2>
        <Accordion type="multiple" className="space-y-4">
          {track.modules.map((module, index) => (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-6 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-4 text-left flex-1">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      module.progress === 100
                        ? 'bg-green-100'
                        : module.isLocked
                        ? 'bg-gray-100'
                        : 'bg-ascent-navy/10'
                    }`}
                  >
                    {module.progress === 100 ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : module.isLocked ? (
                      <Lock className="h-5 w-5 text-gray-400" />
                    ) : (
                      <span className="font-semibold text-ascent-navy">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{module.name}</h3>
                      {module.progress === 100 && (
                        <Badge variant="success">Complete</Badge>
                      )}
                      {module.isLocked && (
                        <Badge variant="secondary">Locked</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {module.totalLessons} lessons
                      {module.totalQuizzes > 0 && ` · ${module.totalQuizzes} quiz`}
                      {module.exercises.length > 0 && ` · ${module.exercises.length} exercises`}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium">{module.progress}%</p>
                    <Progress value={module.progress} className="w-24 h-2" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4">
                <div className="pt-4 space-y-2">
                  {module.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {module.description}
                    </p>
                  )}

                  {/* Lessons */}
                  {module.lessons.map((lesson) => {
                    const isCompleted = completedLessonIds.has(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={
                          module.isLocked
                            ? '#'
                            : `/dashboard/learning/${track.slug}/${module.slug}/${lesson.slug}`
                        }
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          module.isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : 'bg-muted'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                        {lesson.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDuration(lesson.duration)}
                          </div>
                        )}
                        {lesson.videoUrl && (
                          <Badge variant="outline" className="text-xs">
                            Video
                          </Badge>
                        )}
                      </Link>
                    );
                  })}

                  {/* Quizzes */}
                  {module.quizzes.map((quiz) => (
                    <Link
                      key={quiz.id}
                      href={
                        module.isLocked
                          ? '#'
                          : `/dashboard/learning/${track.slug}/${module.slug}/quiz/${quiz.id}`
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border border-dashed ${
                        module.isLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-ascent-gold/20 flex items-center justify-center">
                        <HelpCircle className="h-4 w-4 text-ascent-gold" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {quiz.passingScore}% to pass · {quiz.maxAttempts} attempts
                        </p>
                      </div>
                      <Badge variant="gold">Quiz</Badge>
                    </Link>
                  ))}

                  {/* Exercises */}
                  {module.exercises.map((exercise) => (
                    <Link
                      key={exercise.id}
                      href={
                        module.isLocked
                          ? '#'
                          : `/dashboard/learning/${track.slug}/${module.slug}/exercise/${exercise.id}`
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border border-dashed ${
                        module.isLocked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{exercise.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {exercise.description}
                        </p>
                      </div>
                      <Badge variant="outline">Exercise</Badge>
                    </Link>
                  ))}

                  {/* Module Badges */}
                  {module.badges.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-ascent-gold" />
                        Badges Available
                      </p>
                      <div className="flex gap-2">
                        {module.badges.map((badge) => (
                          <div
                            key={badge.id}
                            className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm"
                          >
                            <Award className="h-3 w-3 text-ascent-gold" />
                            {badge.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
