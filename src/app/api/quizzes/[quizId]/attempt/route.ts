import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { notifyBadgeAwarded } from '@/lib/notifications';

// Get quiz for taking
export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
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

    if (!quiz || !quiz.isPublished) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check attempt count
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId: user.id,
        quizId: params.quizId,
      },
    });

    if (attemptCount >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum attempts reached' },
        { status: 403 }
      );
    }

    // Get previous attempts
    const previousAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        quizId: params.quizId,
      },
      orderBy: { completedAt: 'desc' },
    });

    // Shuffle questions if enabled
    let questions = quiz.questions;
    if (quiz.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Remove correct answer indicators for the response
    const sanitizedQuestions = questions.map((q) => ({
      ...q,
      choices: q.choices.map((c) => ({
        id: c.id,
        text: c.text,
        sortOrder: c.sortOrder,
        // Don't include isCorrect
      })),
    }));

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: sanitizedQuestions,
      },
      attemptNumber: attemptCount + 1,
      maxAttempts: quiz.maxAttempts,
      previousAttempts: previousAttempts.map((a) => ({
        id: a.id,
        score: a.score,
        passed: a.passed,
        completedAt: a.completedAt,
      })),
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

// Submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { answers, startedAt } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      );
    }

    // Get quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.quizId },
      include: {
        questions: {
          include: {
            choices: true,
          },
        },
        module: {
          include: {
            badges: true,
          },
        },
      },
    });

    if (!quiz || !quiz.isPublished) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Check attempt count
    const attemptCount = await prisma.quizAttempt.count({
      where: {
        userId: user.id,
        quizId: params.quizId,
      },
    });

    if (attemptCount >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: 'Maximum attempts reached' },
        { status: 403 }
      );
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    const results: Record<string, { correct: boolean; correctAnswerId: string }> = {};

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const selectedChoiceId = answers[question.id];
      const correctChoice = question.choices.find((c) => c.isCorrect);

      if (selectedChoiceId && correctChoice && selectedChoiceId === correctChoice.id) {
        earnedPoints += question.points;
        results[question.id] = { correct: true, correctAnswerId: correctChoice.id };
      } else {
        results[question.id] = {
          correct: false,
          correctAnswerId: correctChoice?.id || '',
        };
      }
    }

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= quiz.passingScore;

    // Create attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: params.quizId,
        score,
        passed,
        answers: answers,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        completedAt: new Date(),
      },
    });

    // Check for Quiz Master badge (5 passed quizzes with 80%+)
    if (passed && score >= 80) {
      const highScoreCount = await prisma.quizAttempt.count({
        where: {
          userId: user.id,
          passed: true,
          score: { gte: 80 },
        },
      });

      if (highScoreCount === 5) {
        const quizMasterBadge = await prisma.badge.findUnique({
          where: { slug: 'quiz-master' },
        });

        if (quizMasterBadge) {
          const existing = await prisma.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId: user.id,
                badgeId: quizMasterBadge.id,
              },
            },
          });

          if (!existing) {
            await prisma.userBadge.create({
              data: {
                userId: user.id,
                badgeId: quizMasterBadge.id,
              },
            });
            await notifyBadgeAwarded(user.id, quizMasterBadge.name);
          }
        }
      }
    }

    await createAuditLog({
      userId: user.id,
      action: 'COMPLETE_QUIZ',
      entityType: 'Quiz',
      entityId: params.quizId,
      newValues: {
        attemptId: attempt.id,
        score,
        passed,
      },
    });

    // Build response with explanations if showing correct answers is enabled
    const response: any = {
      attempt: {
        id: attempt.id,
        score,
        passed,
        completedAt: attempt.completedAt,
      },
      passingScore: quiz.passingScore,
    };

    if (quiz.showCorrectAnswers) {
      response.results = results;
      response.questions = quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        explanation: q.explanation,
        choices: q.choices.map((c) => ({
          id: c.id,
          text: c.text,
          isCorrect: c.isCorrect,
        })),
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    );
  }
}
