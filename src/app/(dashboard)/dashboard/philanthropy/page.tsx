import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDate, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  Target,
  Vote,
  BarChart3,
  Plus,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

async function getPhilanthropyData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      givingStrategies: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
      grantProposals: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      votes: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          proposal: true,
        },
      },
      impactNotes: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  // Check if user is eligible for philanthropy track (20+)
  const isEligible = ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'].includes(ageBand);

  // Get pending proposals that need votes
  const pendingVoteProposals = await prisma.grantProposal.findMany({
    where: {
      votingRequired: true,
      status: 'under_review',
      votes: {
        none: {
          userId: userId,
        },
      },
    },
    take: 3,
  });

  return {
    user,
    givingStrategy: user.givingStrategies[0] || null,
    grantProposals: user.grantProposals,
    recentVotes: user.votes,
    impactNotes: user.impactNotes,
    pendingVoteProposals,
    ageBand,
    isEligible,
  };
}

function PhilanthropySkeleton() {
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

export default async function PhilanthropyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<PhilanthropySkeleton />}>
      <PhilanthropyContent userId={user.id} />
    </Suspense>
  );
}

async function PhilanthropyContent({ userId }: { userId: string }) {
  const data = await getPhilanthropyData(userId);

  if (!data) {
    redirect('/login');
  }

  const {
    givingStrategy,
    grantProposals,
    recentVotes,
    impactNotes,
    pendingVoteProposals,
    ageBand,
    isEligible,
  } = data;

  if (!isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">Philanthropic Leadership</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The Philanthropic Leadership track is available for members ages 20 and up.
              Continue your learning journey to unlock this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalGranted = grantProposals
    .filter((p) => p.status === 'funded')
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingGrants = grantProposals.filter((p) => p.status === 'under_review').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Philanthropic Leadership</h1>
        <p className="text-muted-foreground mt-1">
          Create meaningful impact through strategic giving
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giving Strategy</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {givingStrategy ? (
                <Badge variant={givingStrategy.status === 'active' ? 'success' : 'secondary'}>
                  {givingStrategy.status || 'Draft'}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-base">Not created</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Granted</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGranted)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingGrants} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Votes</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVoteProposals.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your input
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Notes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{impactNotes.length}</div>
            <p className="text-xs text-muted-foreground">
              Documented
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Giving Strategy Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Giving Strategy
                </CardTitle>
                <CardDescription>
                  Define your values, causes, and grant criteria
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {givingStrategy ? (
              <div className="space-y-4">
                <h4 className="font-medium">{givingStrategy.title}</h4>
                {givingStrategy.thesis && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {givingStrategy.thesis}
                  </p>
                )}
                {givingStrategy.annualBudget && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Annual Budget</span>
                    <span className="font-medium">{formatCurrency(givingStrategy.annualBudget)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {givingStrategy.status || 'Draft'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Updated {formatDate(givingStrategy.updatedAt)}
                  </span>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/philanthropy/strategy">
                    Edit Strategy
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Create a giving strategy to guide your philanthropic decisions
                </p>
                <Button asChild>
                  <Link href="/dashboard/philanthropy/strategy/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Strategy
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grant Proposals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Grant Proposals
                </CardTitle>
                <CardDescription>
                  Track and manage grant applications
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/philanthropy/grants/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {grantProposals.length > 0 ? (
              <div className="space-y-3">
                {grantProposals.slice(0, 3).map((proposal) => (
                  <div key={proposal.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      proposal.status === 'funded' ? 'bg-green-100' :
                      proposal.status === 'approved' ? 'bg-blue-100' :
                      proposal.status === 'declined' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      {proposal.status === 'funded' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : proposal.status === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      ) : proposal.status === 'declined' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{proposal.organizationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(proposal.amount)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {proposal.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/philanthropy/grants">
                    View All Grants
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Start tracking your grant proposals
                </p>
                <Button asChild>
                  <Link href="/dashboard/philanthropy/grants/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Proposal
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Voting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Committee Voting
            </CardTitle>
            <CardDescription>
              Vote on grant proposals requiring committee approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingVoteProposals.length > 0 ? (
              <div className="space-y-3">
                {pendingVoteProposals.map((proposal) => (
                  <div key={proposal.id} className="p-3 border rounded-lg border-yellow-200 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{proposal.organizationName}</h4>
                      <Badge variant="warning">Vote Needed</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {formatCurrency(proposal.amount)} · {proposal.purpose}
                    </p>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/philanthropy/voting/${proposal.id}`}>
                        Review & Vote
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No proposals currently awaiting your vote
                </p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/dashboard/philanthropy/voting">
                View Voting History
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Impact Measurement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Impact Measurement
            </CardTitle>
            <CardDescription>
              Track and document the impact of your giving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Document outcomes and measure the impact of grants you've supported.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/philanthropy/impact">
                    View Reports
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/philanthropy/impact/new">
                    Add Note
                  </Link>
                </Button>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/resources/templates?type=impact">
                  <FileText className="mr-2 h-4 w-4" />
                  Impact Templates
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
