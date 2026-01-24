import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';

// Get user's achievements
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const status = searchParams.get('status'); // earned, progress, locked

    // Get all achievements
    const allAchievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        ...(category && category !== 'All' ? { category } : {}),
        ...(rarity && rarity !== 'All' ? { rarity } : {}),
      },
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get user's earned achievements
    const earnedAchievements = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      select: { achievementId: true, earnedAt: true },
    });

    const earnedIds = new Set(earnedAchievements.map(a => a.achievementId));
    const earnedDates = new Map(earnedAchievements.map(a => [a.achievementId, a.earnedAt]));

    // Get user's progress data for calculating achievement progress
    const userStats = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totalXp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        _count: {
          select: {
            lessonProgress: { where: { completed: true } },
            quizAttempts: { where: { passed: true } },
            workshopRegistrations: { where: { attended: true } },
            connections: { where: { status: 'ACCEPTED' } },
            goals: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });

    // Calculate progress for each achievement
    const achievementsWithProgress = allAchievements.map(achievement => {
      const earned = earnedIds.has(achievement.id);
      const earnedAt = earnedDates.get(achievement.id);

      // Calculate progress based on achievement criteria
      let progress = 0;
      let total = 1;
      let locked = false;

      // Parse criteria if it's JSON
      let criteria: any = {};
      try {
        criteria = achievement.criteria ? JSON.parse(achievement.criteria as string) : {};
      } catch {
        criteria = {};
      }

      if (criteria.lessonsCompleted) {
        total = criteria.lessonsCompleted;
        progress = Math.min(userStats?._count.lessonProgress || 0, total);
      } else if (criteria.quizzesPassed) {
        total = criteria.quizzesPassed;
        progress = Math.min(userStats?._count.quizAttempts || 0, total);
      } else if (criteria.streakDays) {
        total = criteria.streakDays;
        progress = Math.min(userStats?.currentStreak || 0, total);
      } else if (criteria.workshopsAttended) {
        total = criteria.workshopsAttended;
        progress = Math.min(userStats?._count.workshopRegistrations || 0, total);
      } else if (criteria.connectionsCount) {
        total = criteria.connectionsCount;
        progress = Math.min(userStats?._count.connections || 0, total);
      } else if (criteria.goalsCompleted) {
        total = criteria.goalsCompleted;
        progress = Math.min(userStats?._count.goals || 0, total);
      } else if (criteria.level) {
        total = criteria.level;
        progress = Math.min(userStats?.level || 1, total);
        locked = (userStats?.level || 1) < (criteria.prerequisiteLevel || 0);
      }

      if (earned) {
        progress = total;
      }

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        rarity: achievement.rarity,
        xpReward: achievement.xpReward,
        icon: achievement.icon,
        earned,
        earnedAt,
        progress,
        total,
        locked,
      };
    });

    // Filter by status if specified
    let filteredAchievements = achievementsWithProgress;
    if (status === 'earned') {
      filteredAchievements = achievementsWithProgress.filter(a => a.earned);
    } else if (status === 'progress') {
      filteredAchievements = achievementsWithProgress.filter(a => !a.earned && !a.locked);
    } else if (status === 'locked') {
      filteredAchievements = achievementsWithProgress.filter(a => a.locked);
    }

    // Stats
    const stats = {
      total: allAchievements.length,
      earned: earnedAchievements.length,
      inProgress: achievementsWithProgress.filter(a => !a.earned && !a.locked).length,
      locked: achievementsWithProgress.filter(a => a.locked).length,
      totalXpEarned: earnedAchievements.length > 0
        ? allAchievements
            .filter(a => earnedIds.has(a.id))
            .reduce((sum, a) => sum + a.xpReward, 0)
        : 0,
    };

    return NextResponse.json({
      achievements: filteredAchievements,
      stats,
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// Check and award achievements (called after certain actions)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    // Get user's current stats
    const userStats = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totalXp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        _count: {
          select: {
            lessonProgress: { where: { completed: true } },
            quizAttempts: { where: { passed: true, score: 100 } },
            workshopRegistrations: { where: { attended: true } },
            connections: { where: { status: 'ACCEPTED' } },
            goals: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });

    // Get all achievements user hasn't earned yet
    const earnedIds = await prisma.userAchievement.findMany({
      where: { userId: user.id },
      select: { achievementId: true },
    });

    const earnedIdSet = new Set(earnedIds.map(a => a.achievementId));

    const unearnedAchievements = await prisma.achievement.findMany({
      where: {
        id: { notIn: Array.from(earnedIdSet) },
        isActive: true,
      },
    });

    const newlyEarned: any[] = [];

    for (const achievement of unearnedAchievements) {
      let criteria: any = {};
      try {
        criteria = achievement.criteria ? JSON.parse(achievement.criteria as string) : {};
      } catch {
        criteria = {};
      }

      let shouldAward = false;

      // Check if criteria is met
      if (criteria.lessonsCompleted && (userStats?._count.lessonProgress || 0) >= criteria.lessonsCompleted) {
        shouldAward = true;
      } else if (criteria.quizzesPassed && (userStats?._count.quizAttempts || 0) >= criteria.quizzesPassed) {
        shouldAward = true;
      } else if (criteria.streakDays && (userStats?.currentStreak || 0) >= criteria.streakDays) {
        shouldAward = true;
      } else if (criteria.workshopsAttended && (userStats?._count.workshopRegistrations || 0) >= criteria.workshopsAttended) {
        shouldAward = true;
      } else if (criteria.connectionsCount && (userStats?._count.connections || 0) >= criteria.connectionsCount) {
        shouldAward = true;
      } else if (criteria.goalsCompleted && (userStats?._count.goals || 0) >= criteria.goalsCompleted) {
        shouldAward = true;
      } else if (criteria.level && (userStats?.level || 1) >= criteria.level) {
        shouldAward = true;
      }

      if (shouldAward) {
        // Award the achievement
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: achievement.id,
          },
        });

        // Award XP
        await awardXP(
          user.id,
          achievement.xpReward,
          `Achievement earned: ${achievement.name}`,
          'achievement',
          achievement.id
        );

        // Create notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ACHIEVEMENT_EARNED',
            title: `Achievement Unlocked: ${achievement.name}`,
            message: `Congratulations! You earned +${achievement.xpReward} XP`,
            link: '/dashboard/achievements',
          },
        });

        newlyEarned.push({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          rarity: achievement.rarity,
          xpReward: achievement.xpReward,
          icon: achievement.icon,
        });
      }
    }

    return NextResponse.json({
      newlyEarned,
      count: newlyEarned.length,
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
  }
}
