import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';

// Get user's streak data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get streak history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activityDays = await prisma.xPLog.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      distinct: ['createdAt'],
    });

    // Get unique activity dates
    const activeDates = new Set<string>();
    activityDays.forEach(log => {
      const dateStr = log.createdAt.toISOString().split('T')[0];
      activeDates.add(dateStr);
    });

    // Build calendar data
    const calendar: Record<string, boolean> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      calendar[dateStr] = activeDates.has(dateStr);
    }

    // Check if streak is still active today
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastActivity = userData.lastActivityAt?.toISOString().split('T')[0];
    const isStreakActive = lastActivity === today || lastActivity === yesterdayStr;

    // Calculate milestone progress
    const milestones = [7, 14, 30, 60, 100, 365];
    const nextMilestone = milestones.find(m => m > userData.currentStreak) || null;
    const milestoneProgress = nextMilestone
      ? Math.round((userData.currentStreak / nextMilestone) * 100)
      : 100;

    // Get streak rewards earned
    const streakRewards = await prisma.xPLog.findMany({
      where: {
        userId: user.id,
        source: 'streak_bonus',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      currentStreak: userData.currentStreak,
      longestStreak: userData.longestStreak,
      isActive: isStreakActive,
      lastActivityAt: userData.lastActivityAt,
      calendar,
      nextMilestone,
      milestoneProgress,
      recentRewards: streakRewards.map(r => ({
        amount: r.amount,
        reason: r.reason,
        date: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get streak error:', error);
    return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
  }
}

// Update streak (called after user activity)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastActivityAt: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const lastActivity = userData.lastActivityAt?.toISOString().split('T')[0];

    // Already logged activity today
    if (lastActivity === today) {
      return NextResponse.json({
        success: true,
        currentStreak: userData.currentStreak,
        longestStreak: userData.longestStreak,
        newStreak: false,
      });
    }

    // Calculate new streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak: number;
    let streakBroken = false;

    if (lastActivity === yesterdayStr) {
      // Continuing streak
      newStreak = userData.currentStreak + 1;
    } else if (lastActivity) {
      // Streak broken
      newStreak = 1;
      streakBroken = userData.currentStreak > 0;
    } else {
      // First activity
      newStreak = 1;
    }

    const newLongestStreak = Math.max(newStreak, userData.longestStreak);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastActivityAt: now,
      },
    });

    // Check for streak milestones and award bonus XP
    const milestones = [
      { days: 7, xp: 50, name: '7-day streak' },
      { days: 14, xp: 100, name: '14-day streak' },
      { days: 30, xp: 250, name: '30-day streak' },
      { days: 60, xp: 500, name: '60-day streak' },
      { days: 100, xp: 1000, name: '100-day streak' },
      { days: 365, xp: 5000, name: 'Year-long streak' },
    ];

    const reachedMilestone = milestones.find(m => m.days === newStreak);

    if (reachedMilestone) {
      await awardXP(
        user.id,
        reachedMilestone.xp,
        `${reachedMilestone.name} bonus`,
        'streak_bonus'
      );

      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'STREAK_MILESTONE',
          title: `${reachedMilestone.name} achieved! 🔥`,
          message: `Congratulations! You earned ${reachedMilestone.xp} bonus XP for your amazing streak!`,
          link: '/dashboard',
        },
      });

      // Check for streak achievement badge
      await checkStreakAchievements(user.id, newStreak);
    }

    return NextResponse.json({
      success: true,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      newStreak: true,
      streakBroken,
      milestone: reachedMilestone || null,
    });
  } catch (error) {
    console.error('Update streak error:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}

// Helper function to check for streak achievements
async function checkStreakAchievements(userId: string, streak: number) {
  const streakAchievements = [
    { streak: 7, achievementName: 'Streak Starter' },
    { streak: 14, achievementName: 'Consistent Learner' },
    { streak: 30, achievementName: 'Dedicated Student' },
    { streak: 100, achievementName: 'Streak Champion' },
    { streak: 365, achievementName: 'Year of Learning' },
  ];

  const achievement = streakAchievements.find(a => a.streak === streak);
  if (!achievement) return;

  // Find the achievement in database
  const dbAchievement = await prisma.achievement.findFirst({
    where: { name: achievement.achievementName },
  });

  if (!dbAchievement) return;

  // Check if user already has it
  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: dbAchievement.id,
      },
    },
  });

  if (existing) return;

  // Award the achievement
  await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: dbAchievement.id,
    },
  });

  await awardXP(
    userId,
    dbAchievement.xpReward,
    `Achievement: ${dbAchievement.name}`,
    'achievement',
    dbAchievement.id
  );

  await prisma.notification.create({
    data: {
      userId,
      type: 'ACHIEVEMENT_EARNED',
      title: `Achievement Unlocked: ${dbAchievement.name}`,
      message: dbAchievement.description,
      link: '/dashboard/achievements',
    },
  });
}
