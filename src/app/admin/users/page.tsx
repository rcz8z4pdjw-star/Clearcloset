import { Suspense } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, getAgeBand, getAgeBandShortLabel } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, UserCog, Mail, Shield } from 'lucide-react';
import { Role } from '@prisma/client';

async function getUsersData() {
  const users = await prisma.user.findMany({
    include: {
      roles: true,
      householdMemberships: {
        include: {
          household: true,
        },
      },
      _count: {
        select: {
          lessonProgress: { where: { completedAt: { not: null } } },
          badges: true,
          quizAttempts: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const roleStats = await prisma.userRole.groupBy({
    by: ['role'],
    _count: true,
  });

  return { users, roleStats };
}

function UsersSkeleton() {
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

const roleColors: Record<Role, string> = {
  MEMBER: 'bg-blue-100 text-blue-800',
  PARENT: 'bg-purple-100 text-purple-800',
  MENTOR: 'bg-green-100 text-green-800',
  CIO: 'bg-orange-100 text-orange-800',
  PROGRAM_DIRECTOR: 'bg-pink-100 text-pink-800',
  ADMIN: 'bg-red-100 text-red-800',
  COMPLIANCE: 'bg-yellow-100 text-yellow-800',
};

export default async function AdminUsersPage() {
  await requireRole(['ADMIN', 'COMPLIANCE', 'PROGRAM_DIRECTOR']);

  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersContent />
    </Suspense>
  );
}

async function UsersContent() {
  const { users, roleStats } = await getUsersData();

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/invites">
              <Mail className="mr-2 h-4 w-4" />
              Send Invite
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {roleStats.find((r) => r.role === 'MEMBER')?._count || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mentors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {roleStats.find((r) => r.role === 'MENTOR')?._count || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="PARENT">Parent</SelectItem>
                <SelectItem value="MENTOR">Mentor</SelectItem>
                <SelectItem value="CIO">CIO</SelectItem>
                <SelectItem value="PROGRAM_DIRECTOR">Program Director</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="COMPLIANCE">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Age Band</TableHead>
                <TableHead>Household</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);
                const isMember = user.roles.some((r) => r.role === 'MEMBER');

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="bg-ascent-navy text-white">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((r) => (
                          <Badge key={r.id} className={roleColors[r.role]}>
                            {r.role.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isMember ? (
                        <Badge variant="secondary">
                          {getAgeBandShortLabel(ageBand)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.householdMemberships.length > 0 ? (
                        <span className="text-sm">
                          {user.householdMemberships[0].household.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isMember ? (
                        <div className="text-sm">
                          <span className="font-medium">{user._count.lessonProgress}</span>
                          <span className="text-muted-foreground"> lessons</span>
                          {user._count.badges > 0 && (
                            <>
                              {' · '}
                              <span className="font-medium">{user._count.badges}</span>
                              <span className="text-muted-foreground"> badges</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/roles`}>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Roles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}/settings`}>
                              <UserCog className="mr-2 h-4 w-4" />
                              User Settings
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
