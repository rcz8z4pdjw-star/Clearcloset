import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP, XP_REWARDS } from '@/lib/gamification';

// Get mentorship data (mentees for mentors, mentor for members)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'auto';

    // Determine view based on role or parameter
    const isMentor = ['MENTOR', 'CIO', 'ADMIN', 'PROGRAM_DIRECTOR'].includes(userData.role);
    const showMentees = view === 'mentees' || (view === 'auto' && isMentor);

    if (showMentees && isMentor) {
      // Get mentees for this mentor
      const mentorships = await prisma.mentorAssignment.findMany({
        where: { mentorId: user.id, status: 'active' },
        include: {
          mentee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              dateOfBirth: true,
              ageBandOverride: true,
              totalXP: true,
              currentLevel: true,
              currentStreak: true,
              lastActiveAt: true,
              trackEnrollments: {
                where: { completedAt: null },
                include: {
                  track: true,
                },
                orderBy: { enrolledAt: 'desc' },
                take: 1,
              },
              _count: {
                select: {
                  lessonProgress: { where: { completedAt: { not: null } } },
                },
              },
            },
          },
        },
      });

      // Get upcoming sessions
      const sessions = await prisma.mentorSession.findMany({
        where: {
          mentorId: user.id,
          scheduledAt: { gte: new Date() },
          status: { not: 'cancelled' },
        },
        include: {
          mentee: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      });

      // Get recent mentee activity
      const menteeIds = mentorships.map(m => m.menteeId);
      const recentActivity = await prisma.activityLog.findMany({
        where: {
          userId: { in: menteeIds },
        },
        include: {
          user: { select: { firstName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Format mentees
      const mentees = mentorships.map(m => {
        const age = m.mentee.dateOfBirth
          ? Math.floor((Date.now() - new Date(m.mentee.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        const currentTrack = m.mentee.trackEnrollments[0];

        return {
          id: m.mentee.id,
          name: `${m.mentee.firstName} ${m.mentee.lastName}`,
          avatar: m.mentee.avatarUrl,
          age,
          level: m.mentee.currentLevel || 1,
          xp: m.mentee.totalXP || 0,
          streak: m.mentee.currentStreak || 0,
          lessonsCompleted: m.mentee._count.lessonProgress,
          currentTrack: currentTrack?.track.name || null,
          lastActive: m.mentee.lastActiveAt,
          assignedAt: m.createdAt,
          notes: m.notes,
        };
      });

      // Stats
      const stats = {
        totalMentees: mentees.length,
        activeMentees: mentees.filter(m =>
          m.lastActive && (Date.now() - new Date(m.lastActive).getTime()) < 7 * 24 * 60 * 60 * 1000
        ).length,
        upcomingSessions: sessions.length,
        totalSessions: await prisma.mentorSession.count({
          where: { mentorId: user.id, status: 'completed' },
        }),
      };

      return NextResponse.json({
        role: 'mentor',
        mentees,
        upcomingSessions: sessions.map(s => ({
          id: s.id,
          mentee: `${s.mentee.firstName} ${s.mentee.lastName}`,
          topic: s.topic,
          scheduledAt: s.scheduledAt,
          duration: s.durationMinutes,
        })),
        recentActivity: recentActivity.map(a => ({
          user: a.user.firstName,
          type: a.activityType,
          entityType: a.entityType,
          timestamp: a.createdAt,
        })),
        stats,
      });
    } else {
      // Get mentor for this member
      const mentorship = await prisma.mentorAssignment.findFirst({
        where: { menteeId: user.id, status: 'active' },
        include: {
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              bio: true,
              title: true,
            },
          },
        },
      });

      // Get upcoming sessions with mentor
      const sessions = mentorship ? await prisma.mentorSession.findMany({
        where: {
          menteeId: user.id,
          scheduledAt: { gte: new Date() },
          status: { not: 'cancelled' },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }) : [];

      // Get past sessions
      const pastSessions = mentorship ? await prisma.mentorSession.findMany({
        where: {
          menteeId: user.id,
          status: 'completed',
        },
        orderBy: { scheduledAt: 'desc' },
        take: 5,
      }) : [];

      return NextResponse.json({
        role: 'mentee',
        mentor: mentorship ? {
          id: mentorship.mentor.id,
          name: `${mentorship.mentor.firstName} ${mentorship.mentor.lastName}`,
          avatar: mentorship.mentor.avatarUrl,
          bio: mentorship.mentor.bio,
          title: mentorship.mentor.title,
          assignedAt: mentorship.createdAt,
        } : null,
        upcomingSessions: sessions.map(s => ({
          id: s.id,
          topic: s.topic,
          scheduledAt: s.scheduledAt,
          duration: s.durationMinutes,
        })),
        pastSessions: pastSessions.map(s => ({
          id: s.id,
          topic: s.topic,
          scheduledAt: s.scheduledAt,
          notes: s.notes,
        })),
      });
    }
  } catch (error) {
    console.error('Get mentorship error:', error);
    return NextResponse.json({ error: 'Failed to fetch mentorship data' }, { status: 500 });
  }
}

// Schedule a mentoring session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { menteeId, topic, scheduledAt, durationMinutes, notes } = body;

    if (!menteeId || !topic || !scheduledAt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify mentorship relationship
    const mentorship = await prisma.mentorAssignment.findFirst({
      where: {
        mentorId: user.id,
        menteeId,
        status: 'active',
      },
    });

    if (!mentorship) {
      return NextResponse.json({ error: 'No active mentorship with this user' }, { status: 403 });
    }

    // Create session
    const session = await prisma.mentorSession.create({
      data: {
        mentorId: user.id,
        menteeId,
        topic,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 30,
        notes,
        status: 'scheduled',
      },
    });

    // Notify mentee
    const mentor = await prisma.user.findUnique({
      where: { id: user.id },
      select: { firstName: true },
    });

    await prisma.notification.create({
      data: {
        userId: menteeId,
        type: 'MENTOR_SESSION',
        title: 'New Mentoring Session Scheduled',
        message: `${mentor?.firstName} has scheduled a session on "${topic}" for ${new Date(scheduledAt).toLocaleDateString()}`,
        link: '/dashboard/mentorship',
      },
    });

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Schedule session error:', error);
    return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 });
  }
}

// Complete a session / Add notes
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, action, notes, feedback } = body;

    if (!sessionId || !action) {
      return NextResponse.json({ error: 'Session ID and action required' }, { status: 400 });
    }

    const session = await prisma.mentorSession.findUnique({
      where: { id: sessionId },
      include: {
        mentor: { select: { firstName: true } },
        mentee: { select: { firstName: true } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify user is part of this session
    if (session.mentorId !== user.id && session.menteeId !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (action === 'complete') {
      await prisma.mentorSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          notes,
          completedAt: new Date(),
        },
      });

      // Award XP to mentee for attending
      await awardXP(
        session.menteeId,
        XP_REWARDS.ATTEND_SESSION,
        `Attended mentoring session: ${session.topic}`,
        'session',
        sessionId
      );

      return NextResponse.json({ success: true, action: 'completed' });
    } else if (action === 'cancel') {
      await prisma.mentorSession.update({
        where: { id: sessionId },
        data: { status: 'cancelled' },
      });

      // Notify other party
      const notifyUserId = session.mentorId === user.id ? session.menteeId : session.mentorId;
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: 'SESSION_CANCELLED',
          title: 'Mentoring Session Cancelled',
          message: `The session on "${session.topic}" has been cancelled.`,
          link: '/dashboard/mentorship',
        },
      });

      return NextResponse.json({ success: true, action: 'cancelled' });
    } else if (action === 'addNotes') {
      await prisma.mentorSession.update({
        where: { id: sessionId },
        data: { notes },
      });

      return NextResponse.json({ success: true, action: 'notes_added' });
    } else if (action === 'feedback') {
      // Update mentorship with feedback
      await prisma.mentorAssignment.updateMany({
        where: {
          mentorId: session.mentorId,
          menteeId: session.menteeId,
        },
        data: { notes: feedback },
      });

      return NextResponse.json({ success: true, action: 'feedback_added' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
