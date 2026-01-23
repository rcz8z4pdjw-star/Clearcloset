import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// Get privacy settings
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const privacySettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        showProgressToParent: true,
        showBadgesToParent: true,
        allowMentorContact: true,
      },
    });

    return NextResponse.json({ privacy: privacySettings });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

// Update privacy settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { showProgressToParent, showBadgesToParent, allowMentorContact } = body;

    // Get current settings for audit log
    const currentSettings = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        showProgressToParent: true,
        showBadgesToParent: true,
        allowMentorContact: true,
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        showProgressToParent: showProgressToParent ?? true,
        showBadgesToParent: showBadgesToParent ?? true,
        allowMentorContact: allowMentorContact ?? true,
      },
      select: {
        showProgressToParent: true,
        showBadgesToParent: true,
        allowMentorContact: true,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE_PRIVACY_SETTINGS',
      entityType: 'User',
      entityId: user.id,
      oldValues: currentSettings,
      newValues: updatedUser,
    });

    return NextResponse.json({ privacy: updatedUser });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
