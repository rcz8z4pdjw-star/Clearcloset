import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser, hasAnyRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency, formatPercentage, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

async function getPortfolioData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  // Check if user is eligible for IC Practicum
  const isEligible = ['STEWARDSHIP_PRACTICUM', 'LEADERSHIP'].includes(ageBand) ||
    user.roles.some((r) => ['CIO', 'ADMIN'].includes(r.role));

  if (!isEligible) {
    return { isEligible: false, portfolio: null, trades: [] };
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: {
      userId,
      isActive: true,
    },
    include: {
      holdings: {
        orderBy: { symbol: 'asc' },
      },
      tradeRequests: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          approvals: {
            include: {
              approver: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
      snapshots: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  return {
    isEligible: true,
    portfolio,
    ageBand,
  };
}

function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
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

export default async function PortfolioPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<PortfolioSkeleton />}>
      <PortfolioContent userId={user.id} />
    </Suspense>
  );
}

async function PortfolioContent({ userId }: { userId: string }) {
  const data = await getPortfolioData(userId);

  if (!data) {
    redirect('/login');
  }

  if (!data.isEligible) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">IC Practicum Portfolio</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Not Yet Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The IC Practicum track is available for members in the Stewardship Practicum
              (ages 23-30) and Leadership (ages 25-35) bands. Continue your learning journey
              to unlock this feature.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { portfolio } = data;

  if (!portfolio) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">IC Practicum Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Practice portfolio management with guidance
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Portfolio Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              You haven't been assigned a practice portfolio yet. Contact your mentor
              or the program director to get started with the IC Practicum.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/mentorship">Contact Mentor</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate portfolio metrics
  const totalValue = portfolio.holdings.reduce(
    (sum, h) => sum + h.quantity * (h.currentPrice || h.averageCost),
    0
  );
  const totalCost = portfolio.holdings.reduce(
    (sum, h) => sum + h.quantity * h.averageCost,
    0
  );
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const pendingTrades = portfolio.tradeRequests.filter((t) => t.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ascent-navy">
            {portfolio.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            <Badge variant={portfolio.type === 'paper' ? 'secondary' : 'gold'}>
              {portfolio.type === 'paper' ? 'Paper Trading' : 'Real Capital'}
            </Badge>
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/practicum/portfolio/trade">
            <Plus className="mr-2 h-4 w-4" />
            New Trade
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-muted-foreground">
              Initial: {formatCurrency(portfolio.initialCapital)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold flex items-center gap-1 ${
                totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalGainLoss >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatCurrency(Math.abs(totalGainLoss))}
            </p>
            <p
              className={`text-xs ${
                totalGainLossPct >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalGainLossPct >= 0 ? '+' : ''}
              {formatPercentage(totalGainLossPct)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{portfolio.holdings.length}</p>
            <p className="text-xs text-muted-foreground">Positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingTrades.length}</p>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
          <CardDescription>Your current portfolio positions</CardDescription>
        </CardHeader>
        <CardContent>
          {portfolio.holdings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.holdings.map((holding) => {
                  const marketValue = holding.quantity * (holding.currentPrice || holding.averageCost);
                  const gainLoss = marketValue - holding.quantity * holding.averageCost;
                  const gainLossPct =
                    ((holding.currentPrice || holding.averageCost) - holding.averageCost) /
                    holding.averageCost *
                    100;
                  const weight = (marketValue / totalValue) * 100;

                  return (
                    <TableRow key={holding.id}>
                      <TableCell className="font-medium">{holding.symbol}</TableCell>
                      <TableCell>{holding.name}</TableCell>
                      <TableCell className="text-right">{holding.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${holding.averageCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(holding.currentPrice || holding.averageCost).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(marketValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`flex items-center justify-end gap-1 ${
                            gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {gainLoss >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {formatPercentage(gainLossPct)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={weight} className="w-16 h-2" />
                          <span className="text-xs w-10 text-right">
                            {formatPercentage(weight, 0)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No holdings yet. Submit a trade to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Trade Requests</CardTitle>
              <CardDescription>Your trade history and pending approvals</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/practicum/portfolio/trades">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {portfolio.tradeRequests.length > 0 ? (
            <div className="space-y-4">
              {portfolio.tradeRequests.slice(0, 5).map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center gap-4 p-4 rounded-lg border"
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      trade.status === 'APPROVED'
                        ? 'bg-green-100'
                        : trade.status === 'REJECTED'
                        ? 'bg-red-100'
                        : trade.status === 'EXECUTED'
                        ? 'bg-blue-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {trade.status === 'APPROVED' || trade.status === 'EXECUTED' ? (
                      <CheckCircle
                        className={`h-5 w-5 ${
                          trade.status === 'EXECUTED' ? 'text-blue-600' : 'text-green-600'
                        }`}
                      />
                    ) : trade.status === 'REJECTED' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.action === 'buy' ? 'success' : 'destructive'}>
                        {trade.action.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-muted-foreground">
                        {trade.quantity} shares
                        {trade.price && ` @ $${trade.price.toFixed(2)}`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {trade.thesis}
                    </p>
                  </div>
                  <Badge
                    variant={
                      trade.status === 'APPROVED' || trade.status === 'EXECUTED'
                        ? 'success'
                        : trade.status === 'REJECTED'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    {trade.status.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No trade requests yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
