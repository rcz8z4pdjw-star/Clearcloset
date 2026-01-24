import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's activity feed
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // learning, achievements, social, goals
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Collect activities from various sources
    const activities: any[] = [];

    // Get lesson completions
    const lessonCompletions = await prisma.lessonProgress.findMany({
      where: {
        userId: user.id,
        completed: true,
      },
      include: {
        lesson: {
          select: { title: true, module: { select: { title: true } } },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    lessonCompletions.forEach(lp => {
      if (lp.completedAt) {
        activities.push({
          id: `lesson-${lp.id}`,
          type: 'lesson_completed',
          title: `Completed lesson: ${lp.lesson.title}`,
          description: `Part of the ${lp.lesson.module.title} module`,
          xp: 50, // Default XP for lesson
          timestamp: lp.completedAt,
          category: 'learning',
        });
      }
    });

    // Get quiz attempts
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null },
      },
      include: {
        quiz: { select: { title: true } },
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    quizAttempts.forEach(qa => {
      activities.push({
        id: `quiz-${qa.id}`,
        type: 'quiz_completed',
        title: `Completed quiz: ${qa.quiz.title}`,
        description: `Score: ${qa.score}% (${qa.correctAnswers}/${qa.totalQuestions} correct)`,
        xp: qa.passed ? Math.round(qa.score) : Math.round(qa.score / 2),
        timestamp: qa.completedAt,
        category: 'learning',
      });
    });

    // Get achievements earned
    const achievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: {
        achievement: { select: { name: true, xpReward: true, description: true } },
      },
      orderBy: { earnedAt: 'desc' },
      take: limit,
    });

    achievements.forEach(ua => {
      activities.push({
        id: `achievement-${ua.id}`,
        type: 'achievement_earned',
        title: `Earned achievement: ${ua.achievement.name}`,
        description: ua.achievement.description,
        xp: ua.achievement.xpReward,
        timestamp: ua.earnedAt,
        category: 'achievements',
      });
    });

    // Get workshop attendance
    const workshops = await prisma.workshopRegistration.findMany({
      where: {
        userId: user.id,
        attended: true,
      },
      include: {
        workshop: { select: { title: true, xpReward: true } },
      },
      orderBy: { registeredAt: 'desc' },
      take: limit,
    });

    workshops.forEach(wr => {
      activities.push({
        id: `workshop-${wr.id}`,
        type: 'workshop_attended',
        title: `Attended workshop: ${wr.workshop.title}`,
        description: 'Live workshop session',
        xp: wr.workshop.xpReward,
        timestamp: wr.registeredAt,
        category: 'learning',
      });
    });

    // Get new connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { userId: user.id, status: 'ACCEPTED' },
          { connectedUserId: user.id, status: 'ACCEPTED' },
        ],
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
        connectedUser: { select: { firstName: true, lastName: true } },
      },
      orderBy: { acceptedAt: 'desc' },
      take: limit,
    });

    connections.forEach(c => {
      const otherUser = c.userId === user.id ? c.connectedUser : c.user;
      if (c.acceptedAt) {
        activities.push({
          id: `connection-${c.id}`,
          type: 'connection_made',
          title: `Connected with ${otherUser.firstName} ${otherUser.lastName}`,
          description: "You're now connected and can message each other",
          xp: 10,
          timestamp: c.acceptedAt,
          category: 'social',
        });
      }
    });

    // Get goal progress/completions
    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });

    goals.forEach(g => {
      if (g.completedAt) {
        activities.push({
          id: `goal-${g.id}`,
          type: 'goal_completed',
          title: `Completed goal: ${g.title}`,
          description: g.description || 'Financial goal achieved',
          xp: 100,
          timestamp: g.completedAt,
          category: 'goals',
        });
      }
    });

    // Get XP milestones from XP log
    const xpMilestones = await prisma.xPLog.findMany({
      where: {
        userId: user.id,
        source: { in: ['level_up', 'streak_bonus'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    xpMilestones.forEach(xp => {
      activities.push({
        id: `xp-${xp.id}`,
        type: xp.source === 'level_up' ? 'level_up' : 'streak_milestone',
        title: xp.source === 'level_up' ? `Leveled up!` : 'Streak milestone!',
        description: xp.reason,
        xp: xp.amount,
        timestamp: xp.createdAt,
        category: 'achievements',
      });
    });

    // Sort all activities by timestamp and apply pagination
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by type if specified
    let filteredActivities = activities;
    if (type && type !== 'All') {
      const typeMapping: Record<string, string[]> = {
        learning: ['lesson_completed', 'quiz_completed', 'workshop_attended'],
        achievements: ['achievement_earned', 'level_up', 'streak_milestone'],
        social: ['connection_made', 'message_received'],
        goals: ['goal_completed', 'goal_progress'],
      };
      const allowedTypes = typeMapping[type] || [];
      filteredActivities = activities.filter(a => allowedTypes.includes(a.type));
    }

    const paginatedActivities = filteredActivities.slice(offset, offset + limit);

    // Calculate stats
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const weeklyActivities = activities.filter(a => new Date(a.timestamp) >= weekAgo);
    const weeklyXp = weeklyActivities.reduce((sum, a) => sum + (a.xp || 0), 0);

    const stats = {
      totalActivities: activities.length,
      weeklyActivities: weeklyActivities.length,
      weeklyXp,
      lessonsThisWeek: weeklyActivities.filter(a => a.type === 'lesson_completed').length,
      achievementsThisWeek: weeklyActivities.filter(a => a.type === 'achievement_earned').length,
    };

    return NextResponse.json({
      activities: paginatedActivities,
      stats,
      hasMore: offset + limit < filteredActivities.length,
    });
  } catch (error) {
    console.error('Get activity error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
