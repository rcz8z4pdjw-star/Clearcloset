import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';
import { awardXP, XP_REWARDS } from '@/lib/gamification';

// Get today's challenges for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's age band
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ageBand = getAgeBand(userData.dateOfBirth, userData.ageBandOverride);

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user already has challenges for today
    let userChallenges = await prisma.userDailyChallenge.findMany({
      where: {
        userId: user.id,
        assignedAt: { gte: today },
      },
      include: {
        challenge: true,
      },
    });

    // If no challenges assigned today, generate new ones
    if (userChallenges.length === 0) {
      // Get available challenges for user's age band
      const availableChallenges = await prisma.dailyChallenge.findMany({
        where: {
          isActive: true,
          ageBands: { has: ageBand },
        },
      });

      if (availableChallenges.length === 0) {
        return NextResponse.json({
          challenges: [],
          stats: { completed: 0, total: 0, xpEarned: 0 },
        });
      }

      // Randomly select 3 challenges
      const shuffled = availableChallenges.sort(() => Math.random() - 0.5);
      const selectedChallenges = shuffled.slice(0, 3);

      // Create user challenge assignments
      await prisma.userDailyChallenge.createMany({
        data: selectedChallenges.map(challenge => ({
          userId: user.id,
          challengeId: challenge.id,
        })),
      });

      // Fetch the created assignments
      userChallenges = await prisma.userDailyChallenge.findMany({
        where: {
          userId: user.id,
          assignedAt: { gte: today },
        },
        include: {
          challenge: true,
        },
      });
    }

    // Format challenges
    const challenges = userChallenges.map(uc => ({
      id: uc.id,
      challengeId: uc.challenge.id,
      title: uc.challenge.title,
      description: uc.challenge.description,
      type: uc.challenge.type,
      xpReward: uc.challenge.xpReward,
      requirement: uc.challenge.requirement,
      progress: uc.progress,
      completed: uc.completed,
      completedAt: uc.completedAt,
    }));

    // Calculate stats
    const stats = {
      completed: challenges.filter(c => c.completed).length,
      total: challenges.length,
      xpEarned: challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xpReward, 0),
    };

    return NextResponse.json({
      challenges,
      stats,
    });
  } catch (error) {
    console.error('Get daily challenges error:', error);
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
  }
}

// Update challenge progress
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { challengeId, progress } = body;

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Get user's challenge
    const userChallenge = await prisma.userDailyChallenge.findFirst({
      where: {
        userId: user.id,
        id: challengeId,
      },
      include: {
        challenge: true,
      },
    });

    if (!userChallenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    if (userChallenge.completed) {
      return NextResponse.json({ error: 'Challenge already completed' }, { status: 400 });
    }

    // Update progress
    const newProgress = progress !== undefined ? progress : userChallenge.progress + 1;
    const requirement = userChallenge.challenge.requirement || 1;
    const isCompleted = newProgress >= requirement;

    await prisma.userDailyChallenge.update({
      where: { id: userChallenge.id },
      data: {
        progress: newProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    let xpResult = null;

    // Award XP if completed
    if (isCompleted) {
      xpResult = await awardXP(
        user.id,
        userChallenge.challenge.xpReward,
        `Completed daily challenge: ${userChallenge.challenge.title}`,
        'daily_challenge',
        userChallenge.challenge.id
      );

      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'ACHIEVEMENT_EARNED',
          title: 'Daily Challenge Complete!',
          message: `You completed "${userChallenge.challenge.title}" and earned ${userChallenge.challenge.xpReward} XP!`,
          link: '/dashboard/challenges',
        },
      });

      // Check if all daily challenges completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const allChallenges = await prisma.userDailyChallenge.findMany({
        where: {
          userId: user.id,
          assignedAt: { gte: today },
        },
      });

      const allCompleted = allChallenges.every(c => c.completed);

      if (allCompleted) {
        // Bonus XP for completing all daily challenges
        const bonusXp = await awardXP(
          user.id,
          50,
          'Completed all daily challenges',
          'daily_challenge_bonus'
        );

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ACHIEVEMENT_EARNED',
            title: 'All Challenges Complete!',
            message: 'You completed all daily challenges! Bonus 50 XP earned!',
            link: '/dashboard/challenges',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      progress: newProgress,
      completed: isCompleted,
      xp: xpResult,
    });
  } catch (error) {
    console.error('Update challenge progress error:', error);
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 });
  }
}

// Admin: Create new challenge
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userData || !['ADMIN', 'PROGRAM_DIRECTOR'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, xpReward, requirement, ageBands } = body;

    if (!title || !type || !xpReward) {
      return NextResponse.json({ error: 'Title, type, and XP reward are required' }, { status: 400 });
    }

    const challenge = await prisma.dailyChallenge.create({
      data: {
        title,
        description,
        type,
        xpReward,
        requirement: requirement || 1,
        ageBands: ageBands || ['TEEN_SKILLS', 'LAUNCH', 'STEWARDSHIP_PRACTICUM'],
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      challenge,
    });
  } catch (error) {
    console.error('Create challenge error:', error);
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
  }
}
