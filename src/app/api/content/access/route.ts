import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  canAccessContent,
  getTopicsForAgeBand,
  getDifficultyLevelsForAgeBand,
  getRecommendedTracks,
  AgeBand,
} from '@/lib/content-filter';

// Check if user can access specific content
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('type');

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ageBand: true,
        role: true,
        birthDate: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userAgeBand = (userData.ageBand || 'LAUNCH') as AgeBand;

    // If checking specific content access
    if (contentId && contentType) {
      let content: any = null;

      switch (contentType) {
        case 'lesson':
          content = await prisma.lesson.findUnique({
            where: { id: contentId },
            select: { id: true, title: true, minAgeBand: true, maxAgeBand: true },
          });
          break;
        case 'track':
          content = await prisma.track.findUnique({
            where: { id: contentId },
            select: { id: true, title: true, minAgeBand: true, maxAgeBand: true },
          });
          break;
        case 'resource':
          content = await prisma.resource.findUnique({
            where: { id: contentId },
            select: { id: true, title: true, minAgeBand: true, maxAgeBand: true },
          });
          break;
      }

      if (!content) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }

      const hasAccess = canAccessContent(
        userAgeBand,
        content.minAgeBand as AgeBand,
        content.maxAgeBand as AgeBand | undefined
      );

      return NextResponse.json({
        hasAccess,
        content: {
          id: content.id,
          title: content.title,
          minAgeBand: content.minAgeBand,
          maxAgeBand: content.maxAgeBand,
        },
        userAgeBand,
        reason: hasAccess
          ? 'Content is appropriate for your age band'
          : 'Content is not available for your age band',
      });
    }

    // Return user's content access profile
    const topics = getTopicsForAgeBand(userAgeBand);
    const difficulties = getDifficultyLevelsForAgeBand(userAgeBand);
    const recommendedTracks = getRecommendedTracks(userAgeBand);

    return NextResponse.json({
      userAgeBand,
      allowedTopics: topics,
      allowedDifficulties: difficulties,
      recommendedTracks,
      accessLevel: getAccessLevel(userAgeBand),
    });
  } catch (error) {
    console.error('Content access check error:', error);
    return NextResponse.json(
      { error: 'Failed to check content access' },
      { status: 500 }
    );
  }
}

function getAccessLevel(ageBand: AgeBand): string {
  const levels: Record<AgeBand, string> = {
    JUNIOR_FOUNDATIONS: 'foundational',
    TEEN_SKILLS: 'developing',
    LAUNCH: 'intermediate',
    STEWARDSHIP_PRACTICUM: 'advanced',
    LEADERSHIP: 'expert',
  };
  return levels[ageBand] || 'intermediate';
}
