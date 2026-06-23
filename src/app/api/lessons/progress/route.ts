import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { notifyBadgeAwarded } from '@/lib/notifications';

// Mark lesson as complete
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            track: true,
            badges: true,
            lessons: { where: { isPublished: true } },
          },
        },
      },
    });

    if (!lesson || !lesson.isPublished) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        lessonId_usedId: {
          lessonId,
          usedId: user.id,
        },
      },
    });

    if (existingProgress?.completedAt) {
      return NextResponse.json({
        message: 'Lesson already completed',
        progress: existingProgress,
      });
    }

    // Update or create progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        lessonId_usedId: {
          lessonId,
          usedId: user.id,
        },
      },
      update: {
        completedAt: new Date(),
        progress: 100,
      },
      create: {
        lessonId,
        usedId: user.id,
        progress: 100,
        completedAt: new Date(),
      },
    });

    // Check for module completion badge
    const moduleCompletedLessons = await prisma.lessonProgress.count({
      where: {
        usedId: user.id,
        completedAt: { not: null },
        lesson: {
          moduleId: lesson.moduleId,
          isPublished: true,
        },
      },
    });

    if (moduleCompletedLessons === lesson.module.lessons.length) {
      // Award module completion badges
      for (const badge of lesson.module.badges) {
        const existingBadge = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: badge.id,
            },
          },
        });

        if (!existingBadge) {
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

    // Check for first lesson badge
    const totalCompletedLessons = await prisma.lessonProgress.count({
      where: {
        usedId: user.id,
        completedAt: { not: null },
      },
    });

    if (totalCompletedLessons === 1) {
      const firstLessonBadge = await prisma.badge.findUnique({
        where: { slug: 'first-lesson' },
      });

      if (firstLessonBadge) {
        const existingBadge = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: firstLessonBadge.id,
            },
          },
        });

        if (!existingBadge) {
          await prisma.userBadge.create({
            data: {
              userId: user.id,
              badgeId: firstLessonBadge.id,
            },
          });
          await notifyBadgeAwarded(user.id, firstLessonBadge.name);
        }
      }
    }

    // Check for learning streak badge (complete 5 lessons in a week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyLessons = await prisma.lessonProgress.count({
      where: {
        usedId: user.id,
        completedAt: {
          gte: oneWeekAgo,
        },
      },
    });

    if (weeklyLessons === 5) {
      const streakBadge = await prisma.badge.findUnique({
        where: { slug: 'learning-streak' },
      });

      if (streakBadge) {
        const existingBadge = await prisma.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId: user.id,
              badgeId: streakBadge.id,
            },
          },
        });

        if (!existingBadge) {
          await prisma.userBadge.create({
            data: {
              userId: user.id,
              badgeId: streakBadge.id,
            },
          });
          await notifyBadgeAwarded(user.id, streakBadge.name);
        }
      }
    }

    await createAuditLog({
      userId: user.id,
      action: 'COMPLETE_LESSON',
      entityType: 'Lesson',
      entityId: lessonId,
      newValues: {
        progressId: progress.id,
        lessonTitle: lesson.title,
        moduleTitle: lesson.module.name,
      },
    });

    return NextResponse.json({
      message: 'Lesson marked as complete',
      progress,
    });
  } catch (error) {
    console.error('Mark lesson complete error:', error);
    return NextResponse.json(
      { error: 'Failed to mark lesson as complete' },
      { status: 500 }
    );
  }
}

// Get lesson progress
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const moduleId = searchParams.get('moduleId');
    const trackId = searchParams.get('trackId');

    let whereClause: any = { usedId: user.id };

    if (lessonId) {
      whereClause.lessonId = lessonId;
    }

    if (moduleId) {
      whereClause.lesson = { moduleId };
    }

    if (trackId) {
      whereClause.lesson = {
        module: { trackId },
      };
    }

    const progress = await prisma.lessonProgress.findMany({
      where: whereClause,
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            moduleId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Get lesson progress error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
