import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';

// Get user's goals
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const where: any = { userId: user.id };

    if (status && status !== 'All') {
      where.status = status;
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    const goals = await prisma.financialGoal.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { deadline: 'asc' },
      ],
      include: {
        milestones: {
          orderBy: { targetAmount: 'asc' },
        },
        progressLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // Calculate stats
    const stats = {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    };

    return NextResponse.json({ goals, stats });
  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
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
    const { title, description, category, targetAmount, deadline, priority, milestones } = body;

    if (!title || !targetAmount || !deadline) {
      return NextResponse.json({ error: 'Title, target amount, and deadline are required' }, { status: 400 });
    }

    // Create goal
    const goal = await prisma.financialGoal.create({
      data: {
        userId: user.id,
        title,
        description,
        category: category || 'savings',
        targetAmount,
        currentAmount: 0,
        deadline: new Date(deadline),
        priority: priority || 'medium',
        status: 'in_progress',
      },
    });

    // Create milestones if provided
    if (milestones && milestones.length > 0) {
      await prisma.goalMilestone.createMany({
        data: milestones.map((m: { amount: number; description?: string }) => ({
          goalId: goal.id,
          targetAmount: m.amount,
          description: m.description,
          reached: false,
        })),
      });
    }

    // Award XP for creating a goal
    await awardXP(user.id, 25, 'Created financial goal', 'goal_created', goal.id);

    return NextResponse.json({ success: true, goal });
  } catch (error) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}

// Update goal progress
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goalId, action, amount, note } = body;

    if (!goalId || !action) {
      return NextResponse.json({ error: 'Goal ID and action are required' }, { status: 400 });
    }

    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId: user.id },
      include: { milestones: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (action === 'log_progress') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
      }

      const newAmount = goal.currentAmount + amount;

      // Update goal amount
      await prisma.financialGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newAmount,
          status: newAmount >= goal.targetAmount ? 'completed' : 'in_progress',
          completedAt: newAmount >= goal.targetAmount ? new Date() : null,
        },
      });

      // Log the progress
      await prisma.goalProgressLog.create({
        data: {
          goalId,
          amount,
          note,
          previousAmount: goal.currentAmount,
          newAmount,
        },
      });

      // Check and update milestones
      const newlyReachedMilestones = [];
      for (const milestone of goal.milestones) {
        if (!milestone.reached && newAmount >= milestone.targetAmount) {
          await prisma.goalMilestone.update({
            where: { id: milestone.id },
            data: {
              reached: true,
              reachedAt: new Date(),
            },
          });
          newlyReachedMilestones.push(milestone);
        }
      }

      // Award XP
      let xpAwarded = 10; // Base XP for logging progress

      // Bonus XP for reaching milestones
      if (newlyReachedMilestones.length > 0) {
        xpAwarded += newlyReachedMilestones.length * 50;
      }

      // Bonus XP for completing the goal
      if (newAmount >= goal.targetAmount && goal.currentAmount < goal.targetAmount) {
        xpAwarded += 200;

        // Create notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'GOAL_COMPLETED',
            title: `Goal Completed: ${goal.title}`,
            message: `Congratulations! You've reached your ${goal.category} goal!`,
            link: '/dashboard/goals',
          },
        });
      }

      await awardXP(user.id, xpAwarded, 'Goal progress', 'goal_progress', goalId);

      return NextResponse.json({
        success: true,
        newAmount,
        completed: newAmount >= goal.targetAmount,
        milestonesReached: newlyReachedMilestones.length,
        xpAwarded,
      });
    }

    if (action === 'update') {
      const { title, description, targetAmount, deadline, priority, status } = body;

      await prisma.financialGoal.update({
        where: { id: goalId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(targetAmount && { targetAmount }),
          ...(deadline && { deadline: new Date(deadline) }),
          ...(priority && { priority }),
          ...(status && { status }),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'pause') {
      await prisma.financialGoal.update({
        where: { id: goalId },
        data: { status: 'paused' },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'resume') {
      await prisma.financialGoal.update({
        where: { id: goalId },
        data: { status: 'in_progress' },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
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
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const goal = await prisma.financialGoal.findFirst({
      where: { id: goalId, userId: user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Delete related records first
    await prisma.goalProgressLog.deleteMany({ where: { goalId } });
    await prisma.goalMilestone.deleteMany({ where: { goalId } });

    // Delete the goal
    await prisma.financialGoal.delete({ where: { id: goalId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
