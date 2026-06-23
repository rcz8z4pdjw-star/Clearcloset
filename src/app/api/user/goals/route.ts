import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's goals
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'completed', 'all'

    const whereClause: any = { userId: user.id };

    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.completedAt = null;
    } else if (status === 'completed') {
      whereClause.completedAt = { not: null };
    }

    const goals = await prisma.userGoal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const allGoals = await prisma.userGoal.findMany({
      where: { userId: user.id },
    });

    const stats = {
      total: allGoals.length,
      active: allGoals.filter(g => g.isActive && !g.completedAt).length,
      completed: allGoals.filter(g => g.completedAt).length,
      completionRate: allGoals.length > 0
        ? Math.round((allGoals.filter(g => g.completedAt).length / allGoals.length) * 100)
        : 0,
    };

    return NextResponse.json({
      goals,
      stats,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// Create a new goal
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, target, period, title, endDate } = body;

    if (!type || !target || !period) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate end date based on period
    let calculatedEndDate: Date | null = null;
    if (period === 'weekly') {
      calculatedEndDate = new Date();
      calculatedEndDate.setDate(calculatedEndDate.getDate() + 7);
    } else if (period === 'monthly') {
      calculatedEndDate = new Date();
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + 1);
    } else if (endDate) {
      calculatedEndDate = new Date(endDate);
    }

    const goal = await prisma.userGoal.create({
      data: {
        userId: user.id,
        type,
        target: parseInt(target),
        period,
        endDate: calculatedEndDate,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

// Update goal progress
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalId, progress, markComplete } = body;

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const goal = await prisma.userGoal.findFirst({
      where: {
        id: goalId,
        userId: user.id,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (progress !== undefined) {
      updateData.current = progress;
    }

    if (markComplete || (progress !== undefined && progress >= goal.target)) {
      updateData.completedAt = new Date();
      updateData.isActive = false;
    }

    const updatedGoal = await prisma.userGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    // If goal was completed, award XP
    if (updateData.completedAt) {
      const xpReward = getGoalXpReward(goal.type, goal.target);

      if (xpReward > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { xp: { increment: xpReward } },
        });

        await prisma.xpTransaction.create({
          data: {
            userId: user.id,
            amount: xpReward,
            reason: `Completed goal: ${goal.type}`,
            source: 'goal',
            balanceAfter: 0, // Will be updated by trigger or subsequent query
          },
        });

        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'GOAL_COMPLETED',
            title: 'Goal Completed!',
            message: `You completed your goal and earned ${xpReward} XP!`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
    });
  } catch (error) {
    console.error('Update goal error:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// Delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const goalId = searchParams.get('id');

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      );
    }

    // Verify ownership and delete
    const deleted = await prisma.userGoal.deleteMany({
      where: {
        id: goalId,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}

function getGoalXpReward(type: string, target: number): number {
  // Base rewards by type
  const baseRewards: Record<string, number> = {
    lessons_per_week: 50,
    quiz_score: 75,
    streak_days: 100,
    xp_earned: 25,
    track_completion: 150,
    level_up: 100,
  };

  const base = baseRewards[type] || 50;

  // Scale by target difficulty
  if (target >= 10) return base * 2;
  if (target >= 5) return Math.round(base * 1.5);
  return base;
}
