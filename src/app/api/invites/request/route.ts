import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, relationship, familyName, message } = body;

    if (!firstName || !lastName || !email || !relationship || !familyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check for existing pending invite request
    // In a real system, you'd have an InviteRequest model
    // For now, we'll log the request in audit logs

    await createAuditLog({
      action: 'invite.request_submitted',
      entityType: 'InviteRequest',
      newValues: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        relationship,
        familyName,
        message,
        submittedAt: new Date().toISOString(),
      },
    });

    // Notify admins about new invite request
    const admins = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: ['ADMIN', 'PROGRAM_DIRECTOR'] },
          },
        },
        isActive: true,
      },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'INVITE',
        title: 'New Invite Request',
        message: `${firstName} ${lastName} (${relationship}) from the ${familyName} family has requested platform access.`,
        link: '/admin/invites/requests',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invite request submitted successfully',
    });
  } catch (error) {
    console.error('Invite request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit invite request' },
      { status: 500 }
    );
  }
}
