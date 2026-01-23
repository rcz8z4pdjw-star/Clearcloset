import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'weekly';
    const category = searchParams.get('category') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date | null = null;

    switch (timeframe) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'allTime':
        startDate = null; // No date filter
        break;
    }

    // Build where clause based on category
    const whereClause: any = {
      status: 'ACTIVE',
    };

    // Filter by category
    if (category === 'age-group') {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { ageBand: true },
      });
      if (userData?.ageBand) {
        whereClause.ageBand = userData.ageBand;
      }
    } else if (category === 'family') {
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { householdId: true },
      });
      if (userData?.householdId) {
        whereClause.householdId = userData.householdId;
      }
    }

    // Get XP data - either from XP transactions or directly from users
    let leaderboardData;

    if (startDate) {
      // For time-based leaderboards, sum XP from transactions
      const xpByUser = await prisma.xpTransaction.groupBy({
        by: ['userId'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: limit,
      });

      // Get user details for the leaderboard
      const userIds = xpByUser.map(x => x.userId);
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          ...whereClause,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          level: true,
          streak: true,
          xp: true,
          ageBand: true,
          _count: {
            select: {
              badges: true,
            },
          },
        },
      });

      // Combine data
      leaderboardData = xpByUser.map((xpData, index) => {
        const userData = users.find(u => u.id === xpData.userId);
        return {
          rank: index + 1,
          id: xpData.userId,
          name: userData
            ? `${userData.firstName} ${userData.lastName}`
            : 'Unknown User',
          avatar: userData?.avatar,
          xp: xpData._sum.amount || 0,
          level: userData?.level || 1,
          streak: userData?.streak || 0,
          badges: userData?._count.badges || 0,
          change: 'same', // Would need historical data to calculate
        };
      });
    } else {
      // For all-time, use total XP
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          level: true,
          streak: true,
          xp: true,
          ageBand: true,
          _count: {
            select: {
              badges: true,
            },
          },
        },
        orderBy: {
          xp: 'desc',
        },
        take: limit,
      });

      leaderboardData = users.map((userData, index) => ({
        rank: index + 1,
        id: userData.id,
        name: `${userData.firstName} ${userData.lastName}`,
        avatar: userData.avatar,
        xp: userData.xp || 0,
        level: userData.level || 1,
        streak: userData.streak || 0,
        badges: userData._count.badges || 0,
        change: 'same',
      }));
    }

    // Find current user's rank
    let currentUserRank = null;
    const currentUserData = leaderboardData.find(u => u.id === user.id);

    if (!currentUserData) {
      // User not in top list, calculate their rank
      const userXP = await prisma.user.findUnique({
        where: { id: user.id },
        select: { xp: true },
      });

      if (userXP) {
        const usersAbove = await prisma.user.count({
          where: {
            ...whereClause,
            xp: {
              gt: userXP.xp || 0,
            },
          },
        });
        currentUserRank = usersAbove + 1;
      }
    } else {
      currentUserRank = currentUserData.rank;
    }

    return NextResponse.json({
      leaderboard: leaderboardData,
      currentUser: {
        id: user.id,
        rank: currentUserRank,
        inTopList: !!currentUserData,
      },
      timeframe,
      category,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
