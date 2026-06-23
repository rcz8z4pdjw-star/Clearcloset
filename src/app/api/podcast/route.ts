import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { awardXP } from '@/lib/gamification';
import { getAgeBand } from '@/lib/utils';

// Get podcast episodes
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const saved = searchParams.get('saved');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user's age band
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ageBand = getAgeBand(userData.dateOfBirth, userData.ageBandOverride);

    // Build where clause
    const where: any = {
      isPublished: true,
      ageBands: { has: ageBand },
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get episodes
    const episodes = await prisma.podcastEpisode.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        host: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get user's saved and progress
    const userProgress = await prisma.podcastProgress.findMany({
      where: { userId: user.id },
      select: {
        episodeId: true,
        progress: true,
        completed: true,
        savedAt: true,
      },
    });

    const progressMap = new Map(userProgress.map(p => [p.episodeId, p]));

    // Filter by saved if requested
    let filteredEpisodes = episodes;
    if (saved === 'true') {
      const savedIds = userProgress.filter(p => p.savedAt).map(p => p.episodeId);
      filteredEpisodes = episodes.filter(e => savedIds.includes(e.id));
    }

    const formattedEpisodes = filteredEpisodes.map(ep => {
      const progress = progressMap.get(ep.id);
      return {
        id: ep.id,
        title: ep.title,
        description: ep.description,
        duration: ep.duration,
        publishedAt: ep.publishedAt,
        category: ep.category,
        host: ep.host ? `${ep.host.firstName} ${ep.host.lastName}` : null,
        guestName: ep.guestName,
        audioUrl: ep.audioUrl,
        thumbnailUrl: ep.thumbnailUrl,
        plays: ep.plays,
        progress: progress?.progress || 0,
        completed: progress?.completed || false,
        saved: !!progress?.savedAt,
      };
    });

    // Stats
    const completedCount = userProgress.filter(p => p.completed).length;
    const savedCount = userProgress.filter(p => p.savedAt).length;
    const totalListenTime = userProgress.reduce((sum, p) => sum + (p.progress || 0), 0);

    return NextResponse.json({
      episodes: formattedEpisodes,
      stats: {
        total: episodes.length,
        completed: completedCount,
        saved: savedCount,
        totalListenTime,
      },
    });
  } catch (error) {
    console.error('Get podcast episodes error:', error);
    return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
  }
}

// Update episode progress or save
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { episodeId, action, progress } = body;

    if (!episodeId || !action) {
      return NextResponse.json({ error: 'Episode ID and action are required' }, { status: 400 });
    }

    const episode = await prisma.podcastEpisode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Get or create progress record
    let userProgress = await prisma.podcastProgress.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId,
        },
      },
    });

    if (action === 'update_progress') {
      const progressPercent = Math.min(Math.max(progress || 0, 0), 100);
      const isNewlyCompleted = progressPercent >= 95 && (!userProgress || !userProgress.completed);

      if (userProgress) {
        await prisma.podcastProgress.update({
          where: { id: userProgress.id },
          data: {
            progress: progressPercent,
            completed: progressPercent >= 95,
            completedAt: progressPercent >= 95 ? new Date() : null,
          },
        });
      } else {
        await prisma.podcastProgress.create({
          data: {
            userId: user.id,
            episodeId,
            progress: progressPercent,
            completed: progressPercent >= 95,
            completedAt: progressPercent >= 95 ? new Date() : null,
          },
        });
      }

      // Update play count
      if (!userProgress || userProgress.progress === 0) {
        await prisma.podcastEpisode.update({
          where: { id: episodeId },
          data: { plays: { increment: 1 } },
        });
      }

      // Award XP for completion
      let xpAwarded = 0;
      if (isNewlyCompleted) {
        xpAwarded = 50;
        await awardXP(user.id, xpAwarded, `Completed podcast: ${episode.title}`, 'podcast_complete', episodeId);

        // Log activity
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: 'podcast_complete',
            title: `Finished listening to "${episode.title}"`,
            sourceId: episodeId,
          },
        });
      }

      return NextResponse.json({
        success: true,
        progress: progressPercent,
        completed: progressPercent >= 95,
        xpAwarded,
      });
    }

    if (action === 'save') {
      if (userProgress) {
        await prisma.podcastProgress.update({
          where: { id: userProgress.id },
          data: { savedAt: new Date() },
        });
      } else {
        await prisma.podcastProgress.create({
          data: {
            userId: user.id,
            episodeId,
            progress: 0,
            savedAt: new Date(),
          },
        });
      }

      return NextResponse.json({ success: true, saved: true });
    }

    if (action === 'unsave') {
      if (userProgress) {
        await prisma.podcastProgress.update({
          where: { id: userProgress.id },
          data: { savedAt: null },
        });
      }

      return NextResponse.json({ success: true, saved: false });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Podcast action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
