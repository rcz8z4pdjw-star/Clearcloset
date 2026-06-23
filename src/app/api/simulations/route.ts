import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';
import { awardXP } from '@/lib/gamification';

// Get simulations
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ageBand = getAgeBand(userData.dateOfBirth, userData.ageBandOverride);

    // Get simulations for user's age band
    const simulations = await prisma.simulation.findMany({
      where: {
        isPublished: true,
        ageBands: { has: ageBand },
      },
      orderBy: [
        { difficulty: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    // Get user's simulation attempts
    const attempts = await prisma.simulationAttempt.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: 'desc' },
    });

    // Group attempts by simulation
    const attemptsBySimulation = attempts.reduce((acc, attempt) => {
      if (!acc[attempt.simulationId]) {
        acc[attempt.simulationId] = [];
      }
      acc[attempt.simulationId].push(attempt);
      return acc;
    }, {} as Record<string, typeof attempts>);

    // Get completed simulation count for unlock logic
    const completedSimulations = new Set(
      attempts.filter(a => a.completed).map(a => a.simulationId)
    );

    const completedByDifficulty = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    simulations.forEach(sim => {
      if (completedSimulations.has(sim.id)) {
        const diff = sim.difficulty.toLowerCase() as keyof typeof completedByDifficulty;
        if (diff in completedByDifficulty) {
          completedByDifficulty[diff]++;
        }
      }
    });

    // Format simulations with user progress
    const formattedSimulations = simulations.map(sim => {
      const simAttempts = attemptsBySimulation[sim.id] || [];
      const bestAttempt = simAttempts.reduce((best, current) =>
        current.score > (best?.score || 0) ? current : best
      , null as typeof attempts[0] | null);

      // Check if simulation is unlocked
      let isLocked = false;
      let unlockRequirement = null;

      if (sim.unlockRequirements) {
        const reqs = sim.unlockRequirements as any;
        if (reqs.requiredSimulations) {
          const hasAll = reqs.requiredSimulations.every((id: string) =>
            completedSimulations.has(id)
          );
          if (!hasAll) {
            isLocked = true;
            unlockRequirement = `Complete required simulations first`;
          }
        }
        if (reqs.minIntermediateCompleted) {
          if (completedByDifficulty.intermediate < reqs.minIntermediateCompleted) {
            isLocked = true;
            unlockRequirement = `Complete ${reqs.minIntermediateCompleted} Intermediate simulations`;
          }
        }
      }

      return {
        id: sim.id,
        title: sim.title,
        description: sim.description,
        category: sim.category,
        difficulty: sim.difficulty,
        durationMinutes: sim.durationMinutes,
        xpReward: sim.xpReward,
        maxScore: sim.maxScore || 1000,
        icon: sim.icon,
        color: sim.color,
        completed: simAttempts.some(a => a.completed),
        highScore: bestAttempt?.score || null,
        attempts: simAttempts.length,
        lastAttempt: simAttempts[0]?.completedAt || null,
        isLocked,
        unlockRequirement,
      };
    });

    // Calculate stats
    const stats = {
      totalSimulations: simulations.length,
      completed: completedSimulations.size,
      totalAttempts: attempts.length,
      xpEarned: attempts.filter(a => a.completed).reduce((sum, a) => sum + (a.xpAwarded || 0), 0),
      bestScore: Math.max(...attempts.map(a => a.score), 0),
    };

    // Get achievements
    const achievements = [
      {
        id: 'first_sim',
        name: 'First Simulation',
        description: 'Complete your first simulation',
        earned: completedSimulations.size >= 1,
      },
      {
        id: 'high_scorer',
        name: 'High Scorer',
        description: 'Score 900+ on any simulation',
        earned: attempts.some(a => a.score >= 900),
      },
      {
        id: 'diverse',
        name: 'Diverse Learner',
        description: 'Complete simulations in 3 categories',
        earned: new Set(
          formattedSimulations.filter(s => s.completed).map(s => s.category)
        ).size >= 3,
      },
      {
        id: 'master',
        name: 'Simulation Master',
        description: 'Complete all simulations',
        earned: completedSimulations.size === simulations.length,
      },
    ];

    return NextResponse.json({
      simulations: formattedSimulations,
      stats,
      achievements,
    });
  } catch (error) {
    console.error('Get simulations error:', error);
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: 500 });
  }
}

// Start or complete a simulation attempt
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { simulationId, action, score, decisions } = body;

    if (!simulationId || !action) {
      return NextResponse.json({ error: 'Simulation ID and action are required' }, { status: 400 });
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
    });

    if (!simulation) {
      return NextResponse.json({ error: 'Simulation not found' }, { status: 404 });
    }

    if (action === 'start') {
      // Create new attempt
      const attempt = await prisma.simulationAttempt.create({
        data: {
          userId: user.id,
          simulationId,
          score: 0,
          completed: false,
        },
      });

      return NextResponse.json({
        success: true,
        attemptId: attempt.id,
      });
    } else if (action === 'complete') {
      if (typeof score !== 'number') {
        return NextResponse.json({ error: 'Score is required' }, { status: 400 });
      }

      // Find the current attempt
      const attempt = await prisma.simulationAttempt.findFirst({
        where: {
          userId: user.id,
          simulationId,
          completed: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!attempt) {
        return NextResponse.json({ error: 'No active attempt found' }, { status: 400 });
      }

      // Check if this is user's first completion
      const previousCompletion = await prisma.simulationAttempt.findFirst({
        where: {
          userId: user.id,
          simulationId,
          completed: true,
        },
      });

      // Update attempt
      await prisma.simulationAttempt.update({
        where: { id: attempt.id },
        data: {
          score,
          completed: true,
          completedAt: new Date(),
          decisions: decisions ? JSON.stringify(decisions) : null,
          xpAwarded: !previousCompletion ? simulation.xpReward : 0,
        },
      });

      // Award XP only on first completion
      let xpResult = null;
      if (!previousCompletion) {
        xpResult = await awardXP(
          user.id,
          simulation.xpReward,
          `Completed simulation: ${simulation.title}`,
          'simulation',
          simulationId
        );

        // Create notification
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ACHIEVEMENT',
            title: `Simulation Complete: ${simulation.title}!`,
            message: `You scored ${score} points and earned ${simulation.xpReward} XP!`,
            link: '/dashboard/simulations',
          },
        });
      }

      // Check for high score badge
      if (score >= 900) {
        const badge = await prisma.badge.findFirst({
          where: { name: 'High Scorer' },
        });

        if (badge) {
          const existingBadge = await prisma.userBadge.findFirst({
            where: { userId: user.id, badgeId: badge.id },
          });

          if (!existingBadge) {
            await prisma.userBadge.create({
              data: { userId: user.id, badgeId: badge.id },
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        score,
        xp: xpResult,
        isFirstCompletion: !previousCompletion,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Simulation attempt error:', error);
    return NextResponse.json({ error: 'Failed to process simulation attempt' }, { status: 500 });
  }
}
