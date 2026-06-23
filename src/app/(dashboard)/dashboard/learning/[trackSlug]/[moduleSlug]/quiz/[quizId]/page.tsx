import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Award,
} from 'lucide-react';
import { QuizInterface } from './quiz-interface';

async function getQuizData(quizId: string, userId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { sortOrder: 'asc' },
        include: {
          choices: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      module: {
        include: {
          track: true,
        },
      },
    },
  });

  if (!quiz || !quiz.isPublished) return null;

  // Get attempt count and history
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      quizId,
    },
    orderBy: { completedAt: 'desc' },
  });

  const attemptCount = attempts.length;
  const canAttempt = attemptCount < quiz.maxAttempts;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const hasPassed = attempts.some((a) => a.passed);

  return {
    quiz,
    attemptCount,
    canAttempt,
    bestScore,
    hasPassed,
    attempts,
  };
}

function QuizSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-[400px]" />
    </div>
  );
}

export default async function QuizPage({
  params,
}: {
  params: { trackSlug: string; moduleSlug: string; quizId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizContent
        trackSlug={params.trackSlug}
        moduleSlug={params.moduleSlug}
        quizId={params.quizId}
        userId={user.id}
      />
    </Suspense>
  );
}

async function QuizContent({
  trackSlug,
  moduleSlug,
  quizId,
  userId,
}: {
  trackSlug: string;
  moduleSlug: string;
  quizId: string;
  userId: string;
}) {
  const data = await getQuizData(quizId, userId);

  if (!data) {
    notFound();
  }

  const { quiz, attemptCount, canAttempt, bestScore, hasPassed, attempts } = data;

  // Sanitize questions for client (remove correct answer flags)
  const sanitizedQuestions = quiz.questions.map((q) => ({
    id: q.id,
    text: q.text,
    explanation: null, // Don't send until after submission
    points: q.points,
    sortOrder: q.sortOrder,
    choices: q.choices.map((c) => ({
      id: c.id,
      text: c.text,
      sortOrder: c.sortOrder,
    })),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/dashboard/learning" className="hover:text-foreground">
          Learning Hub
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/dashboard/learning/${trackSlug}`} className="hover:text-foreground">
          {quiz.module.track.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{quiz.module.name}</span>
      </nav>

      {/* Quiz Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="gold" className="gap-1">
            <HelpCircle className="h-3 w-3" />
            Quiz
          </Badge>
          {hasPassed && (
            <Badge variant="success" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Passed
            </Badge>
          )}
        </div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground mt-2">{quiz.description}</p>
        )}
      </div>

      {/* Quiz Info */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-ascent-navy">{quiz.questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ascent-gold">{quiz.passingScore}%</p>
              <p className="text-sm text-muted-foreground">To Pass</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {attemptCount}/{quiz.maxAttempts}
              </p>
              <p className="text-sm text-muted-foreground">Attempts Used</p>
            </div>
            {bestScore !== null && (
              <div>
                <p className="text-2xl font-bold text-ascent-navy">{Math.round(bestScore)}%</p>
                <p className="text-sm text-muted-foreground">Best Score</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Previous Attempts */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attempts.slice(0, 3).map((attempt, index) => (
                <div
                  key={attempt.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    attempt.passed ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {attempt.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">Attempt {attempts.length - index}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(attempt.completedAt!).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{Math.round(attempt.score)}%</p>
                    <Badge variant={attempt.passed ? 'success' : 'secondary'}>
                      {attempt.passed ? 'Passed' : 'Not Passed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Content or No More Attempts */}
      {!canAttempt ? (
        <Alert variant={hasPassed ? 'default' : 'destructive'}>
          {hasPassed ? (
            <Award className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {hasPassed ? 'Congratulations!' : 'Maximum Attempts Reached'}
          </AlertTitle>
          <AlertDescription>
            {hasPassed
              ? `You've passed this quiz with a best score of ${Math.round(bestScore!)}%. Great work!`
              : `You've used all ${quiz.maxAttempts} attempts. Contact your mentor if you need additional attempts.`}
          </AlertDescription>
        </Alert>
      ) : (
        <QuizInterface
          quizId={quiz.id}
          questions={sanitizedQuestions}
          shuffleQuestions={quiz.shuffleQuestions}
          showCorrectAnswers={quiz.showCorrectAnswers}
          passingScore={quiz.passingScore}
          trackSlug={trackSlug}
          moduleSlug={moduleSlug}
        />
      )}

      {/* Back to Module */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/learning/${trackSlug}`}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Track
          </Link>
        </Button>
      </div>
    </div>
  );
}
