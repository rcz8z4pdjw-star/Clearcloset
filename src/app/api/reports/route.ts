import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get reports or report data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'list';
    const period = searchParams.get('period') || 'month';
    const reportId = searchParams.get('id');

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
        startDate.setMonth(startDate.getMonth() - 1);
    }

    if (type === 'list') {
      // Get saved reports
      const reports = await prisma.userReport.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({
        reports: reports.map(r => ({
          id: r.id,
          name: r.name,
          type: r.reportType,
          createdAt: r.createdAt,
          periodStart: r.periodStart,
          periodEnd: r.periodEnd,
        })),
      });
    }

    if (type === 'progress') {
      // Get progress report data
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: {
          usedId: user.id,
          completedAt: { gte: startDate },
        },
        include: {
          lesson: {
            include: {
              module: { include: { track: true } },
            },
          },
        },
      });

      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          completedAt: { gte: startDate },
        },
        include: { quiz: true },
      });

      const badges = await prisma.userBadge.findMany({
        where: {
          userId: user.id,
          awardedAt: { gte: startDate },
        },
        include: { badge: true },
      });

      const xpLogs = await prisma.xPLog.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
        },
      });

      // Calculate metrics
      const totalXP = xpLogs.reduce((sum, log) => sum + log.amount, 0);
      const lessonsCompleted = lessonProgress.filter(lp => lp.completedAt).length;
      const quizzesPassed = quizAttempts.filter(qa => qa.passed).length;
      const averageQuizScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, qa) => sum + qa.score, 0) / quizAttempts.length)
        : 0;

      // Group by track
      const trackProgress: Record<string, { lessons: number; quizzes: number }> = {};
      lessonProgress.forEach(lp => {
        const trackName = lp.lesson.module.track.name;
        if (!trackProgress[trackName]) {
          trackProgress[trackName] = { lessons: 0, quizzes: 0 };
        }
        if (lp.completedAt) {
          trackProgress[trackName].lessons++;
        }
      });

      return NextResponse.json({
        period: { start: startDate, end: now },
        summary: {
          totalXP,
          lessonsCompleted,
          quizzesPassed,
          averageQuizScore,
          badgesEarned: badges.length,
        },
        trackProgress: Object.entries(trackProgress).map(([name, stats]) => ({
          name,
          ...stats,
        })),
        recentBadges: badges.map(b => ({
          name: b.badge.name,
          earnedAt: b.awardedAt,
        })),
      });
    }

    if (type === 'activity') {
      // Get activity report data
      const activities = await prisma.activityLog.findMany({
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Group by day
      const dailyActivity: Record<string, { count: number; types: Record<string, number> }> = {};
      activities.forEach(activity => {
        const dateStr = new Date(activity.createdAt).toISOString().split('T')[0];
        if (!dailyActivity[dateStr]) {
          dailyActivity[dateStr] = { count: 0, types: {} };
        }
        dailyActivity[dateStr].count++;
        dailyActivity[dateStr].types[activity.activityType] =
          (dailyActivity[dateStr].types[activity.activityType] || 0) + 1;
      });

      // Calculate most active times
      const hourlyActivity: Record<number, number> = {};
      activities.forEach(activity => {
        const hour = new Date(activity.createdAt).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });

      return NextResponse.json({
        period: { start: startDate, end: now },
        totalActivities: activities.length,
        dailyActivity: Object.entries(dailyActivity).map(([date, data]) => ({
          date,
          ...data,
        })),
        hourlyDistribution: hourlyActivity,
        activityTypes: activities.reduce((acc, a) => {
          acc[a.activityType] = (acc[a.activityType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      });
    }

    if (type === 'time') {
      // Get time tracking data (estimated from activity)
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: {
          usedId: user.id,
          completedAt: { gte: startDate },
        },
      });

      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          completedAt: { gte: startDate },
        },
      });

      // Estimate time spent (lessons: 10min, quizzes: 5min)
      const estimatedMinutes = lessonProgress.length * 10 + quizAttempts.length * 5;

      // Group by day
      const dailyTime: Record<string, number> = {};
      lessonProgress.forEach(lp => {
        if (lp.completedAt) {
          const dateStr = new Date(lp.completedAt).toISOString().split('T')[0];
          dailyTime[dateStr] = (dailyTime[dateStr] || 0) + 10;
        }
      });
      quizAttempts.forEach(qa => {
        if (qa.completedAt) {
          const dateStr = new Date(qa.completedAt).toISOString().split('T')[0];
          dailyTime[dateStr] = (dailyTime[dateStr] || 0) + 5;
        }
      });

      return NextResponse.json({
        period: { start: startDate, end: now },
        totalMinutes: estimatedMinutes,
        totalHours: Math.round(estimatedMinutes / 60 * 10) / 10,
        dailyTime: Object.entries(dailyTime).map(([date, minutes]) => ({
          date,
          minutes,
        })),
        averageDaily: Object.keys(dailyTime).length > 0
          ? Math.round(estimatedMinutes / Object.keys(dailyTime).length)
          : 0,
      });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Get report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

// Save a generated report
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, reportType, periodStart, periodEnd, data } = body;

    if (!name || !reportType) {
      return NextResponse.json({ error: 'Name and report type are required' }, { status: 400 });
    }

    const report = await prisma.userReport.create({
      data: {
        userId: user.id,
        name,
        reportType,
        periodStart: periodStart ? new Date(periodStart) : new Date(),
        periodEnd: periodEnd ? new Date(periodEnd) : new Date(),
        data: data ? JSON.stringify(data) : null,
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error('Save report error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}

// Delete a saved report
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Verify ownership
    const report = await prisma.userReport.findFirst({
      where: { id: reportId, userId: user.id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await prisma.userReport.delete({ where: { id: reportId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
