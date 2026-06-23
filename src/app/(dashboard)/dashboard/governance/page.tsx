import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Scale,
  Users,
  Calendar,
  FileText,
  Plus,
  ChevronRight,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

async function getGovernanceData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      governanceExercises: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      lessonProgress: {
        where: {
          lesson: {
            module: {
              track: {
                slug: 'family-governance',
              },
            },
          },
          completedAt: { not: null },
        },
      },
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  // Check if user is eligible for governance track (18+)
  const isEligible = ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'].includes(ageBand);

  // Get governance track progress
  const governanceTrack = await prisma.track.findUnique({
    where: { slug: 'family-governance' },
    include: {
      modules: {
        include: {
          lessons: {
            where: { isPublished: true },
          },
        },
      },
    },
  });

  const totalLessons = governanceTrack?.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  ) || 0;
  const completedLessons = user.lessonProgress.length;

  return {
    user,
    exercises: user.governanceExercises,
    ageBand,
    isEligible,
    trackProgress: {
      completed: completedLessons,
      total: totalLessons,
      percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
    },
  };
}

function GovernanceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function GovernancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<GovernanceSkeleton />}>
      <GovernanceContent userId={user.id} />
    </Suspense>
  );
}

async function GovernanceContent({ userId }: { userId: string }) {
  const data = await getGovernanceData(userId);

  if (!data) {
    redirect('/login');
  }

  const { exercises, ageBand, isEligible, trackProgress } = data;

  if (!isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Family Governance</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Family Governance track is available for members ages 18 and up.
              Continue your learning journey to unlock this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Categorize exercises
  const conflictExercises = exercises.filter((e) => e.type === 'conflict_resolution');
  const meetingExercises = exercises.filter((e) => e.type === 'meeting_simulation');
  const scenarioExercises = exercises.filter((e) => e.type === 'scenario');

  const completedExercises = exercises.filter((e) => e.mentorSignoff);
  const pendingExercises = exercises.filter((e) => e.submittedAt && !e.mentorSignoff);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Family Governance & Stewardship</h1>
        <p className="text-muted-foreground mt-1">
          Learn the principles and practices of family governance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackProgress.percentage}%</div>
            <Progress value={trackProgress.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {trackProgress.completed} of {trackProgress.total} lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercises Done</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedExercises.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingExercises.length} awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scenarios</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scenarioExercises.length}</div>
            <p className="text-xs text-muted-foreground">
              Practice scenarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meeting Sims</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingExercises.length}</div>
            <p className="text-xs text-muted-foreground">
              Completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Governance Basics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Governance Basics
            </CardTitle>
            <CardDescription>
              Learn the foundational concepts of family governance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Course Progress</span>
                <span className="text-sm font-medium">{trackProgress.percentage}%</span>
              </div>
              <Progress value={trackProgress.percentage} />
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/learning/family-governance">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Continue Course
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/dashboard/resources/glossary?category=Governance">
                    <FileText className="mr-2 h-4 w-4" />
                    Governance Glossary
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conflict Resolution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Conflict Resolution Practice
                </CardTitle>
                <CardDescription>
                  Work through practice scenarios for family conflicts
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {conflictExercises.length > 0 ? (
              <div className="space-y-3">
                {conflictExercises.slice(0, 2).map((exercise) => (
                  <div key={exercise.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      exercise.mentorSignoff ? 'bg-green-100' :
                      exercise.submittedAt ? 'bg-yellow-100' :
                      'bg-gray-100'
                    }`}>
                      {exercise.mentorSignoff ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : exercise.submittedAt ? (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{exercise.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.mentorSignoff ? 'Completed' :
                         exercise.submittedAt ? 'Awaiting review' :
                         'In progress'}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/governance/scenarios">
                    View All Scenarios
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Practice resolving common family governance challenges
                </p>
                <Button asChild>
                  <Link href="/dashboard/governance/scenarios/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Scenario
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Meeting Kit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Family Meeting Kit
            </CardTitle>
            <CardDescription>
              Templates and tools for effective family meetings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/resources/templates?type=meeting_agenda">
                  <FileText className="mr-2 h-4 w-4" />
                  Meeting Agenda Template
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/governance/meetings/checklist">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Pre-Meeting Checklist
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/governance/meetings/facilitator">
                  <Users className="mr-2 h-4 w-4" />
                  Facilitator Guide
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/governance/meetings/minutes">
                  <FileText className="mr-2 h-4 w-4" />
                  Minutes Template
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Simulation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Meeting Simulation
                </CardTitle>
                <CardDescription>
                  Practice facilitating family meetings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {meetingExercises.length > 0 ? (
              <div className="space-y-3">
                {meetingExercises.slice(0, 2).map((exercise) => (
                  <div key={exercise.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{exercise.title}</h4>
                      <Badge variant={exercise.mentorSignoff ? 'success' : 'warning'}>
                        {exercise.mentorSignoff ? 'Signed off' : 'Pending'}
                      </Badge>
                    </div>
                    {exercise.feedback && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        Feedback: {exercise.feedback}
                      </p>
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/governance/meetings">
                    View All
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Practice running a family meeting with feedback from your mentor
                </p>
                <Button asChild>
                  <Link href="/dashboard/governance/meetings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Simulation
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
