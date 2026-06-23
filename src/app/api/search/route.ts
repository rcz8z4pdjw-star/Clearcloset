import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'all', 'lessons', 'tracks', 'users', 'quizzes'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    // Get user's age band for filtering
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });
    const userAgeBand = fullUser ? getAgeBand(fullUser.dateOfBirth, fullUser.ageBandOverride) : null;

    const results: any = {};

    // Search lessons
    if (!type || type === 'all' || type === 'lessons') {
      const lessons = await prisma.lesson.findMany({
        where: {
          isPublished: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          // Filter by age band if applicable
          ...(userAgeBand && {
            module: {
              track: {
                ageBands: { has: userAgeBand },
              },
            },
          }),
        },
        include: {
          module: {
            include: {
              track: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        take: limit,
      });

      results.lessons = lessons.map((lesson) => ({
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        description: lesson.description,
        duration: lesson.estimatedMinutes,
        track: lesson.module?.track?.name,
        trackSlug: lesson.module?.track?.slug,
        moduleId: lesson.moduleId,
      }));
    }

    // Search tracks
    if (!type || type === 'all' || type === 'tracks') {
      const tracks = await prisma.track.findMany({
        where: {
          isPublished: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          ...(userAgeBand && {
            ageBands: { has: userAgeBand },
          }),
        },
        include: {
          _count: {
            select: { modules: true },
          },
        },
        take: limit,
      });

      results.tracks = tracks.map((track) => ({
        id: track.id,
        type: 'track',
        title: track.name,
        description: track.description,
        slug: track.slug,
        moduleCount: track._count.modules,
        difficulty: track.difficulty,
      }));
    }

    // Search quizzes
    if (!type || type === 'all' || type === 'quizzes') {
      const quizzes = await prisma.quiz.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          lesson: {
            include: {
              module: {
                include: { track: true },
              },
            },
          },
          _count: {
            select: { questions: true },
          },
        },
        take: limit,
      });

      results.quizzes = quizzes.map((quiz) => ({
        id: quiz.id,
        type: 'quiz',
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz._count.questions,
        passingScore: quiz.passingScore,
        lesson: quiz.lesson?.title,
        track: quiz.lesson?.module?.track?.name,
      }));
    }

    // Search users (connections/mentors)
    if (!type || type === 'all' || type === 'users') {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
          // Don't include the searching user
          NOT: { id: user.id },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          roles: {
            select: { role: true },
          },
        },
        take: limit,
      });

      results.users = users.map((u) => ({
        id: u.id,
        type: 'user',
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.avatarUrl,
        role: u.roles[0]?.role || 'MEMBER',
      }));
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce(
      (sum: number, arr: any) => sum + (arr?.length || 0),
      0
    );

    // Get trending searches (would be stored/cached in production)
    const trendingSearches = [
      { term: 'compound interest', count: 245 },
      { term: 'budgeting', count: 198 },
      { term: 'investing basics', count: 176 },
      { term: 'emergency fund', count: 154 },
      { term: 'stock market', count: 132 },
    ];

    return NextResponse.json({
      query,
      totalResults,
      results,
      trending: trendingSearches,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// Record search for analytics
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query, resultClicked } = body;

    // In production: Store search analytics
    // - Track popular searches
    // - Track click-through rates
    // - Personalize search results

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json({ error: 'Failed to record search' }, { status: 500 });
  }
}
