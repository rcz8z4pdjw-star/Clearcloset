import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['ADMIN', 'COMPLIANCE', 'PROGRAM_DIRECTOR']);

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            email: true,
          },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const updatedResource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedById: user.id,
        rejectedAt: new Date(),
      },
    });

    // Notify the content creator
    if (resource.createdBy) {
      await sendNotification({
        userId: resource.createdBy.id,
        type: 'CONTENT_REJECTED',
        title: 'Content Submission Rejected',
        message: `Your submission "${resource.title}" has been rejected. Reason: ${reason}`,
        link: `/dashboard/submissions`,
      });
    }

    await createAuditLog({
      userId: user.id,
      action: 'REJECT_CONTENT',
      entityType: 'Resource',
      entityId: params.id,
      oldValues: { status: resource.status },
      newValues: { status: 'REJECTED', reason },
    });

    return NextResponse.json({ resource: updatedResource });
  } catch (error) {
    console.error('Reject content error:', error);
    return NextResponse.json(
      { error: 'Failed to reject content' },
      { status: 500 }
    );
  }
}
