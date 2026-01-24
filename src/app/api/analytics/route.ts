import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get XP logs for period
    const xpLogs = await prisma.xPLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get lesson completions
    const lessonCompletions = await prisma.lessonProgress.findMany({
      where: {
        usedId: user.id,
        completedAt: { gte: startDate },
      },
      include: {
        lesson: {
          include: {
            module: {
              include: { track: true },
            },
          },
        },
      },
      orderBy: { completedAt: 'asc' },
    });

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        completedAt: { gte: startDate },
      },
      include: { quiz: true },
      orderBy: { completedAt: 'asc' },
    });

    // Get badges earned
    const badgesEarned = await prisma.userBadge.findMany({
      where: {
        userId: user.id,
        awardedAt: { gte: startDate },
      },
      include: { badge: true },
      orderBy: { awardedAt: 'asc' },
    });

    // Group data by day
    const dailyData: Record<string, {
      date: string;
      lessons: number;
      quizzes: number;
      xp: number;
      minutes: number;
    }> = {};

    // Initialize all days in period
    const dayCount = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, lessons: 0, quizzes: 0, xp: 0, minutes: 0 };
    }

    // Aggregate lesson completions
    lessonCompletions.forEach(lp => {
      if (lp.completedAt) {
        const dateStr = new Date(lp.completedAt).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].lessons++;
          dailyData[dateStr].minutes += 10; // Estimate 10 min per lesson
        }
      }
    });

    // Aggregate quiz attempts
    quizAttempts.forEach(qa => {
      if (qa.completedAt) {
        const dateStr = new Date(qa.completedAt).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].quizzes++;
          dailyData[dateStr].minutes += 5; // Estimate 5 min per quiz
        }
      }
    });

    // Aggregate XP
    xpLogs.forEach(log => {
      const dateStr = new Date(log.createdAt).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].xp += log.amount;
      }
    });

    // Category breakdown
    const categoryStats: Record<string, { completed: number; total: number }> = {};

    lessonCompletions.forEach(lp => {
      const trackName = lp.lesson.module.track.name;
      if (!categoryStats[trackName]) {
        categoryStats[trackName] = { completed: 0, total: 0 };
      }
      categoryStats[trackName].completed++;
    });

    // Get total lessons per track
    const tracks = await prisma.track.findMany({
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    tracks.forEach(track => {
      const totalLessons = track.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
      if (!categoryStats[track.name]) {
        categoryStats[track.name] = { completed: 0, total: totalLessons };
      } else {
        categoryStats[track.name].total = totalLessons;
      }
    });

    // Summary stats
    const totalXP = xpLogs.reduce((sum, log) => sum + log.amount, 0);
    const totalLessons = lessonCompletions.length;
    const totalQuizzes = quizAttempts.filter(qa => qa.passed).length;
    const totalMinutes = Object.values(dailyData).reduce((sum, d) => sum + d.minutes, 0);

    // Calculate streak
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { currentStreak: true, longestStreak: true },
    });

    // Recent achievements
    const recentAchievements = badgesEarned.slice(-5).map(ub => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      earnedAt: ub.awardedAt,
    }));

    // Compare with previous period
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - dayCount);

    const prevXpLogs = await prisma.xPLog.aggregate({
      where: {
        userId: user.id,
        createdAt: {
          gte: prevStartDate,
          lt: startDate,
        },
      },
      _sum: { amount: true },
    });

    const prevLessons = await prisma.lessonProgress.count({
      where: {
        usedId: user.id,
        completedAt: {
          gte: prevStartDate,
          lt: startDate,
        },
      },
    });

    const xpChange = prevXpLogs._sum.amount
      ? ((totalXP - prevXpLogs._sum.amount) / prevXpLogs._sum.amount) * 100
      : 100;

    const lessonChange = prevLessons
      ? ((totalLessons - prevLessons) / prevLessons) * 100
      : 100;

    return NextResponse.json({
      dailyData: Object.values(dailyData),
      categoryBreakdown: Object.entries(categoryStats).map(([name, stats]) => ({
        name,
        completed: stats.completed,
        total: stats.total,
      })),
      summary: {
        totalXP,
        totalLessons,
        totalQuizzes,
        totalMinutes,
        currentStreak: userData?.currentStreak || 0,
        longestStreak: userData?.longestStreak || 0,
        xpChange: Math.round(xpChange),
        lessonChange: Math.round(lessonChange),
      },
      recentAchievements,
      period,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
