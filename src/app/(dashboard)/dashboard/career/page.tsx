import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  Users,
  Lightbulb,
  Calculator,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';

async function getCareerData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      careerPlans: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
      networkingRequestsSent: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      seedSubmissions: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          reviews: true,
        },
      },
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  // Check if user is eligible for career track (16+)
  const isEligible = ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'].includes(ageBand);

  return {
    user,
    careerPlan: user.careerPlans[0] || null,
    networkingRequests: user.networkingRequestsSent,
    seedSubmissions: user.seedSubmissions,
    ageBand,
    isEligible,
  };
}

function CareerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default async function CareerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<CareerSkeleton />}>
      <CareerContent userId={user.id} />
    </Suspense>
  );
}

async function CareerContent({ userId }: { userId: string }) {
  const data = await getCareerData(userId);

  if (!data) {
    redirect('/login');
  }

  const { careerPlan, networkingRequests, seedSubmissions, ageBand, isEligible } = data;

  if (!isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Career & Identity</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Career & Identity track is available for members ages 16 and up.
              Continue your learning journey to unlock this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingNetworking = networkingRequests.filter((r) => r.status === 'pending').length;
  const approvedNetworking = networkingRequests.filter((r) => r.status === 'approved' || r.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Career & Identity</h1>
        <p className="text-muted-foreground mt-1">
          Navigate your professional path with clarity and purpose
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Career Plan</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {careerPlan ? (
                <Badge variant={
                  careerPlan.mentorReviewStatus === 'approved' ? 'success' :
                  careerPlan.mentorReviewStatus === 'reviewed' ? 'warning' :
                  'secondary'
                }>
                  {careerPlan.mentorReviewStatus || 'Draft'}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-base">Not started</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networking</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedNetworking}</div>
            <p className="text-xs text-muted-foreground">
              {pendingNetworking} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seed Ideas</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{seedSubmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              Submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Templates & tools
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Career Plan Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Career Plan Builder
                </CardTitle>
                <CardDescription>
                  Define your career goals and create an action plan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {careerPlan ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{careerPlan.title}</h4>
                  {careerPlan.currentStage && (
                    <p className="text-sm text-muted-foreground">
                      Stage: {careerPlan.currentStage}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    careerPlan.mentorReviewStatus === 'approved' ? 'success' :
                    careerPlan.mentorReviewStatus === 'pending' ? 'warning' :
                    'secondary'
                  }>
                    {careerPlan.mentorReviewStatus || 'Draft'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Updated {formatDate(careerPlan.updatedAt)}
                  </span>
                </div>
                {careerPlan.mentorFeedback && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Mentor Feedback</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {careerPlan.mentorFeedback}
                    </p>
                  </div>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/career/plan">
                    Continue Plan
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Create a career plan to clarify your goals and get mentor support
                </p>
                <Button asChild>
                  <Link href="/dashboard/career/plan/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Career Plan
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Networking Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Networking Introductions
                </CardTitle>
                <CardDescription>
                  Request introductions through your mentor network
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/career/networking/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {networkingRequests.length > 0 ? (
              <div className="space-y-3">
                {networkingRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      request.status === 'connected' ? 'bg-green-100' :
                      request.status === 'approved' ? 'bg-blue-100' :
                      request.status === 'declined' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      {request.status === 'connected' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : request.status === 'approved' ? (
                        <Clock className="h-4 w-4 text-blue-600" />
                      ) : request.status === 'declined' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{request.targetName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.targetCompany || request.purpose}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {request.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/career/networking">
                    View All
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Request introductions to expand your professional network
                </p>
                <Button asChild>
                  <Link href="/dashboard/career/networking/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Request Introduction
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entrepreneurship Seed Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Entrepreneurship Seed Review
            </CardTitle>
            <CardDescription>
              Submit business ideas for feedback from mentors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {seedSubmissions.length > 0 ? (
              <div className="space-y-3">
                {seedSubmissions.map((submission) => (
                  <div key={submission.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{submission.title}</h4>
                      <Badge variant={
                        submission.status === 'APPROVED' ? 'success' :
                        submission.status === 'FEEDBACK_PROVIDED' ? 'warning' :
                        submission.status === 'REJECTED' ? 'destructive' :
                        'secondary'
                      }>
                        {submission.status.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {submission.description}
                    </p>
                    {submission.reviews.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {submission.reviews.length} review(s)
                      </p>
                    )}
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/career/entrepreneurship">
                    View All
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Have a business idea? Submit it for expert feedback
                </p>
                <Button asChild>
                  <Link href="/dashboard/career/entrepreneurship/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Idea
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compensation Toolkit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Compensation Toolkit
            </CardTitle>
            <CardDescription>
              Tools for understanding and negotiating compensation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/career/compensation/compare">
                  <FileText className="mr-2 h-4 w-4" />
                  Offer Comparison Tool
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/career/compensation/equity">
                  <FileText className="mr-2 h-4 w-4" />
                  Equity Basics Guide
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/career/compensation/negotiation">
                  <FileText className="mr-2 h-4 w-4" />
                  Negotiation Scripts
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
