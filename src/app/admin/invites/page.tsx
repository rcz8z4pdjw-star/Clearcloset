import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
  Send,
} from 'lucide-react';
import { NewInviteDialog } from './new-invite-dialog';
import { ResendInviteButton, RevokeInviteButton } from './invite-actions';

async function getInvitesData() {
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
          email: true,
        },
      },
      household: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: invites.length,
    pending: invites.filter((i) => i.status === 'PENDING').length,
    accepted: invites.filter((i) => i.status === 'ACCEPTED').length,
    expired: invites.filter((i) => i.status === 'EXPIRED' || (i.expiresAt && new Date(i.expiresAt) < new Date())).length,
  };

  return { invites, stats };
}

function InvitesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  REVOKED: 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  ACCEPTED: CheckCircle,
  EXPIRED: XCircle,
  REVOKED: XCircle,
};

export default async function InvitesPage() {
  await requireRole(['ADMIN', 'PROGRAM_DIRECTOR']);

  return (
    <Suspense fallback={<InvitesSkeleton />}>
      <InvitesContent />
    </Suspense>
  );
}

async function InvitesContent() {
  const { invites, stats } = await getInvitesData();

  const pendingInvites = invites.filter((i) => i.status === 'PENDING');
  const acceptedInvites = invites.filter((i) => i.status === 'ACCEPTED');
  const expiredInvites = invites.filter((i) => i.status === 'EXPIRED' || i.status === 'REVOKED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Invitations</h1>
          <p className="text-muted-foreground mt-1">
            Invite new members, parents, and mentors to the platform
          </p>
        </div>
        <NewInviteDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.accepted}</p>
                <p className="text-sm text-muted-foreground">Accepted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingInvites.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Accepted ({acceptedInvites.length})
          </TabsTrigger>
          <TabsTrigger value="expired" className="gap-2">
            <XCircle className="h-4 w-4" />
            Expired/Revoked ({expiredInvites.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Mail className="h-4 w-4" />
            All ({invites.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invites waiting for the recipient to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvites.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Invites</h3>
                  <p className="text-muted-foreground mb-4">
                    All invitations have been accepted or expired.
                  </p>
                  <NewInviteDialog />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Household</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {invite.role.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.household?.name || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelativeTime(invite.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.expiresAt ? formatDate(invite.expiresAt) : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ResendInviteButton inviteId={invite.id} />
                            <RevokeInviteButton inviteId={invite.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accepted Tab */}
        <TabsContent value="accepted">
          <Card>
            <CardHeader>
              <CardTitle>Accepted Invitations</CardTitle>
              <CardDescription>
                Successfully registered users from invites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedInvites.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No accepted invitations yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registered As</TableHead>
                      <TableHead>Accepted</TableHead>
                      <TableHead>Invited By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {acceptedInvites.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {invite.role.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.usedBy ? (
                            `${invite.usedBy.firstName} ${invite.usedBy.lastName}`
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.usedAt ? formatDate(invite.usedAt) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.createdBy
                            ? `${invite.createdBy.firstName} ${invite.createdBy.lastName}`
                            : 'System'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expired/Revoked Tab */}
        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle>Expired & Revoked Invitations</CardTitle>
              <CardDescription>
                Invitations that are no longer valid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expiredInvites.length === 0 ? (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No expired or revoked invitations.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Invited By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredInvites.map((invite) => {
                      const StatusIcon = statusIcons[invite.status] || XCircle;
                      return (
                        <TableRow key={invite.id}>
                          <TableCell className="font-medium">{invite.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {invite.role.toLowerCase().replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[invite.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {invite.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invite.createdAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invite.createdBy
                              ? `${invite.createdBy.firstName} ${invite.createdBy.lastName}`
                              : 'System'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Invited By</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => {
                    const StatusIcon = statusIcons[invite.status] || Clock;
                    return (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">{invite.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {invite.role.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[invite.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelativeTime(invite.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {invite.createdBy
                            ? `${invite.createdBy.firstName} ${invite.createdBy.lastName}`
                            : 'System'}
                        </TableCell>
                        <TableCell>
                          {invite.status === 'PENDING' && (
                            <div className="flex items-center gap-1">
                              <ResendInviteButton inviteId={invite.id} />
                              <RevokeInviteButton inviteId={invite.id} />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
