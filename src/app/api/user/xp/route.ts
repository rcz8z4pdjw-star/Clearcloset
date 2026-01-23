import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateLevel, getLevelInfo } from '@/lib/gamification';

// Get user's XP and level info
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        xp: true,
        level: true,
        streak: true,
        longestStreak: true,
        lastActivityDate: true,
        ageBand: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current level based on XP
    const currentLevel = calculateLevel(userData.xp || 0);
    const levelInfo = getLevelInfo(currentLevel, userData.ageBand || 'LAUNCH');

    // Calculate XP needed for next level
    const nextLevelXP = levelInfo.nextLevelXP;
    const currentLevelXP = levelInfo.currentLevelXP;
    const xpInCurrentLevel = (userData.xp || 0) - currentLevelXP;
    const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
    const progressPercent = (xpInCurrentLevel / xpNeededForNextLevel) * 100;

    return NextResponse.json({
      xp: userData.xp || 0,
      level: currentLevel,
      levelTitle: levelInfo.title,
      levelColor: levelInfo.color,
      streak: userData.streak || 0,
      longestStreak: userData.longestStreak || 0,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent: Math.min(progressPercent, 100),
      nextLevelXP,
      ageBand: userData.ageBand,
    });
  } catch (error) {
    console.error('Get XP error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch XP data' },
      { status: 500 }
    );
  }
}

// Award XP to user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, reason, source } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid XP amount' }, { status: 400 });
    }

    // Get current user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true, level: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldXP = userData.xp || 0;
    const newXP = oldXP + amount;
    const oldLevel = calculateLevel(oldXP);
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > oldLevel;

    // Update user XP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    // Log XP transaction
    await prisma.xpTransaction.create({
      data: {
        userId: user.id,
        amount,
        reason: reason || 'XP awarded',
        source: source || 'system',
        balanceAfter: newXP,
      },
    });

    // If leveled up, create notification
    if (leveledUp) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'LEVEL_UP',
          title: `Level Up! You're now Level ${newLevel}!`,
          message: `Congratulations! You've reached Level ${newLevel}. Keep up the great work!`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      xpAwarded: amount,
      newXP,
      newLevel,
      leveledUp,
      oldLevel,
    });
  } catch (error) {
    console.error('Award XP error:', error);
    return NextResponse.json(
      { error: 'Failed to award XP' },
      { status: 500 }
    );
  }
}
