import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';

// Get journal entries
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        linkedLesson: {
          select: { id: true, title: true },
        },
      },
    });

    // Get all unique tags
    const allEntries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      select: { tags: true },
    });

    const allTags = [...new Set(allEntries.flatMap(e => e.tags))];

    // Stats
    const totalEntries = await prisma.journalEntry.count({ where: { userId: user.id } });

    // Calculate streak
    const recentEntries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const hasEntry = recentEntries.some(e => {
        const entryDate = new Date(e.createdAt);
        return entryDate >= checkDate && entryDate < nextDate;
      });

      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return NextResponse.json({
      entries,
      tags: allTags,
      stats: {
        totalEntries,
        streak,
        xpEarned: totalEntries * 10,
      },
    });
  } catch (error) {
    console.error('Get journal entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

// Create journal entry
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, mood, tags, isPrivate, linkedLessonId } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        title,
        content,
        mood,
        tags: tags || [],
        isPrivate: isPrivate ?? false,
        linkedLessonId,
      },
    });

    // Award XP for journaling
    const xpResult = await awardXP(user.id, 10, 'Created journal entry', 'journal', entry.id);

    // Check for journaling streak badge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekEntries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: weekAgo },
      },
      select: { createdAt: true },
    });

    // Check if user has entries for each of the last 7 days
    const uniqueDays = new Set(
      weekEntries.map(e => new Date(e.createdAt).toISOString().split('T')[0])
    );

    if (uniqueDays.size >= 7) {
      // Award 7-day journaling badge
      const badge = await prisma.badge.findFirst({
        where: { name: 'Journaling Streak' },
      });

      if (badge) {
        const existingBadge = await prisma.userBadge.findFirst({
          where: { userId: user.id, badgeId: badge.id },
        });

        if (!existingBadge) {
          await prisma.userBadge.create({
            data: { userId: user.id, badgeId: badge.id },
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'BADGE_EARNED',
              title: 'New Badge: Journaling Streak!',
              message: 'You journaled for 7 days in a row!',
              link: '/dashboard/badges',
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      entry,
      xp: xpResult,
    });
  } catch (error) {
    console.error('Create journal entry error:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

// Update journal entry
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, mood, tags, isPrivate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entry = await prisma.journalEntry.update({
      where: { id },
      data: {
        title,
        content,
        mood,
        tags,
        isPrivate,
      },
    });

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    console.error('Update journal entry error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

// Delete journal entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingEntry = await prisma.journalEntry.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await prisma.journalEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
