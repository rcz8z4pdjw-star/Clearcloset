import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const user = await requireRole(['ADMIN', 'COMPLIANCE', 'PROGRAM_DIRECTOR']);

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const type = params.type;

    let data: any[] = [];
    let headers: string[] = [];

    switch (type) {
      case 'users':
        const users = await prisma.user.findMany({
          include: {
            roles: true,
            householdMemberships: {
              include: { household: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        headers = ['ID', 'First Name', 'Last Name', 'Email', 'Roles', 'Household', 'Created At', 'Active'];
        data = users.map((u) => ({
          ID: u.id,
          'First Name': u.firstName,
          'Last Name': u.lastName,
          Email: u.email,
          Roles: u.roles.map((r) => r.role).join(', '),
          Household: u.householdMemberships[0]?.household.name || '',
          'Created At': u.createdAt.toISOString(),
          Active: u.isActive ? 'Yes' : 'No',
        }));
        break;

      case 'progress':
        const progress = await prisma.lessonProgress.findMany({
          where: { completedAt: { not: null } },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
            lesson: {
              include: {
                module: {
                  include: { track: true },
                },
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        });
        headers = ['User', 'Email', 'Track', 'Module', 'Lesson', 'Completed At'];
        data = progress.map((p) => ({
          User: `${p.user.firstName} ${p.user.lastName}`,
          Email: p.user.email,
          Track: p.lesson.module.track.name,
          Module: p.lesson.module.name,
          Lesson: p.lesson.title,
          'Completed At': p.completedAt?.toISOString() || '',
        }));
        break;

      case 'mentorship':
        const sessions = await prisma.mentorshipSession.findMany({
          include: {
            mentor: {
              select: { firstName: true, lastName: true },
            },
            mentee: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { scheduledAt: 'desc' },
        });
        headers = ['Mentor', 'Mentee', 'Status', 'Scheduled At', 'Completed At', 'Duration'];
        data = sessions.map((s) => ({
          Mentor: `${s.mentor.firstName} ${s.mentor.lastName}`,
          Mentee: `${s.mentee.firstName} ${s.mentee.lastName}`,
          Status: s.status,
          'Scheduled At': s.scheduledAt?.toISOString() || '',
          'Completed At': s.completedAt?.toISOString() || '',
          Duration: s.duration ? `${s.duration} min` : '',
        }));
        break;

      case 'portfolio':
        const portfolios = await prisma.portfolio.findMany({
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
            holdings: true,
          },
        });
        headers = ['User', 'Portfolio Name', 'Cash Balance', 'Total Value', 'Holdings Count'];
        data = portfolios.map((p) => ({
          User: `${p.user.firstName} ${p.user.lastName}`,
          'Portfolio Name': p.name,
          'Cash Balance': p.cashBalance.toString(),
          'Total Value': p.totalValue.toString(),
          'Holdings Count': p.holdings.length,
        }));
        break;

      case 'content':
        const tracks = await prisma.track.findMany({
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        });
        headers = ['Track', 'Module', 'Lesson', 'Published', 'Duration'];
        data = [];
        for (const track of tracks) {
          for (const module of track.modules) {
            for (const lesson of module.lessons) {
              data.push({
                Track: track.name,
                Module: module.name,
                Lesson: lesson.title,
                Published: lesson.isPublished ? 'Yes' : 'No',
                Duration: lesson.duration ? `${lesson.duration} min` : '',
              });
            }
          }
        }
        break;

      case 'audit':
        const logs = await prisma.auditLog.findMany({
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1000,
        });
        headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
        data = logs.map((l) => ({
          Timestamp: l.createdAt.toISOString(),
          User: l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
          Action: l.action,
          'Entity Type': l.entityType || '',
          'Entity ID': l.entityId || '',
          'IP Address': l.ipAddress || '',
        }));
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Generate CSV
    if (format === 'csv') {
      const csvRows = [headers.join(',')];
      for (const row of data) {
        const values = headers.map((header) => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvRows.push(values.join(','));
      }
      const csv = csvRows.join('\n');

      await createAuditLog({
        userId: user.id,
        action: 'EXPORT_DATA',
        entityType: type,
        newValues: { format: 'csv', recordCount: data.length },
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // For XLSX format, return JSON that client can process
    // In a real implementation, you'd use a library like xlsx
    await createAuditLog({
      userId: user.id,
      action: 'EXPORT_DATA',
      entityType: type,
      newValues: { format, recordCount: data.length },
    });

    return NextResponse.json({
      headers,
      data,
      filename: `${type}-export-${new Date().toISOString().split('T')[0]}.${format}`,
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
