import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { sendInviteEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['ADMIN', 'PROGRAM_DIRECTOR']);

    const invite = await prisma.invite.findUnique({
      where: { id: params.id },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only resend pending invites' },
        { status: 400 }
      );
    }

    // Update expiration
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);

    await prisma.invite.update({
      where: { id: params.id },
      data: {
        expiresAt: newExpiry,
        sentAt: new Date(),
      },
    });

    // Resend email
    await sendInviteEmail({
      to: invite.email,
      inviteToken: invite.token,
      role: invite.role,
      firstName: invite.firstName || undefined,
      lastName: invite.lastName || undefined,
      message: invite.message || undefined,
      invitedBy: `${user.firstName} ${user.lastName}`,
    });

    await createAuditLog({
      userId: user.id,
      action: 'RESEND_INVITE',
      entityType: 'Invite',
      entityId: params.id,
      newValues: {
        email: invite.email,
        newExpiry: newExpiry.toISOString(),
      },
    });

    return NextResponse.json({ message: 'Invite resent successfully' });
  } catch (error) {
    console.error('Resend invite error:', error);
    return NextResponse.json(
      { error: 'Failed to resend invite' },
      { status: 500 }
    );
  }
}
