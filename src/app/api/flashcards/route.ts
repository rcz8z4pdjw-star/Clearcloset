import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';

// Get flashcard decks for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const deckId = searchParams.get('deckId');

    // Get user's age band for filtering age-appropriate content
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dateOfBirth: true, ageBandOverride: true },
    });

    const ageBand = fullUser ? getAgeBand(fullUser.dateOfBirth, fullUser.ageBandOverride) : null;

    // If requesting a specific deck with cards
    if (deckId) {
      // Simulated deck with cards - in production, fetch from database
      const deck = {
        id: deckId,
        name: 'Financial Terms',
        description: 'Essential financial vocabulary',
        category: 'basics',
        cards: [
          {
            id: 'c1',
            front: 'What is Compound Interest?',
            back: 'Interest calculated on the initial principal and accumulated interest from previous periods.',
            hint: 'Think about interest earning interest...',
            mastered: false,
            lastReviewed: null,
          },
          {
            id: 'c2',
            front: 'What is an ETF?',
            back: 'Exchange-Traded Fund - A type of investment fund that trades on stock exchanges.',
            hint: 'Combines features of mutual funds and stocks...',
            mastered: true,
            lastReviewed: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'c3',
            front: 'What is Diversification?',
            back: 'Spreading investments across different assets to reduce risk.',
            hint: 'Don\'t put all eggs in one basket...',
            mastered: false,
            lastReviewed: null,
          },
        ],
        stats: {
          totalCards: 3,
          mastered: 1,
          needsReview: 2,
          masteryPercent: 33,
        },
      };

      return NextResponse.json({ deck });
    }

    // Get all decks
    const decks = [
      {
        id: 'd1',
        name: 'Financial Terms',
        description: 'Essential financial vocabulary',
        cardCount: 25,
        mastered: 12,
        category: 'basics',
        color: 'from-blue-500 to-indigo-500',
        ageBands: ['JUNIOR_FOUNDATIONS', 'TEEN_SKILLS', 'LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
      },
      {
        id: 'd2',
        name: 'Investing Concepts',
        description: 'Key investing terminology',
        cardCount: 30,
        mastered: 8,
        category: 'investing',
        color: 'from-green-500 to-emerald-500',
        ageBands: ['TEEN_SKILLS', 'LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
      },
      {
        id: 'd3',
        name: 'Budgeting Basics',
        description: 'Budgeting terms and methods',
        cardCount: 20,
        mastered: 15,
        category: 'budgeting',
        color: 'from-purple-500 to-pink-500',
        ageBands: ['JUNIOR_FOUNDATIONS', 'TEEN_SKILLS', 'LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
      },
    ];

    // Filter by category if provided
    let filteredDecks = decks;
    if (category) {
      filteredDecks = decks.filter((d) => d.category === category);
    }

    // Filter by age band if user has one
    if (ageBand) {
      filteredDecks = filteredDecks.filter((d) => d.ageBands.includes(ageBand));
    }

    // Calculate overall stats
    const stats = {
      totalDecks: filteredDecks.length,
      totalCards: filteredDecks.reduce((sum, d) => sum + d.cardCount, 0),
      totalMastered: filteredDecks.reduce((sum, d) => sum + d.mastered, 0),
      studyStreak: 5, // Would be calculated from user activity
    };

    return NextResponse.json({ decks: filteredDecks, stats });
  } catch (error) {
    console.error('Get flashcards error:', error);
    return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
  }
}

// Record flashcard study session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { deckId, cardId, action, sessionData } = body;

    // Handle different actions
    if (action === 'mark_mastered') {
      // Mark a card as mastered
      // In production: Update user's flashcard progress in database
      return NextResponse.json({
        success: true,
        xpEarned: 5,
        message: 'Card marked as mastered',
      });
    }

    if (action === 'complete_session') {
      // Complete a study session
      const { cardsReviewed, correct, incorrect, duration } = sessionData;

      // Calculate XP based on performance
      const baseXp = cardsReviewed * 2;
      const bonusXp = correct >= cardsReviewed * 0.8 ? 25 : 0; // 80%+ bonus
      const totalXp = baseXp + bonusXp;

      // Update user XP
      await prisma.user.update({
        where: { id: user.id },
        data: { xp: { increment: totalXp } },
      });

      // Record activity for streak
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActivityAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        xpEarned: totalXp,
        sessionStats: {
          cardsReviewed,
          correct,
          incorrect,
          accuracy: Math.round((correct / cardsReviewed) * 100),
          duration,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Flashcard action error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

// Create a custom flashcard deck
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, cards } = body;

    if (!name || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one card are required' },
        { status: 400 }
      );
    }

    // In production: Create deck in database
    const deck = {
      id: `custom_${Date.now()}`,
      name,
      description,
      category: category || 'custom',
      cardCount: cards.length,
      mastered: 0,
      isCustom: true,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    // Award XP for creating content
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: 25 } },
    });

    return NextResponse.json({
      success: true,
      deck,
      xpEarned: 25,
    });
  } catch (error) {
    console.error('Create deck error:', error);
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 });
  }
}
