import { Suspense } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  UserPlus,
  Building2,
  FileText,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

async function getAdminStats() {
  const [
    totalUsers,
    activeUsers,
    pendingInvites,
    totalHouseholds,
    totalContent,
    pendingContent,
    moderationQueue,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.invite.count({ where: { status: 'PENDING' } }),
    prisma.household.count(),
    prisma.contentItem.count(),
    prisma.contentItem.count({ where: { status: 'IN_REVIEW' } }),
    prisma.moderationFlag.count({ where: { status: 'PENDING' } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingInvites,
    totalHouseholds,
    totalContent,
    pendingContent,
    moderationQueue,
    recentActivity,
  };
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireRole(['ADMIN', 'COMPLIANCE']);

  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage users, content, and platform settings
        </p>
      </div>

      {/* Alerts */}
      {(stats.pendingContent > 0 || stats.moderationQueue > 0) && (
        <div className="flex flex-wrap gap-4">
          {stats.pendingContent > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="flex items-center gap-3 py-4">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">
                  {stats.pendingContent} content items awaiting approval
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/content/approvals">Review</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {stats.moderationQueue > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 py-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">
                  {stats.moderationQueue} items in moderation queue
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/moderation">Review</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvites}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Households</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHouseholds}</div>
            <p className="text-xs text-muted-foreground">
              Client families
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingContent} pending review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/users/new">
                  <UserPlus className="h-6 w-6" />
                  <span>Add User</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/invites/new">
                  <UserPlus className="h-6 w-6" />
                  <span>Send Invite</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/content/new">
                  <FileText className="h-6 w-6" />
                  <span>Create Content</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link href="/admin/exports">
                  <TrendingUp className="h-6 w-6" />
                  <span>Generate Report</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform actions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {log.user
                            ? `${log.user.firstName} ${log.user.lastName}`
                            : 'System'}
                        </span>{' '}
                        <span className="text-muted-foreground">{log.action}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/audit">View All Logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
