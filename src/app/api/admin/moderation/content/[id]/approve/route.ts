import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['ADMIN', 'COMPLIANCE', 'PROGRAM_DIRECTOR']);

    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const updatedResource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        isPublished: true,
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    await createAuditLog({
      userId: user.id,
      action: 'APPROVE_CONTENT',
      entityType: 'Resource',
      entityId: params.id,
      oldValues: { status: resource.status },
      newValues: { status: 'APPROVED' },
    });

    return NextResponse.json({ resource: updatedResource });
  } catch (error) {
    console.error('Approve content error:', error);
    return NextResponse.json(
      { error: 'Failed to approve content' },
      { status: 500 }
    );
  }
}
