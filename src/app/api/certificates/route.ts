import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get user's certificates
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('id');

    if (certificateId) {
      // Get specific certificate
      const certificate = await prisma.certificate.findFirst({
        where: { id: certificateId, userId: user.id },
        include: {
          track: {
            include: {
              modules: {
                include: { lessons: true },
              },
            },
          },
        },
      });

      if (!certificate) {
        return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
      }

      // Get achievements earned during track completion
      const trackStartDate = certificate.track.enrollments?.find(
        (e: any) => e.userId === user.id
      )?.enrolledAt || certificate.issuedAt;

      const achievements = await prisma.userBadge.findMany({
        where: {
          userId: user.id,
          awardedAt: {
            gte: trackStartDate,
            lte: certificate.issuedAt,
          },
        },
        include: { badge: true },
      });

      // Calculate stats
      const totalLessons = certificate.track.modules.reduce(
        (sum: number, mod: any) => sum + mod.lessons.length,
        0
      );

      const quizzes = await prisma.quizAttempt.findMany({
        where: {
          userId: user.id,
          quiz: {
            module: { trackId: certificate.trackId },
          },
          passed: true,
        },
      });

      return NextResponse.json({
        certificate: {
          id: certificate.id,
          title: certificate.track.name,
          type: 'Track Completion',
          issuedAt: certificate.issuedAt,
          credentialId: certificate.credentialId,
          verificationUrl: `https://ascent.capital/verify/${certificate.credentialId}`,
          track: {
            name: certificate.track.name,
            lessonsCompleted: totalLessons,
            quizzesPassed: quizzes.length,
            totalHours: Math.round(totalLessons * 10 / 60), // Estimate
          },
          achievements: achievements.map(a => ({
            name: a.badge.name,
            description: a.badge.description,
          })),
          skills: certificate.track.skills || [],
        },
      });
    }

    // Get all certificates
    const certificates = await prisma.certificate.findMany({
      where: { userId: user.id },
      include: {
        track: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({
      certificates: certificates.map(cert => ({
        id: cert.id,
        title: cert.track.name,
        type: 'Track Completion',
        issuedAt: cert.issuedAt,
        credentialId: cert.credentialId,
        trackIcon: cert.track.icon,
        trackColor: cert.track.color,
      })),
      count: certificates.length,
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}

// Issue a new certificate
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trackId } = body;

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    // Check if track is completed
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const allLessonIds = track.modules.flatMap(m => m.lessons.map(l => l.id));
    const completedLessons = await prisma.lessonProgress.findMany({
      where: {
        usedId: user.id,
        lessonId: { in: allLessonIds },
        completedAt: { not: null },
      },
    });

    if (completedLessons.length < allLessonIds.length) {
      return NextResponse.json({
        error: 'Track not completed',
        progress: {
          completed: completedLessons.length,
          total: allLessonIds.length,
        },
      }, { status: 400 });
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: { userId: user.id, trackId },
    });

    if (existingCert) {
      return NextResponse.json({ error: 'Certificate already issued', certificateId: existingCert.id }, { status: 400 });
    }

    // Generate credential ID
    const year = new Date().getFullYear();
    const trackCode = track.slug.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const credentialId = `CERT-${year}-${trackCode}-${randomNum}`;

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        trackId,
        credentialId,
        issuedAt: new Date(),
      },
    });

    // Update track enrollment
    await prisma.trackEnrollment.updateMany({
      where: { userId: user.id, trackId },
      data: { completedAt: new Date() },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'CERTIFICATE_EARNED',
        title: `Certificate Earned: ${track.name}!`,
        message: 'Congratulations! You\'ve earned a new certificate.',
        link: `/dashboard/certificates/${certificate.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        credentialId: certificate.credentialId,
      },
    });
  } catch (error) {
    console.error('Issue certificate error:', error);
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 });
  }
}

// Verify a certificate
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { credentialId } = body;

    if (!credentialId) {
      return NextResponse.json({ error: 'Credential ID is required' }, { status: 400 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { credentialId },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        track: true,
      },
    });

    if (!certificate) {
      return NextResponse.json({ valid: false, error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        recipientName: `${certificate.user.firstName} ${certificate.user.lastName}`,
        trackName: certificate.track.name,
        issuedAt: certificate.issuedAt,
        credentialId: certificate.credentialId,
      },
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    return NextResponse.json({ error: 'Failed to verify certificate' }, { status: 500 });
  }
}
