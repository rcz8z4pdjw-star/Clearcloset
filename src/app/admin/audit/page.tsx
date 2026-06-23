import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Download,
  Filter,
  Eye,
  Activity,
  Shield,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

async function getAuditData() {
  const logs = await prisma.auditLog.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const actionCounts = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: true,
    orderBy: { _count: { action: 'desc' } },
    take: 10,
  });

  const entityCounts = await prisma.auditLog.groupBy({
    by: ['entityType'],
    _count: true,
    orderBy: { _count: { entityType: 'desc' } },
    take: 10,
  });

  return { logs, actionCounts, entityCounts };
}

function AuditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  APPROVE: 'bg-purple-100 text-purple-800',
  REJECT: 'bg-orange-100 text-orange-800',
  LOGIN: 'bg-gray-100 text-gray-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.includes(key)) return color;
  }
  return 'bg-gray-100 text-gray-800';
}

export default async function AuditLogsPage() {
  await requireRole(['ADMIN', 'COMPLIANCE']);

  return (
    <Suspense fallback={<AuditSkeleton />}>
      <AuditContent />
    </Suspense>
  );
}

async function AuditContent() {
  const { logs, actionCounts, entityCounts } = await getAuditData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Review all system activity and changes
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Last 100 entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Action</CardTitle>
          </CardHeader>
          <CardContent>
            {actionCounts[0] && (
              <>
                <p className="text-lg font-bold">{actionCounts[0].action}</p>
                <p className="text-xs text-muted-foreground">{actionCounts[0]._count} times</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Entity</CardTitle>
          </CardHeader>
          <CardContent>
            {entityCounts[0] && (
              <>
                <p className="text-lg font-bold">{entityCounts[0].entityType}</p>
                <p className="text-xs text-muted-foreground">{entityCounts[0]._count} entries</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(logs.filter((l) => l.userId).map((l) => l.userId)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search logs..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionCounts.map((a) => (
                  <SelectItem key={a.action} value={a.action}>
                    {a.action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entityCounts.map((e) => (
                  <SelectItem key={e.entityType} value={e.entityType}>
                    {e.entityType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <span>{log.user.firstName} {log.user.lastName}</span>
                    ) : (
                      <span className="text-muted-foreground">System</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.entityId ? log.entityId.slice(0, 8) + '...' : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.ipAddress || '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                          <DialogDescription>
                            {formatDateTime(log.createdAt)}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Action</p>
                              <Badge className={getActionColor(log.action)}>
                                {log.action}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Entity</p>
                              <p className="text-sm">{log.entityType}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">User</p>
                              <p className="text-sm">
                                {log.user
                                  ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                                  : 'System'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">IP Address</p>
                              <p className="text-sm font-mono">{log.ipAddress || 'N/A'}</p>
                            </div>
                          </div>
                          {log.entityId && (
                            <div>
                              <p className="text-sm font-medium">Entity ID</p>
                              <p className="text-sm font-mono">{log.entityId}</p>
                            </div>
                          )}
                          {log.oldValues && (
                            <div>
                              <p className="text-sm font-medium">Previous Values</p>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <p className="text-sm font-medium">New Values</p>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                                {JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.metadata && (
                            <div>
                              <p className="text-sm font-medium">Metadata</p>
                              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-32">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
