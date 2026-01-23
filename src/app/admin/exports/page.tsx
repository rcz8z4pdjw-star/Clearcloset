import { Suspense } from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  FileSpreadsheet,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  Calendar,
  FileText,
  Shield,
} from 'lucide-react';
import { ExportButton } from './export-button';

async function getExportStats() {
  const [userCount, lessonCount, badgeCount, quizAttemptCount, sessionCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.lessonProgress.count({ where: { completedAt: { not: null } } }),
      prisma.userBadge.count(),
      prisma.quizAttempt.count(),
      prisma.mentorshipSession.count(),
    ]);

  return {
    userCount,
    lessonCount,
    badgeCount,
    quizAttemptCount,
    sessionCount,
  };
}

function ExportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default async function ExportsPage() {
  await requireRole(['ADMIN', 'COMPLIANCE', 'PROGRAM_DIRECTOR']);

  return (
    <Suspense fallback={<ExportSkeleton />}>
      <ExportsContent />
    </Suspense>
  );
}

async function ExportsContent() {
  const stats = await getExportStats();

  const exportTypes = [
    {
      id: 'users',
      title: 'User Data',
      description: 'Export all user profiles, roles, and account information',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      fields: [
        { id: 'profile', label: 'Profile Information' },
        { id: 'roles', label: 'Roles & Permissions' },
        { id: 'households', label: 'Household Memberships' },
        { id: 'cohorts', label: 'Cohort Memberships' },
      ],
      count: stats.userCount,
    },
    {
      id: 'progress',
      title: 'Learning Progress',
      description: 'Export lesson completions, quiz scores, and learning data',
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600',
      fields: [
        { id: 'lessons', label: 'Lesson Progress' },
        { id: 'quizzes', label: 'Quiz Attempts' },
        { id: 'exercises', label: 'Exercise Submissions' },
        { id: 'badges', label: 'Badge Awards' },
      ],
      count: stats.lessonCount,
    },
    {
      id: 'mentorship',
      title: 'Mentorship Data',
      description: 'Export mentorship sessions, assignments, and notes',
      icon: Calendar,
      color: 'bg-purple-100 text-purple-600',
      fields: [
        { id: 'sessions', label: 'Session Records' },
        { id: 'assignments', label: 'Mentor Assignments' },
        { id: 'notes', label: 'Session Notes (non-private)' },
      ],
      count: stats.sessionCount,
    },
    {
      id: 'portfolio',
      title: 'IC Practicum',
      description: 'Export portfolio data, trades, and performance metrics',
      icon: FileSpreadsheet,
      color: 'bg-orange-100 text-orange-600',
      fields: [
        { id: 'portfolios', label: 'Portfolio Summary' },
        { id: 'trades', label: 'Trade History' },
        { id: 'holdings', label: 'Current Holdings' },
        { id: 'performance', label: 'Performance Metrics' },
      ],
      count: 0,
    },
    {
      id: 'content',
      title: 'Content Library',
      description: 'Export tracks, modules, lessons, and resources',
      icon: BookOpen,
      color: 'bg-yellow-100 text-yellow-600',
      fields: [
        { id: 'tracks', label: 'Learning Tracks' },
        { id: 'modules', label: 'Modules' },
        { id: 'lessons', label: 'Lessons' },
        { id: 'resources', label: 'Resources' },
      ],
      count: 0,
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'Export system audit logs and compliance records',
      icon: Shield,
      color: 'bg-red-100 text-red-600',
      fields: [
        { id: 'logins', label: 'Login Events' },
        { id: 'changes', label: 'Data Changes' },
        { id: 'approvals', label: 'Approval Actions' },
        { id: 'exports', label: 'Export History' },
      ],
      count: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Data Exports</h1>
        <p className="text-muted-foreground mt-1">
          Export platform data for reporting, compliance, and analysis
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{stats.userCount}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{stats.lessonCount}</p>
                <p className="text-xs text-muted-foreground">Lessons Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{stats.badgeCount}</p>
                <p className="text-xs text-muted-foreground">Badges Awarded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{stats.quizAttemptCount}</p>
                <p className="text-xs text-muted-foreground">Quiz Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold">{stats.sessionCount}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exportTypes.map((exportType) => (
          <Card key={exportType.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div
                  className={`h-10 w-10 rounded-lg ${exportType.color} flex items-center justify-center`}
                >
                  <exportType.icon className="h-5 w-5" />
                </div>
                {exportType.count > 0 && (
                  <Badge variant="secondary">{exportType.count} records</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{exportType.title}</CardTitle>
              <CardDescription>{exportType.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {exportType.fields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox id={`${exportType.id}-${field.id}`} defaultChecked />
                    <Label
                      htmlFor={`${exportType.id}-${field.id}`}
                      className="text-sm font-normal"
                    >
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <ExportButton type={exportType.id} format="csv" />
                <ExportButton type={exportType.id} format="xlsx" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report</CardTitle>
          <CardDescription>
            Build a custom export with specific date ranges and filters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress Report</SelectItem>
                  <SelectItem value="engagement">Engagement Report</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                  <SelectItem value="financial">IC Practicum Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Age Band Filter</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All age bands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Age Bands</SelectItem>
                  <SelectItem value="junior">Junior Foundations (10-12)</SelectItem>
                  <SelectItem value="teen">Teen Skills (13-15)</SelectItem>
                  <SelectItem value="launch">Launch (16-22)</SelectItem>
                  <SelectItem value="practicum">Stewardship Practicum (23-30)</SelectItem>
                  <SelectItem value="leadership">Leadership (25-35)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cohort Filter</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All cohorts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cohorts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select defaultValue="xlsx">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Generate Custom Report
          </Button>
        </CardContent>
      </Card>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Exports</CardTitle>
          <CardDescription>Your recent data export history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No recent exports</p>
            <p className="text-sm">Exports you generate will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
