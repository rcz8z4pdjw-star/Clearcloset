import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';
import { awardXP, XP_REWARDS } from '@/lib/gamification';

// Get workshops
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category');

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ageBand = getAgeBand(userData.dateOfBirth, userData.ageBandOverride);
    const now = new Date();

    // Build where clause
    const where: any = {
      isPublished: true,
      ageBands: { has: ageBand },
    };

    if (status === 'upcoming') {
      where.scheduledAt = { gte: now };
    } else if (status === 'past') {
      where.scheduledAt = { lt: now };
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const workshops = await prisma.workshop.findMany({
      where,
      include: {
        instructor: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        registrations: {
          where: { userId: user.id },
        },
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Get user's attended workshops
    const attendedWorkshops = await prisma.workshopRegistration.findMany({
      where: {
        userId: user.id,
        attended: true,
      },
      select: { workshopId: true },
    });

    const attendedIds = new Set(attendedWorkshops.map(w => w.workshopId));

    const formattedWorkshops = workshops.map(workshop => ({
      id: workshop.id,
      title: workshop.title,
      description: workshop.description,
      instructor: {
        id: workshop.instructor.id,
        name: `${workshop.instructor.firstName} ${workshop.instructor.lastName}`,
        avatar: workshop.instructor.avatarUrl,
      },
      scheduledAt: workshop.scheduledAt,
      duration: workshop.durationMinutes,
      category: workshop.category,
      level: workshop.level,
      maxCapacity: workshop.maxCapacity,
      enrolled: workshop._count.registrations,
      isRegistered: workshop.registrations.length > 0,
      hasAttended: attendedIds.has(workshop.id),
      xpReward: workshop.xpReward,
      recordingUrl: workshop.recordingUrl,
      status: workshop.scheduledAt > now ? 'upcoming' : 'past',
    }));

    // Stats
    const stats = {
      totalWorkshops: workshops.length,
      attended: attendedWorkshops.length,
      xpEarned: attendedWorkshops.length * 100, // Estimate
      upcoming: workshops.filter(w => w.scheduledAt > now).length,
    };

    return NextResponse.json({
      workshops: formattedWorkshops,
      stats,
    });
  } catch (error) {
    console.error('Get workshops error:', error);
    return NextResponse.json({ error: 'Failed to fetch workshops' }, { status: 500 });
  }
}

// Register for workshop
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workshopId } = body;

    if (!workshopId) {
      return NextResponse.json({ error: 'Workshop ID is required' }, { status: 400 });
    }

    // Get workshop details
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 });
    }

    // Check if already registered
    const existingRegistration = await prisma.workshopRegistration.findUnique({
      where: {
        userId_workshopId: {
          userId: user.id,
          workshopId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json({ error: 'Already registered for this workshop' }, { status: 400 });
    }

    // Check capacity
    if (workshop.maxCapacity && workshop._count.registrations >= workshop.maxCapacity) {
      return NextResponse.json({ error: 'Workshop is full' }, { status: 400 });
    }

    // Create registration
    const registration = await prisma.workshopRegistration.create({
      data: {
        userId: user.id,
        workshopId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'WORKSHOP_REMINDER',
        title: `Registered for: ${workshop.title}`,
        message: `You're registered! The workshop starts on ${workshop.scheduledAt.toLocaleDateString()}.`,
        link: `/dashboard/workshops/${workshopId}`,
      },
    });

    return NextResponse.json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error('Register workshop error:', error);
    return NextResponse.json({ error: 'Failed to register for workshop' }, { status: 500 });
  }
}

// Mark attendance / unregister
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workshopId, action } = body;

    if (!workshopId || !action) {
      return NextResponse.json({ error: 'Workshop ID and action are required' }, { status: 400 });
    }

    const registration = await prisma.workshopRegistration.findUnique({
      where: {
        userId_workshopId: {
          userId: user.id,
          workshopId,
        },
      },
      include: { workshop: true },
    });

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    if (action === 'attend') {
      // Mark as attended and award XP
      await prisma.workshopRegistration.update({
        where: { id: registration.id },
        data: { attended: true },
      });

      // Award XP
      const xpResult = await awardXP(
        user.id,
        registration.workshop.xpReward || 100,
        `Attended workshop: ${registration.workshop.title}`,
        'workshop',
        workshopId
      );

      return NextResponse.json({
        success: true,
        action: 'attended',
        xp: xpResult,
      });
    } else if (action === 'unregister') {
      // Remove registration
      await prisma.workshopRegistration.delete({
        where: { id: registration.id },
      });

      return NextResponse.json({
        success: true,
        action: 'unregistered',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update workshop registration error:', error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
