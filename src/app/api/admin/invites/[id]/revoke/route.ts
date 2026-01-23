import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

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
        { error: 'Can only revoke pending invites' },
        { status: 400 }
      );
    }

    await prisma.invite.update({
      where: { id: params.id },
      data: {
        status: 'REVOKED',
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'REVOKE_INVITE',
      entityType: 'Invite',
      entityId: params.id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'REVOKED' },
    });

    return NextResponse.json({ message: 'Invite revoked successfully' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invite' },
      { status: 500 }
    );
  }
}
