import { Suspense } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Flag,
  MessageSquare,
  MoreHorizontal,
  XCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { ApproveButton, RejectButton } from './moderation-actions';

async function getModerationData() {
  // Get pending content submissions
  const pendingContent = await prisma.resource.findMany({
    where: {
      status: 'IN_REVIEW',
    },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get pending exercises/submissions
  const pendingExercises = await prisma.exerciseSubmission.findMany({
    where: {
      status: 'SUBMITTED',
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      exercise: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              name: true,
              track: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  // Get flagged items (comments, messages, etc.)
  const flaggedItems = await prisma.flag.findMany({
    where: {
      resolvedAt: null,
    },
    include: {
      flaggedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get pending trade requests
  const pendingTrades = await prisma.tradeRequest.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      portfolio: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const stats = {
    pendingContentCount: pendingContent.length,
    pendingExercisesCount: pendingExercises.length,
    flaggedItemsCount: flaggedItems.length,
    pendingTradesCount: pendingTrades.length,
  };

  return {
    pendingContent,
    pendingExercises,
    flaggedItems,
    pendingTrades,
    stats,
  };
}

function ModerationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
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

export default async function ModerationPage() {
  await requireRole(['ADMIN', 'COMPLIANCE', 'PROGRAM_DIRECTOR']);

  return (
    <Suspense fallback={<ModerationSkeleton />}>
      <ModerationContent />
    </Suspense>
  );
}

async function ModerationContent() {
  const { pendingContent, pendingExercises, flaggedItems, pendingTrades, stats } =
    await getModerationData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Moderation Queue</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve content, submissions, and flagged items
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingContentCount}</p>
                <p className="text-sm text-muted-foreground">Content Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingExercisesCount}</p>
                <p className="text-sm text-muted-foreground">Submissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <Flag className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.flaggedItemsCount}</p>
                <p className="text-sm text-muted-foreground">Flagged Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingTradesCount}</p>
                <p className="text-sm text-muted-foreground">Pending Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" />
            Content ({stats.pendingContentCount})
          </TabsTrigger>
          <TabsTrigger value="submissions" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Submissions ({stats.pendingExercisesCount})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="gap-2">
            <Flag className="h-4 w-4" />
            Flagged ({stats.flaggedItemsCount})
          </TabsTrigger>
          <TabsTrigger value="trades" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Trades ({stats.pendingTradesCount})
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Pending Content</CardTitle>
              <CardDescription>
                Review and approve new resources and content submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingContent.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No content pending review
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingContent.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{content.title}</p>
                              {content.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {content.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{content.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {content.createdBy && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={content.createdBy.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {content.createdBy.firstName[0]}
                                  {content.createdBy.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {content.createdBy.firstName} {content.createdBy.lastName}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(content.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/moderation/content/${content.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <ApproveButton type="content" id={content.id} />
                            <RejectButton type="content" id={content.id} />
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

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Exercise Submissions</CardTitle>
              <CardDescription>
                Review and grade exercise submissions from members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingExercises.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No submissions pending review
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Exercise</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Track / Module</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingExercises.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <p className="font-medium">{submission.exercise.title}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={submission.user.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {submission.user.firstName[0]}
                                {submission.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {submission.user.firstName} {submission.user.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {submission.exercise.module.track.name} /{' '}
                          {submission.exercise.module.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(submission.submittedAt!)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/moderation/submission/${submission.id}`}>
                              Review
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flagged Tab */}
        <TabsContent value="flagged">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Items</CardTitle>
              <CardDescription>
                Review items flagged by users for inappropriate content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="font-medium">All clear!</p>
                  <p className="text-sm text-muted-foreground">
                    No flagged items to review
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Flagged By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedItems.map((flag) => (
                      <TableRow key={flag.id}>
                        <TableCell>
                          <Badge variant="destructive">{flag.entityType}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{flag.reason}</p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {flag.flaggedBy.firstName} {flag.flaggedBy.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(flag.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/moderation/flag/${flag.id}`}>
                                Review
                              </Link>
                            </Button>
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

        {/* Trades Tab */}
        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Pending Trade Requests</CardTitle>
              <CardDescription>
                Review and approve IC Practicum trade requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTrades.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">
                    No trade requests pending approval
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell>
                          <p className="font-medium font-mono">{trade.symbol}</p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.type === 'BUY' ? 'success' : 'destructive'}
                          >
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{trade.quantity} shares</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={trade.portfolio.user.avatarUrl || undefined}
                              />
                              <AvatarFallback className="text-xs">
                                {trade.portfolio.user.firstName[0]}
                                {trade.portfolio.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {trade.portfolio.user.firstName}{' '}
                              {trade.portfolio.user.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(trade.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/trades/${trade.id}`}>Review</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
