import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateXpReward } from '@/lib/gamification';

// Get quiz data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const lessonId = searchParams.get('lessonId');

    if (quizId) {
      // Get specific quiz
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            orderBy: { sortOrder: 'asc' },
          },
          lesson: {
            include: {
              module: {
                include: { track: true },
              },
            },
          },
        },
      });

      if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      // Check if user has previous attempts
      const previousAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          quizId: quiz.id,
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      });

      const bestScore = previousAttempts.length > 0
        ? Math.max(...previousAttempts.map((a) => a.score))
        : null;

      // Format questions (hide correct answers)
      const formattedQuestions = quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options as any[], // JSON field
        points: q.points,
      }));

      return NextResponse.json({
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
          xpReward: quiz.xpReward,
          lessonTitle: quiz.lesson?.title,
          trackName: quiz.lesson?.module?.track?.name,
        },
        questions: formattedQuestions,
        stats: {
          totalAttempts: previousAttempts.length,
          bestScore,
          passed: previousAttempts.some((a) => a.passed),
        },
      });
    }

    // Get quizzes for a lesson
    if (lessonId) {
      const quizzes = await prisma.quiz.findMany({
        where: { lessonId },
        select: {
          id: true,
          title: true,
          description: true,
          passingScore: true,
          xpReward: true,
          _count: {
            select: { questions: true },
          },
        },
      });

      return NextResponse.json({ quizzes });
    }

    // Get all available quizzes
    const quizzes = await prisma.quiz.findMany({
      include: {
        lesson: {
          include: {
            module: {
              include: { track: true },
            },
          },
        },
        _count: {
          select: { questions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Get quiz error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

// Submit quiz answers
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, answers, timeSpent } = body;

    if (!quizId || !answers) {
      return NextResponse.json(
        { error: 'Quiz ID and answers are required' },
        { status: 400 }
      );
    }

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    // Grade the quiz
    let totalPoints = 0;
    let earnedPoints = 0;
    const questionResults: any[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        earnedPoints += question.points;
      }

      questionResults.push({
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        explanation: question.explanation,
      });
    }

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= quiz.passingScore;

    // Calculate XP reward
    let xpEarned = 0;
    if (passed) {
      xpEarned = quiz.xpReward;
      // Bonus for perfect score
      if (score === 100) {
        xpEarned += Math.round(quiz.xpReward * 0.5);
      }
    }

    // Create quiz attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: user.id,
        quizId: quiz.id,
        score,
        passed,
        answers: answers as any,
        startedAt: new Date(Date.now() - (timeSpent * 1000)),
        completedAt: new Date(),
      },
    });

    // Update user XP if passed
    if (xpEarned > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: xpEarned } },
      });
    }

    // Update user activity for streak
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    });

    // Check for badge awards
    const badges = [];
    const totalQuizzesPassed = await prisma.quizAttempt.count({
      where: { userId: user.id, passed: true },
    });

    // Award badges based on milestones
    if (totalQuizzesPassed === 1) {
      badges.push({ name: 'First Quiz', description: 'Passed your first quiz!' });
    }
    if (totalQuizzesPassed === 10) {
      badges.push({ name: 'Quiz Pro', description: 'Passed 10 quizzes!' });
    }
    if (score === 100) {
      const perfectScores = await prisma.quizAttempt.count({
        where: { userId: user.id, score: 100 },
      });
      if (perfectScores === 5) {
        badges.push({ name: 'Perfectionist', description: '5 perfect quiz scores!' });
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        attemptId: attempt.id,
        score,
        passed,
        earnedPoints,
        totalPoints,
        xpEarned,
        questionResults,
        badges,
      },
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}

// Get quiz attempt history
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, quizId, attemptId } = body;

    if (action === 'get_history') {
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          ...(quizId && { quizId }),
        },
        include: {
          quiz: {
            select: {
              title: true,
              passingScore: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({ attempts });
    }

    if (action === 'get_attempt' && attemptId) {
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          quiz: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!attempt || attempt.userId !== user.id) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      return NextResponse.json({ attempt });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Quiz history error:', error);
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 });
  }
}
