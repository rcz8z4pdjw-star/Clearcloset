import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get daily challenges for the user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Define daily challenges based on age band
    const ageBandChallenges: Record<string, any[]> = {
      JUNIOR_FOUNDATIONS: [
        { id: 'watch_video', title: 'Watch a Video Lesson', description: 'Learn something new!', xp: 30, icon: 'video', type: 'lesson' },
        { id: 'complete_quiz', title: 'Complete a Quiz', description: 'Test your knowledge', xp: 50, icon: 'quiz', type: 'quiz' },
        { id: 'visit_app', title: 'Daily Check-in', description: 'You showed up!', xp: 10, icon: 'check', type: 'checkin' },
      ],
      TEEN_SKILLS: [
        { id: 'complete_lesson', title: 'Complete a Lesson', description: 'Keep learning!', xp: 40, icon: 'book', type: 'lesson' },
        { id: 'ace_quiz', title: 'Score 80%+ on Quiz', description: 'Show what you know', xp: 60, icon: 'star', type: 'quiz_score' },
        { id: 'connect_peer', title: 'Cheer a Friend', description: 'Support your peers', xp: 20, icon: 'heart', type: 'social' },
      ],
      LAUNCH: [
        { id: 'complete_module_lesson', title: 'Complete 2 Lessons', description: 'Double down on learning', xp: 60, icon: 'book', type: 'lessons', target: 2 },
        { id: 'perfect_quiz', title: 'Perfect Quiz Score', description: 'Get 100% on any quiz', xp: 100, icon: 'trophy', type: 'perfect_quiz' },
        { id: 'review_notes', title: 'Review Past Lesson', description: 'Reinforce your knowledge', xp: 25, icon: 'refresh', type: 'review' },
      ],
      STEWARDSHIP_PRACTICUM: [
        { id: 'advanced_lesson', title: 'Complete Advanced Lesson', description: 'Tackle challenging content', xp: 75, icon: 'graduation', type: 'advanced_lesson' },
        { id: 'mentor_session', title: 'Attend Mentor Session', description: 'Learn from experience', xp: 100, icon: 'users', type: 'mentor' },
        { id: 'practice_exercise', title: 'Complete Practice Exercise', description: 'Apply your knowledge', xp: 50, icon: 'pencil', type: 'exercise' },
      ],
      LEADERSHIP: [
        { id: 'help_others', title: 'Help a Member', description: 'Share your knowledge', xp: 80, icon: 'hand', type: 'mentor_help' },
        { id: 'complete_track', title: 'Progress in Track', description: 'Move forward in your track', xp: 100, icon: 'trending', type: 'track_progress' },
        { id: 'reflection', title: 'Daily Reflection', description: 'Reflect on your learning', xp: 30, icon: 'lightbulb', type: 'reflection' },
      ],
    };

    const userAgeBand = user.ageBand || 'LAUNCH';
    const challenges = ageBandChallenges[userAgeBand] || ageBandChallenges.LAUNCH;

    // Get user's completed challenges for today
    const completedChallenges = await prisma.dailyChallengeCompletion.findMany({
      where: {
        userId: user.id,
        completedAt: {
          gte: today,
        },
      },
    });

    const completedIds = new Set(completedChallenges.map((c: any) => c.challengeId));

    // Mark which challenges are completed
    const challengesWithStatus = challenges.map(challenge => ({
      ...challenge,
      completed: completedIds.has(challenge.id),
      completedAt: completedChallenges.find((c: any) => c.challengeId === challenge.id)?.completedAt,
    }));

    return NextResponse.json({
      challenges: challengesWithStatus,
      totalXP: challengesWithStatus.filter(c => c.completed).reduce((sum, c) => sum + c.xp, 0),
      completedCount: challengesWithStatus.filter(c => c.completed).length,
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}

// Complete a challenge
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { challengeId, xpReward } = body;

    if (!challengeId) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }

    // Check if already completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyChallengeCompletion.findFirst({
      where: {
        userId: user.id,
        challengeId,
        completedAt: {
          gte: today,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Challenge already completed today' }, { status: 400 });
    }

    // Record completion
    await prisma.dailyChallengeCompletion.create({
      data: {
        userId: user.id,
        challengeId,
        xpEarned: xpReward || 0,
      },
    });

    // Award XP to user
    if (xpReward) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: xpReward },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Challenge completed!',
      xpAwarded: xpReward || 0,
    });
  } catch (error) {
    console.error('Complete challenge error:', error);
    return NextResponse.json(
      { error: 'Failed to complete challenge' },
      { status: 500 }
    );
  }
}
