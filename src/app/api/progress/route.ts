import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getAgeBand } from '@/lib/utils';
import { awardXP, calculateStreak, checkStreakBonus, XP_REWARDS } from '@/lib/gamification';

// Get user's learning progress and stats
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    // Get user with all relevant data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        lessonProgress: {
          include: {
            lesson: {
              include: {
                module: {
                  include: { track: true },
                },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        quizAttempts: {
          include: {
            quiz: true,
          },
          orderBy: { completedAt: 'desc' },
        },
        badges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
        },
        moduleProgress: {
          include: {
            module: {
              include: { track: true },
            },
          },
        },
        trackEnrollments: {
          include: {
            track: {
              include: {
                modules: {
                  include: { lessons: true },
                },
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ageBand = getAgeBand(userData.dateOfBirth, userData.ageBandOverride);

    if (type === 'overview') {
      // Calculate streak
      const streak = await calculateStreak(user.id);

      // Get overall stats
      const totalLessons = await prisma.lesson.count({ where: { isPublished: true } });
      const totalQuizzes = await prisma.quiz.count({ where: { isPublished: true } });
      const totalBadges = await prisma.badge.count();

      const completedLessons = userData.lessonProgress.filter(lp => lp.completedAt).length;
      const passedQuizzes = userData.quizAttempts.filter(qa => qa.passed).length;
      const earnedBadges = userData.badges.length;

      // Calculate learning time (estimated)
      const learningMinutes = completedLessons * 10 + passedQuizzes * 5;

      // Get this week's activity
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const thisWeekLessons = userData.lessonProgress.filter(
        lp => lp.completedAt && new Date(lp.completedAt) >= weekAgo
      ).length;

      const thisWeekQuizzes = userData.quizAttempts.filter(
        qa => qa.completedAt && new Date(qa.completedAt) >= weekAgo
      ).length;

      return NextResponse.json({
        overview: {
          xp: userData.totalXP || 0,
          level: userData.currentLevel || 1,
          streak,
          completedLessons,
          totalLessons,
          passedQuizzes,
          totalQuizzes,
          earnedBadges,
          totalBadges,
          learningMinutes,
          lessonProgress: Math.round((completedLessons / totalLessons) * 100),
          ageBand,
        },
        weeklyActivity: {
          lessonsCompleted: thisWeekLessons,
          quizzesPassed: thisWeekQuizzes,
        },
        recentBadges: userData.badges.slice(0, 5).map(ub => ({
          id: ub.badge.id,
          name: ub.badge.name,
          description: ub.badge.description,
          imageUrl: ub.badge.imageUrl,
          awardedAt: ub.awardedAt,
        })),
      });
    }

    if (type === 'tracks') {
      // Get track-level progress
      const tracks = await prisma.track.findMany({
        where: {
          isPublished: true,
          ageBands: { has: ageBand },
        },
        include: {
          modules: {
            where: { isPublished: true },
            include: {
              lessons: { where: { isPublished: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      const trackProgress = tracks.map(track => {
        const totalLessons = track.modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
        const completedLessons = userData.lessonProgress.filter(
          lp => lp.completedAt && track.modules.some(mod =>
            mod.lessons.some(lesson => lesson.id === lp.lessonId)
          )
        ).length;

        const enrollment = userData.trackEnrollments.find(te => te.trackId === track.id);

        return {
          id: track.id,
          name: track.name,
          slug: track.slug,
          description: track.description,
          icon: track.icon,
          color: track.color,
          totalLessons,
          completedLessons,
          progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          enrolled: !!enrollment,
          enrolledAt: enrollment?.enrolledAt,
          completedAt: enrollment?.completedAt,
        };
      });

      return NextResponse.json({ tracks: trackProgress });
    }

    if (type === 'activity') {
      // Get activity timeline
      const activities = [];

      // Add lesson completions
      for (const lp of userData.lessonProgress.filter(lp => lp.completedAt)) {
        activities.push({
          type: 'lesson',
          title: `Completed: ${lp.lesson.title}`,
          description: `${lp.lesson.module.track.name} > ${lp.lesson.module.name}`,
          timestamp: lp.completedAt,
          xp: XP_REWARDS.COMPLETE_LESSON,
        });
      }

      // Add quiz completions
      for (const qa of userData.quizAttempts) {
        activities.push({
          type: 'quiz',
          title: qa.passed ? `Passed: ${qa.quiz.title}` : `Attempted: ${qa.quiz.title}`,
          description: `Score: ${qa.score}%`,
          timestamp: qa.completedAt,
          xp: qa.passed ? (qa.score === 100 ? XP_REWARDS.PERFECT_QUIZ : XP_REWARDS.PASS_QUIZ) : 0,
        });
      }

      // Add badge awards
      for (const ub of userData.badges) {
        activities.push({
          type: 'badge',
          title: `Earned Badge: ${ub.badge.name}`,
          description: ub.badge.description,
          timestamp: ub.awardedAt,
          xp: XP_REWARDS.EARN_BADGE,
        });
      }

      // Sort by timestamp
      activities.sort((a, b) =>
        new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
      );

      return NextResponse.json({ activities: activities.slice(0, 50) });
    }

    if (type === 'heatmap') {
      // Get learning heatmap data (last 365 days)
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const lessonDates = userData.lessonProgress
        .filter(lp => lp.completedAt && new Date(lp.completedAt) >= yearAgo)
        .map(lp => new Date(lp.completedAt!).toISOString().split('T')[0]);

      const quizDates = userData.quizAttempts
        .filter(qa => qa.completedAt && new Date(qa.completedAt) >= yearAgo)
        .map(qa => new Date(qa.completedAt!).toISOString().split('T')[0]);

      // Count activities per day
      const activityCounts: Record<string, number> = {};
      [...lessonDates, ...quizDates].forEach(date => {
        activityCounts[date] = (activityCounts[date] || 0) + 1;
      });

      return NextResponse.json({ heatmap: activityCounts });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// Update lesson progress
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, action, progress } = body;

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Get or create lesson progress
    let lessonProgress = await prisma.lessonProgress.findUnique({
      where: {
        usedId_lessonId: {
          usedId: user.id,
          lessonId,
        },
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                track: true,
                lessons: { where: { isPublished: true } },
              },
            },
          },
        },
      },
    });

    if (!lessonProgress) {
      lessonProgress = await prisma.lessonProgress.create({
        data: {
          usedId: user.id,
          lessonId,
          progress: 0,
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  track: true,
                  lessons: { where: { isPublished: true } },
                },
              },
            },
          },
        },
      });
    }

    const updates: any = {};
    let xpResult = null;

    if (action === 'start') {
      if (!lessonProgress.startedAt) {
        updates.startedAt = new Date();
      }
    } else if (action === 'progress' && typeof progress === 'number') {
      updates.progress = Math.max(lessonProgress.progress, progress);
      updates.lastPositionSeconds = body.positionSeconds || 0;
    } else if (action === 'complete') {
      if (!lessonProgress.completedAt) {
        updates.completedAt = new Date();
        updates.progress = 100;

        // Award XP for completing lesson
        const isFirstCompletion = !lessonProgress.completedAt;
        xpResult = await awardXP(
          user.id,
          isFirstCompletion ? XP_REWARDS.COMPLETE_LESSON + XP_REWARDS.FIRST_LESSON : XP_REWARDS.COMPLETE_LESSON,
          `Completed lesson: ${lessonProgress.lesson.title}`,
          'lesson',
          lessonId
        );

        // Check streak bonus
        const streak = await calculateStreak(user.id);
        await checkStreakBonus(user.id, streak);

        // Check if module is complete
        const moduleId = lessonProgress.lesson.moduleId;
        const moduleLessons = lessonProgress.lesson.module.lessons;
        const completedLessonIds = await prisma.lessonProgress.findMany({
          where: {
            usedId: user.id,
            lessonId: { in: moduleLessons.map(l => l.id) },
            completedAt: { not: null },
          },
          select: { lessonId: true },
        });

        // Include current completion
        const allCompleted = moduleLessons.every(
          l => l.id === lessonId || completedLessonIds.some(cl => cl.lessonId === l.id)
        );

        if (allCompleted) {
          // Update module progress
          await prisma.moduleProgress.upsert({
            where: {
              userId_moduleId: {
                userId: user.id,
                moduleId,
              },
            },
            create: {
              userId: user.id,
              moduleId,
              completedAt: new Date(),
            },
            update: {
              completedAt: new Date(),
            },
          });

          // Award module completion XP
          await awardXP(
            user.id,
            XP_REWARDS.COMPLETE_MODULE,
            `Completed module: ${lessonProgress.lesson.module.name}`,
            'module',
            moduleId
          );

          // Notify user
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: 'MODULE_COMPLETE',
              title: `Module Complete: ${lessonProgress.lesson.module.name}!`,
              message: `Great work! You've completed all lessons in this module.`,
              link: `/dashboard/learn/${lessonProgress.lesson.module.track.slug}`,
            },
          });
        }
      }
    } else if (action === 'bookmark') {
      updates.isBookmarked = body.isBookmarked ?? !lessonProgress.isBookmarked;
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      lessonProgress = await prisma.lessonProgress.update({
        where: { id: lessonProgress.id },
        data: updates,
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  track: true,
                  lessons: { where: { isPublished: true } },
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      progress: lessonProgress,
      xp: xpResult,
    });
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

// Log activity for analytics
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityType, entityType, entityId, metadata } = body;

    if (!activityType) {
      return NextResponse.json({ error: 'Activity type is required' }, { status: 400 });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activityType,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Update daily active check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingDailyCheck = await prisma.activityLog.findFirst({
      where: {
        userId: user.id,
        activityType: 'daily_login',
        createdAt: { gte: today },
      },
    });

    if (!existingDailyCheck && activityType !== 'daily_login') {
      // Record daily login and award XP
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          activityType: 'daily_login',
        },
      });

      await awardXP(user.id, XP_REWARDS.DAILY_LOGIN, 'Daily login bonus');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log activity error:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
