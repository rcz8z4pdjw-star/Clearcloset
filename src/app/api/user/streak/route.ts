import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's streak info
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        streak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate if streak is at risk
    const now = new Date();
    const lastActivity = userData.lastActivityDate ? new Date(userData.lastActivityDate) : null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streakStatus = 'active';
    let activeToday = false;

    if (lastActivity) {
      const lastActivityDate = new Date(
        lastActivity.getFullYear(),
        lastActivity.getMonth(),
        lastActivity.getDate()
      );

      if (lastActivityDate.getTime() === today.getTime()) {
        streakStatus = 'active';
        activeToday = true;
      } else if (lastActivityDate.getTime() === yesterday.getTime()) {
        streakStatus = 'at_risk'; // Needs activity today to maintain
      } else {
        streakStatus = 'lost'; // Streak was broken
      }
    }

    // Calculate streak milestones
    const currentStreak = userData.streak || 0;
    const nextMilestone = getNextMilestone(currentStreak);
    const daysToMilestone = nextMilestone - currentStreak;

    return NextResponse.json({
      currentStreak: userData.streak || 0,
      longestStreak: userData.longestStreak || 0,
      lastActivityDate: userData.lastActivityDate,
      streakStatus,
      activeToday,
      nextMilestone,
      daysToMilestone,
      milestoneReward: getMilestoneReward(nextMilestone),
    });
  } catch (error) {
    console.error('Get streak error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}

// Record daily activity (maintains or increments streak)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        streak: true,
        longestStreak: true,
        lastActivityDate: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = 1;
    let streakIncremented = false;
    let milestoneReached = false;
    let milestoneXP = 0;

    if (userData.lastActivityDate) {
      const lastActivityDate = new Date(
        new Date(userData.lastActivityDate).getFullYear(),
        new Date(userData.lastActivityDate).getMonth(),
        new Date(userData.lastActivityDate).getDate()
      );

      if (lastActivityDate.getTime() === today.getTime()) {
        // Already active today, no change
        return NextResponse.json({
          success: true,
          streakIncremented: false,
          currentStreak: userData.streak,
          message: 'Already active today',
        });
      } else if (lastActivityDate.getTime() === yesterday.getTime()) {
        // Continue streak
        newStreak = (userData.streak || 0) + 1;
        streakIncremented = true;
      }
      // Otherwise, streak resets to 1
    }

    // Check for milestone rewards
    const currentStreak = userData.streak || 0;
    if (newStreak > currentStreak) {
      const milestones = [3, 7, 14, 30, 60, 100, 365];
      for (const milestone of milestones) {
        if (newStreak === milestone) {
          milestoneReached = true;
          milestoneXP = getMilestoneReward(milestone);
          break;
        }
      }
    }

    // Update longest streak if needed
    const newLongestStreak = Math.max(newStreak, userData.longestStreak || 0);

    // Update user
    const updates: any = {
      streak: newStreak,
      longestStreak: newLongestStreak,
      lastActivityDate: now,
    };

    // Award milestone XP if reached
    if (milestoneReached && milestoneXP > 0) {
      updates.xp = { increment: milestoneXP };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates,
    });

    // Create milestone notification if reached
    if (milestoneReached) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'STREAK_MILESTONE',
          title: `${newStreak}-Day Streak Milestone!`,
          message: `Amazing! You've maintained a ${newStreak}-day learning streak! You earned ${milestoneXP} bonus XP!`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      streakIncremented,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      milestoneReached,
      milestoneXP,
    });
  } catch (error) {
    console.error('Update streak error:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}

function getNextMilestone(currentStreak: number): number {
  const milestones = [3, 7, 14, 30, 60, 100, 365];
  for (const milestone of milestones) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return currentStreak + 1; // If past all milestones, next is just current + 1
}

function getMilestoneReward(milestone: number): number {
  const rewards: Record<number, number> = {
    3: 50,
    7: 150,
    14: 300,
    30: 750,
    60: 1500,
    100: 3000,
    365: 10000,
  };
  return rewards[milestone] || 0;
}
