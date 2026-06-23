import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { notifyBadgeAwarded } from '@/lib/notifications';

// Get user's learning progress
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');
    const moduleId = searchParams.get('moduleId');

    const whereClause: any = { userId: user.id };

    if (moduleId) {
      whereClause.lesson = { moduleId };
    } else if (trackId) {
      whereClause.lesson = { module: { trackId } };
    }

    const progress = await prisma.lessonProgress.findMany({
      where: whereClause,
      include: {
        lesson: {
          include: {
            module: {
              include: {
                track: true,
              },
            },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });

    const completedCount = progress.filter((p) => p.completedAt).length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);

    return NextResponse.json({
      progress,
      stats: {
        completedCount,
        totalTimeSpent,
      },
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// Mark lesson as complete or update progress
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, timeSpent, completed } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            track: true,
            badges: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Upsert progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      update: {
        timeSpent: timeSpent ? { increment: timeSpent } : undefined,
        lastAccessedAt: new Date(),
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId: user.id,
        lessonId,
        timeSpent: timeSpent || 0,
        completedAt: completed ? new Date() : null,
      },
    });

    // Check for badge eligibility if lesson completed
    if (completed) {
      // Check if this is first lesson completed
      const totalCompleted = await prisma.lessonProgress.count({
        where: {
          userId: user.id,
          completedAt: { not: null },
        },
      });

      if (totalCompleted === 1) {
        // Award "First Steps" badge
        const firstStepsBadge = await prisma.badge.findUnique({
          where: { slug: 'first-lesson' },
        });

        if (firstStepsBadge) {
          const existing = await prisma.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId: user.id,
                badgeId: firstStepsBadge.id,
              },
            },
          });

          if (!existing) {
            await prisma.userBadge.create({
              data: {
                userId: user.id,
                badgeId: firstStepsBadge.id,
              },
            });
            await notifyBadgeAwarded(user.id, firstStepsBadge.name);
          }
        }
      }

      // Check if module is complete
      const moduleProgress = await prisma.lessonProgress.count({
        where: {
          userId: user.id,
          completedAt: { not: null },
          lesson: { moduleId: lesson.moduleId },
        },
      });

      const totalLessonsInModule = await prisma.lesson.count({
        where: { moduleId: lesson.moduleId, isPublished: true },
      });

      if (moduleProgress === totalLessonsInModule) {
        // Award module badges
        for (const badge of lesson.module.badges) {
          const existing = await prisma.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId: user.id,
                badgeId: badge.id,
              },
            },
          });

          if (!existing) {
            await prisma.userBadge.create({
              data: {
                userId: user.id,
                badgeId: badge.id,
              },
            });
            await notifyBadgeAwarded(user.id, badge.name);
          }
        }
      }

      await createAuditLog({
        userId: user.id,
        action: 'COMPLETE_LESSON',
        entityType: 'Lesson',
        entityId: lessonId,
        newValues: { lessonTitle: lesson.title },
      });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
