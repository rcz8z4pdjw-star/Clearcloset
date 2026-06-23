import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's timeline/activity feed
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';

    // Build filter conditions based on filter type
    let typeFilter: string[] = [];

    switch (filter) {
      case 'achievements':
        typeFilter = ['achievement', 'level_up', 'certificate', 'badge'];
        break;
      case 'learning':
        typeFilter = ['lesson_complete', 'quiz_complete', 'track_complete', 'module_complete'];
        break;
      case 'social':
        typeFilter = ['connection', 'comment', 'mention', 'like'];
        break;
      case 'goals':
        typeFilter = ['goal_created', 'goal_progress', 'goal_completed', 'streak'];
        break;
      default:
        typeFilter = [];
    }

    const where: any = { userId: user.id };
    if (typeFilter.length > 0) {
      where.type = { in: typeFilter };
    }

    // Get timeline events
    const events = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Get XP logs for XP information
    const xpLogs = await prisma.xPLog.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: events.length > 0 ? events[events.length - 1].createdAt : new Date(0),
        },
      },
      select: {
        amount: true,
        source: true,
        sourceId: true,
        createdAt: true,
      },
    });

    // Create a map of XP by source
    const xpBySource: Record<string, number> = {};
    xpLogs.forEach(log => {
      if (log.sourceId) {
        xpBySource[log.sourceId] = (xpBySource[log.sourceId] || 0) + log.amount;
      }
    });

    // Format timeline events
    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.type,
      title: event.title,
      description: event.description,
      timestamp: event.createdAt,
      xp: xpBySource[event.sourceId || ''] || event.xpAwarded || 0,
      icon: getEventIcon(event.type),
      highlight: isHighlightEvent(event.type),
      metadata: event.metadata,
      user: {
        name: `${event.user.firstName} ${event.user.lastName?.charAt(0) || ''}.`,
        avatar: event.user.avatarUrl,
      },
    }));

    // Get total count for pagination
    const totalCount = await prisma.activityLog.count({ where });

    // Calculate summary stats
    const totalXP = formattedEvents.reduce((sum, e) => sum + (e.xp || 0), 0);
    const achievementCount = formattedEvents.filter(e =>
      ['achievement', 'badge', 'certificate'].includes(e.type)
    ).length;
    const lessonCount = formattedEvents.filter(e =>
      e.type === 'lesson_complete'
    ).length;

    return NextResponse.json({
      events: formattedEvents,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + events.length < totalCount,
      },
      stats: {
        totalXP,
        achievementCount,
        lessonCount,
      },
    });
  } catch (error) {
    console.error('Get timeline error:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}

// Create a new timeline event (internal use)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, description, sourceId, metadata } = body;

    if (!type || !title) {
      return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
    }

    const event = await prisma.activityLog.create({
      data: {
        userId: user.id,
        type,
        title,
        description,
        sourceId,
        metadata,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Create timeline event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

// Helper function to get icon for event type
function getEventIcon(type: string): string {
  const iconMap: Record<string, string> = {
    achievement: 'trophy',
    badge: 'award',
    certificate: 'graduation',
    level_up: 'star',
    lesson_complete: 'book',
    quiz_complete: 'check',
    track_complete: 'flag',
    module_complete: 'layers',
    streak: 'flame',
    goal_created: 'target',
    goal_progress: 'trending',
    goal_completed: 'check',
    connection: 'users',
    comment: 'message',
    mention: 'at',
    like: 'heart',
    workshop: 'calendar',
    simulation: 'zap',
    referral: 'gift',
  };

  return iconMap[type] || 'star';
}

// Helper function to determine if event should be highlighted
function isHighlightEvent(type: string): boolean {
  const highlightTypes = [
    'achievement',
    'badge',
    'certificate',
    'level_up',
    'track_complete',
    'goal_completed',
  ];

  return highlightTypes.includes(type);
}
