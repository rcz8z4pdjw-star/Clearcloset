import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';

// Get glossary terms
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const letter = searchParams.get('letter');
    const savedOnly = searchParams.get('saved') === 'true';

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    const ageBand = userData ? getAgeBand(userData.dateOfBirth, userData.ageBandOverride) : 'LAUNCH';

    // Build where clause
    const where: any = {
      isPublished: true,
    };

    if (search) {
      where.OR = [
        { term: { contains: search, mode: 'insensitive' } },
        { definition: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      where.difficulty = difficulty;
    }

    if (letter) {
      where.term = { startsWith: letter, mode: 'insensitive' };
    }

    // Get terms
    let terms = await prisma.glossaryTerm.findMany({
      where,
      orderBy: { term: 'asc' },
      include: {
        savedBy: {
          where: { userId: user.id },
        },
      },
    });

    // Get all saved terms if savedOnly filter
    if (savedOnly) {
      terms = terms.filter(t => t.savedBy.length > 0);
    }

    // Format terms
    const formattedTerms = terms.map(term => ({
      id: term.id,
      term: term.term,
      definition: term.definition,
      example: term.example,
      category: term.category,
      difficulty: term.difficulty,
      relatedTerms: term.relatedTerms,
      saved: term.savedBy.length > 0,
    }));

    // Get all unique tags for filtering
    const allCategories = await prisma.glossaryTerm.findMany({
      where: { isPublished: true },
      select: { category: true },
      distinct: ['category'],
    });

    // Get stats
    const stats = {
      totalTerms: await prisma.glossaryTerm.count({ where: { isPublished: true } }),
      savedTerms: await prisma.savedGlossaryTerm.count({ where: { userId: user.id } }),
      learnedTerms: await prisma.learnedGlossaryTerm.count({ where: { userId: user.id } }),
    };

    return NextResponse.json({
      terms: formattedTerms,
      categories: allCategories.map(c => c.category),
      stats,
    });
  } catch (error) {
    console.error('Get glossary error:', error);
    return NextResponse.json({ error: 'Failed to fetch glossary' }, { status: 500 });
  }
}

// Save/unsave a term
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { termId, action } = body;

    if (!termId || !action) {
      return NextResponse.json({ error: 'Term ID and action required' }, { status: 400 });
    }

    if (action === 'save') {
      // Check if already saved
      const existing = await prisma.savedGlossaryTerm.findUnique({
        where: {
          userId_termId: {
            userId: user.id,
            termId,
          },
        },
      });

      if (!existing) {
        await prisma.savedGlossaryTerm.create({
          data: {
            userId: user.id,
            termId,
          },
        });
      }

      return NextResponse.json({ success: true, saved: true });
    } else if (action === 'unsave') {
      await prisma.savedGlossaryTerm.deleteMany({
        where: {
          userId: user.id,
          termId,
        },
      });

      return NextResponse.json({ success: true, saved: false });
    } else if (action === 'learn') {
      // Mark term as learned
      const existing = await prisma.learnedGlossaryTerm.findUnique({
        where: {
          userId_termId: {
            userId: user.id,
            termId,
          },
        },
      });

      if (!existing) {
        await prisma.learnedGlossaryTerm.create({
          data: {
            userId: user.id,
            termId,
          },
        });

        // Award XP for learning new term
        await prisma.user.update({
          where: { id: user.id },
          data: { totalXP: { increment: 5 } },
        });
      }

      return NextResponse.json({ success: true, learned: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Glossary action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}

// Get term of the day
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get a random term based on today's date as seed
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const termsCount = await prisma.glossaryTerm.count({ where: { isPublished: true } });
    const randomIndex = seed % termsCount;

    const term = await prisma.glossaryTerm.findFirst({
      where: { isPublished: true },
      skip: randomIndex,
      include: {
        savedBy: { where: { userId: user.id } },
        learnedBy: { where: { userId: user.id } },
      },
    });

    if (!term) {
      return NextResponse.json({ error: 'No terms available' }, { status: 404 });
    }

    return NextResponse.json({
      termOfTheDay: {
        id: term.id,
        term: term.term,
        definition: term.definition,
        example: term.example,
        category: term.category,
        saved: term.savedBy.length > 0,
        learned: term.learnedBy.length > 0,
      },
    });
  } catch (error) {
    console.error('Get term of the day error:', error);
    return NextResponse.json({ error: 'Failed to fetch term of the day' }, { status: 500 });
  }
}
