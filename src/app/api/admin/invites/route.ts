import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { sendInviteEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

// Get all invites
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'PROGRAM_DIRECTOR']);

    const invites = await prisma.invite.findMany({
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        usedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Get invites error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}

// Create new invite
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN', 'PROGRAM_DIRECTOR']);

    const body = await request.json();
    const { email, role, firstName, lastName, message, householdId } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Check if email already has pending invite
    const existingInvite = await prisma.invite.findFirst({
      where: {
        email: email.toLowerCase(),
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'A pending invite already exists for this email' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

    const invite = await prisma.invite.create({
      data: {
        email: email.toLowerCase(),
        role,
        token,
        firstName,
        lastName,
        message,
        householdId,
        expiresAt,
        createdById: user.id,
        status: 'PENDING',
      },
    });

    // Send invite email
    await sendInviteEmail({
      to: email,
      inviteToken: token,
      role,
      firstName,
      lastName,
      message,
      invitedBy: `${user.firstName} ${user.lastName}`,
    });

    await createAuditLog({
      userId: user.id,
      action: 'CREATE_INVITE',
      entityType: 'Invite',
      entityId: invite.id,
      newValues: {
        email,
        role,
      },
    });

    return NextResponse.json({ invite });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}
