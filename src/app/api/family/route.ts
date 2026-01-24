import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get family data
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { familyId: true },
    });

    if (!userData?.familyId) {
      return NextResponse.json({ error: 'No family associated' }, { status: 404 });
    }

    // Get family details
    const family = await prisma.family.findUnique({
      where: { id: userData.familyId },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
            totalXP: true,
            currentLevel: true,
            currentStreak: true,
            lastActiveAt: true,
            _count: {
              select: {
                lessonProgress: { where: { completedAt: { not: null } } },
                badges: true,
              },
            },
          },
        },
        goals: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Calculate family stats
    const totalFamilyXP = family.members.reduce((sum, m) => sum + (m.totalXP || 0), 0);
    const totalLessonsCompleted = family.members.reduce((sum, m) => sum + m._count.lessonProgress, 0);
    const totalBadges = family.members.reduce((sum, m) => sum + m._count.badges, 0);

    // Get family rank
    const familyRanks = await prisma.family.findMany({
      select: {
        id: true,
        members: {
          select: { totalXP: true },
        },
      },
    });

    const familyXPMap = familyRanks.map(f => ({
      id: f.id,
      totalXP: f.members.reduce((sum, m) => sum + (m.totalXP || 0), 0),
    })).sort((a, b) => b.totalXP - a.totalXP);

    const familyRank = familyXPMap.findIndex(f => f.id === userData.familyId) + 1;

    // Format members
    const members = family.members.map(member => {
      const now = new Date();
      const lastActive = member.lastActiveAt ? new Date(member.lastActiveAt) : null;
      const isOnline = lastActive && (now.getTime() - lastActive.getTime()) < 5 * 60 * 1000; // 5 minutes
      const isLearning = lastActive && (now.getTime() - lastActive.getTime()) < 15 * 60 * 1000; // 15 minutes

      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        avatar: member.avatarUrl,
        role: member.role,
        level: member.currentLevel || 1,
        xp: member.totalXP || 0,
        streak: member.currentStreak || 0,
        lessonsCompleted: member._count.lessonProgress,
        badges: member._count.badges,
        status: isOnline ? 'online' : isLearning ? 'learning' : 'offline',
        isCurrentUser: member.id === user.id,
      };
    });

    // Get recent family activity
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        user: { familyId: userData.familyId },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get family achievements
    const familyAchievements = [
      {
        id: 'learning_family',
        name: 'Learning Family',
        description: 'All members active this week',
        earned: members.filter(m => m.status !== 'offline').length === members.length,
      },
      {
        id: 'support_squad',
        name: 'Support Squad',
        description: 'Send encouragement to all members',
        earned: false,
      },
      {
        id: 'knowledge_share',
        name: 'Knowledge Share',
        description: 'Hold a family discussion',
        earned: false,
      },
    ];

    return NextResponse.json({
      family: {
        id: family.id,
        name: family.name,
      },
      members,
      stats: {
        totalXP: totalFamilyXP,
        totalLessons: totalLessonsCompleted,
        totalBadges,
        memberCount: members.length,
        familyRank,
      },
      goals: family.goals.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        progress: goal.currentValue,
        target: goal.targetValue,
        reward: goal.reward,
        deadline: goal.deadline,
      })),
      achievements: familyAchievements,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        member: `${activity.user.firstName}`,
        action: activity.activityType,
        entityType: activity.entityType,
        entityId: activity.entityId,
        timestamp: activity.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get family error:', error);
    return NextResponse.json({ error: 'Failed to fetch family data' }, { status: 500 });
  }
}

// Send encouragement to family member
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, message, type } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Verify both users are in same family
    const [currentUser, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, select: { familyId: true, firstName: true } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { familyId: true } }),
    ]);

    if (!currentUser?.familyId || currentUser.familyId !== targetUser?.familyId) {
      return NextResponse.json({ error: 'Users must be in the same family' }, { status: 400 });
    }

    // Create notification for target user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'FAMILY_CHEER',
        title: type === 'cheer' ? `${currentUser.firstName} cheered for you!` : `Message from ${currentUser.firstName}`,
        message: message || 'Keep up the great work!',
        link: '/dashboard/family',
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activityType: 'family_cheer',
        entityType: 'user',
        entityId: targetUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send encouragement error:', error);
    return NextResponse.json({ error: 'Failed to send encouragement' }, { status: 500 });
  }
}

// Create or update family goal
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { familyId: true, role: true },
    });

    if (!userData?.familyId) {
      return NextResponse.json({ error: 'No family associated' }, { status: 404 });
    }

    // Only parents can create family goals
    if (!['PARENT', 'ADMIN'].includes(userData.role)) {
      return NextResponse.json({ error: 'Only parents can create family goals' }, { status: 403 });
    }

    const body = await request.json();
    const { goalId, title, description, targetValue, reward, deadline } = body;

    if (goalId) {
      // Update existing goal
      const goal = await prisma.familyGoal.update({
        where: { id: goalId },
        data: {
          title,
          description,
          targetValue,
          reward,
          deadline: deadline ? new Date(deadline) : undefined,
        },
      });

      return NextResponse.json({ success: true, goal });
    } else {
      // Create new goal
      const goal = await prisma.familyGoal.create({
        data: {
          familyId: userData.familyId,
          title,
          description,
          targetValue,
          currentValue: 0,
          reward,
          deadline: deadline ? new Date(deadline) : undefined,
          status: 'active',
        },
      });

      return NextResponse.json({ success: true, goal });
    }
  } catch (error) {
    console.error('Create/update family goal error:', error);
    return NextResponse.json({ error: 'Failed to save family goal' }, { status: 500 });
  }
}
