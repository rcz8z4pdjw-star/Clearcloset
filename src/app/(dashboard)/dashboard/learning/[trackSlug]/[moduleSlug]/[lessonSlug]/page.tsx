import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDuration, getAgeBand } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Play,
  FileText,
  Download,
  BookOpen,
  Video,
  ExternalLink,
} from 'lucide-react';
import { MarkCompleteButton } from './mark-complete-button';

async function getLessonData(
  trackSlug: string,
  moduleSlug: string,
  lessonSlug: string,
  userId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      lessonProgress: true,
    },
  });

  if (!user) return null;

  const track = await prisma.track.findUnique({
    where: { slug: trackSlug },
  });

  if (!track || !track.isPublished) return null;

  const module = await prisma.module.findFirst({
    where: {
      slug: moduleSlug,
      trackId: track.id,
      isPublished: true,
    },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!module) return null;

  const lesson = await prisma.lesson.findFirst({
    where: {
      slug: lessonSlug,
      moduleId: module.id,
      isPublished: true,
    },
    include: {
      attachments: true,
      resources: {
        where: { isPublished: true },
      },
    },
  });

  if (!lesson) return null;

  // Get progress for this lesson
  const progress = user.lessonProgress.find((p) => p.lessonId === lesson.id);
  const isCompleted = progress?.completedAt !== null;

  // Find previous and next lessons
  const lessonIndex = module.lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessonIndex > 0 ? module.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < module.lessons.length - 1 ? module.lessons[lessonIndex + 1] : null;

  // Calculate module progress
  const completedLessonIds = new Set(
    user.lessonProgress.filter((p) => p.completedAt).map((p) => p.lessonId)
  );
  const moduleProgress = {
    completed: module.lessons.filter((l) => completedLessonIds.has(l.id)).length,
    total: module.lessons.length,
  };

  return {
    track,
    module,
    lesson,
    isCompleted,
    prevLesson,
    nextLesson,
    moduleProgress,
    currentLessonNumber: lessonIndex + 1,
  };
}

function LessonSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-[400px]" />
      <Skeleton className="h-24" />
    </div>
  );
}

export default async function LessonPage({
  params,
}: {
  params: { trackSlug: string; moduleSlug: string; lessonSlug: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<LessonSkeleton />}>
      <LessonContent
        trackSlug={params.trackSlug}
        moduleSlug={params.moduleSlug}
        lessonSlug={params.lessonSlug}
        userId={user.id}
      />
    </Suspense>
  );
}

async function LessonContent({
  trackSlug,
  moduleSlug,
  lessonSlug,
  userId,
}: {
  trackSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  userId: string;
}) {
  const data = await getLessonData(trackSlug, moduleSlug, lessonSlug, userId);

  if (!data) {
    notFound();
  }

  const {
    track,
    module,
    lesson,
    isCompleted,
    prevLesson,
    nextLesson,
    moduleProgress,
    currentLessonNumber,
  } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/dashboard/learning" className="hover:text-foreground">
          Learning Hub
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/dashboard/learning/${track.slug}`} className="hover:text-foreground">
          {track.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{module.name}</span>
      </nav>

      {/* Module Progress Bar */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-ascent-navy/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-ascent-navy" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{module.name}</p>
                <p className="text-sm font-medium">
                  Lesson {currentLessonNumber} of {moduleProgress.total}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Progress
                value={(moduleProgress.completed / moduleProgress.total) * 100}
                className="w-32 h-2"
              />
              <span className="text-sm text-muted-foreground">
                {moduleProgress.completed}/{moduleProgress.total}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {isCompleted && (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed
              </Badge>
            )}
            {lesson.videoUrl && (
              <Badge variant="outline" className="gap-1">
                <Video className="h-3 w-3" />
                Video Lesson
              </Badge>
            )}
            {lesson.duration && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(lesson.duration)}
              </Badge>
            )}
          </div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground mt-2">{lesson.description}</p>
          )}
        </div>
      </div>

      {/* Video Player */}
      {lesson.videoUrl && (
        <Card className="overflow-hidden">
          <div className="aspect-video bg-black relative">
            {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
              <iframe
                src={convertToEmbedUrl(lesson.videoUrl)}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : lesson.videoUrl.includes('vimeo.com') ? (
              <iframe
                src={convertVimeoToEmbed(lesson.videoUrl)}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={lesson.videoUrl}
                controls
                className="absolute inset-0 w-full h-full"
                poster={lesson.thumbnailUrl || undefined}
              />
            )}
          </div>
        </Card>
      )}

      {/* Lesson Content */}
      {lesson.content && (
        <Card>
          <CardContent className="pt-6">
            <div
              className="prose prose-slate max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lesson.resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-ascent-gold/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-ascent-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{resource.title}</p>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {resource.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {lesson.attachments && lesson.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {lesson.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  download
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{attachment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation & Complete Button */}
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link
                href={`/dashboard/learning/${track.slug}/${module.slug}/${prevLesson.slug}`}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous Lesson
              </Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/learning/${track.slug}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Track
              </Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isCompleted && (
            <MarkCompleteButton lessonId={lesson.id} />
          )}

          {nextLesson ? (
            <Button asChild>
              <Link
                href={`/dashboard/learning/${track.slug}/${module.slug}/${nextLesson.slug}`}
              >
                Next Lesson
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/dashboard/learning/${track.slug}`}>
                Complete Module
                <CheckCircle className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function convertToEmbedUrl(url: string): string {
  // Convert YouTube URL to embed URL
  const youtubeRegex =
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(youtubeRegex);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return url;
}

function convertVimeoToEmbed(url: string): string {
  // Convert Vimeo URL to embed URL
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const match = url.match(vimeoRegex);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return url;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
