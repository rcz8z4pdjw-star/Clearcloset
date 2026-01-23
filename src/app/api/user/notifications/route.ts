import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// Get notification preferences
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    });

    // Return defaults if no preferences exist
    const defaultPreferences = {
      emailDigest: true,
      emailSession: true,
      emailBadge: true,
      emailAnnouncement: true,
      pushEnabled: false,
      pushSession: true,
      pushBadge: true,
    };

    return NextResponse.json({
      preferences: preferences || defaultPreferences,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      emailDigest,
      emailSession,
      emailBadge,
      emailAnnouncement,
      pushEnabled,
      pushSession,
      pushBadge,
    } = body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {
        emailDigest: emailDigest ?? true,
        emailSession: emailSession ?? true,
        emailBadge: emailBadge ?? true,
        emailAnnouncement: emailAnnouncement ?? true,
        pushEnabled: pushEnabled ?? false,
        pushSession: pushSession ?? true,
        pushBadge: pushBadge ?? true,
      },
      create: {
        userId: user.id,
        emailDigest: emailDigest ?? true,
        emailSession: emailSession ?? true,
        emailBadge: emailBadge ?? true,
        emailAnnouncement: emailAnnouncement ?? true,
        pushEnabled: pushEnabled ?? false,
        pushSession: pushSession ?? true,
        pushBadge: pushBadge ?? true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_NOTIFICATION_PREFERENCES',
      entityType: 'NotificationPreference',
      entityId: preferences.id,
      newValues: preferences,
    });

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
