import { NextRequest, NextResponse } from 'next/server';
import { getSession, refreshSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAgeBand } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Refresh session on activity
    await refreshSession();

    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        roles: true,
        householdMemberships: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get unread notification count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    // Update last activity
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActivityAt: new Date() },
    });

    const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        roles: user.roles.map((r) => r.role),
        householdIds: user.householdMemberships.map((h) => h.householdId),
        ageBand,
      },
      unreadNotifications,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
