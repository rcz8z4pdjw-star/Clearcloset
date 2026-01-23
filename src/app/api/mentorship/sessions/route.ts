import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hasAnyRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { notifySessionScheduled } from '@/lib/notifications';

// Get mentorship sessions
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role'); // 'mentor' or 'mentee'

    let whereClause: any = {};

    // Filter by role
    if (role === 'mentor' || hasAnyRole(user, ['MENTOR', 'CIO', 'PROGRAM_DIRECTOR'])) {
      whereClause.mentorId = user.id;
    } else {
      whereClause.menteeId = user.id;
    }

    // Filter by status
    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const sessions = await prisma.mentorshipSession.findMany({
      where: whereClause,
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true,
          },
        },
        notes: {
          where: {
            OR: [
              { authorId: user.id },
              { isPrivate: false },
              ...(hasAnyRole(user, ['MENTOR', 'CIO', 'PROGRAM_DIRECTOR'])
                ? [{ isMentorPrivate: true }]
                : []),
            ],
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Create a session request
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mentorId, scheduledAt, duration, location, agenda, calendarLink } = body;

    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor ID is required' },
        { status: 400 }
      );
    }

    // Verify mentor exists and is actually a mentor
    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      include: {
        roles: true,
      },
    });

    if (!mentor || !mentor.roles.some((r) => r.role === 'MENTOR')) {
      return NextResponse.json(
        { error: 'Invalid mentor' },
        { status: 400 }
      );
    }

    // Check for active assignment
    const assignment = await prisma.mentorAssignment.findFirst({
      where: {
        mentorId,
        menteeId: user.id,
        isActive: true,
      },
    });

    const session = await prisma.mentorshipSession.create({
      data: {
        assignmentId: assignment?.id,
        mentorId,
        menteeId: user.id,
        status: scheduledAt ? 'SCHEDULED' : 'REQUESTED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        duration,
        location,
        agenda,
        calendarLink,
      },
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify mentor of session request
    if (scheduledAt) {
      await notifySessionScheduled(
        mentorId,
        `${user.firstName} ${user.lastName}`,
        new Date(scheduledAt)
      );
    }

    await createAuditLog({
      userId: user.id,
      action: 'CREATE_SESSION',
      entityType: 'MentorshipSession',
      entityId: session.id,
      newValues: {
        mentorId,
        status: session.status,
        scheduledAt,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Update session
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, status, scheduledAt, summary, completedAt } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get existing session
    const existingSession = await prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canUpdate =
      existingSession.mentorId === user.id ||
      existingSession.menteeId === user.id ||
      hasAnyRole(user, ['ADMIN', 'PROGRAM_DIRECTOR']);

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Not authorized to update this session' },
        { status: 403 }
      );
    }

    const session = await prisma.mentorshipSession.update({
      where: { id: sessionId },
      data: {
        status: status?.toUpperCase(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        summary,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
      include: {
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify mentee if session was scheduled by mentor
    if (status === 'SCHEDULED' && existingSession.status === 'REQUESTED') {
      await notifySessionScheduled(
        session.menteeId,
        `${session.mentor.firstName} ${session.mentor.lastName}`,
        new Date(scheduledAt || session.scheduledAt!)
      );
    }

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_SESSION',
      entityType: 'MentorshipSession',
      entityId: sessionId,
      oldValues: { status: existingSession.status },
      newValues: { status: session.status },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
