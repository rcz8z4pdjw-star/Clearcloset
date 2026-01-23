import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatCurrency, formatPercentage, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  PiggyBank,
  Heart,
  BookOpen,
  Plus,
  ChevronRight,
  Target,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

async function getStewardshipData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      budgets: {
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      savingsGoals: {
        where: { isCompleted: false },
        orderBy: { createdAt: 'desc' },
        include: {
          habits: true,
        },
      },
      wealthStories: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  return {
    user,
    budget: user.budgets[0] || null,
    savingsGoals: user.savingsGoals,
    wealthStory: user.wealthStories[0] || null,
    ageBand,
  };
}

function StewardshipSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

export default async function StewardshipLabPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<StewardshipSkeleton />}>
      <StewardshipContent userId={user.id} />
    </Suspense>
  );
}

async function StewardshipContent({ userId }: { userId: string }) {
  const data = await getStewardshipData(userId);

  if (!data) {
    redirect('/login');
  }

  const { budget, savingsGoals, wealthStory, ageBand } = data;

  // Calculate budget stats
  const budgetCategories = (budget?.categories as Array<{ name: string; allocated: number; spent: number }>) || [];
  const totalAllocated = budgetCategories.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0);
  const budgetProgress = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Calculate savings progress
  const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const savingsProgress = totalSavingsTarget > 0 ? (totalSaved / totalSavingsTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Stewardship Lab</h1>
        <p className="text-muted-foreground mt-1">
          Practice financial stewardship with tools designed for your stage
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {budget ? (
              <>
                <div className="text-2xl font-bold">
                  {formatPercentage(budgetProgress, 0)} used
                </div>
                <Progress value={budgetProgress} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {formatCurrency(totalSpent)} of {formatCurrency(totalAllocated)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No budget created</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Goals</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsGoals.length}</div>
            <Progress value={savingsProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {formatCurrency(totalSaved)} saved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {savingsGoals.reduce((sum, g) => sum + g.habits.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tracking regularly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wealth Story</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wealthStory ? '1' : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {wealthStory ? 'Draft in progress' : 'Not started'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tools */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Budget Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Budget Builder
                </CardTitle>
                <CardDescription>
                  Create and track your personal budget
                </CardDescription>
              </div>
              <Badge variant="secondary">{ageBand.replace('_', ' ')}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {budget ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{budget.name}</span>
                  <Badge variant="outline">{budget.period}</Badge>
                </div>
                <div className="space-y-2">
                  {budgetCategories.slice(0, 3).map((category, index) => {
                    const categoryProgress = category.allocated > 0
                      ? (category.spent / category.allocated) * 100
                      : 0;
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{category.name}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(category.spent)} / {formatCurrency(category.allocated)}
                          </span>
                        </div>
                        <Progress value={categoryProgress} className="h-2" />
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/stewardship/budget">
                    View Full Budget
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Start tracking your spending with a personal budget
                </p>
                <Button asChild>
                  <Link href="/dashboard/stewardship/budget/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Budget
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Savings Goals
                </CardTitle>
                <CardDescription>
                  Set and track your savings targets
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/stewardship/savings/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savingsGoals.length > 0 ? (
              <div className="space-y-4">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const goalProgress = goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;
                  return (
                    <div key={goal.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{goal.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatPercentage(goalProgress, 0)}
                        </span>
                      </div>
                      <Progress value={goalProgress} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>Goal: {formatCurrency(goal.targetAmount)}</span>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/stewardship/savings">
                    View All Goals
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Set savings goals and build healthy habits
                </p>
                <Button asChild>
                  <Link href="/dashboard/stewardship/savings/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Goal
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Values-Based Spending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Values-Based Spending
            </CardTitle>
            <CardDescription>
              Align your spending with what matters most to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Explore exercises that help you understand your values and make
                spending decisions that align with them.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/stewardship/values">
                    Values Exercise
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/stewardship/values/spending">
                    Spending Review
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wealth Story Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Wealth Story Builder
            </CardTitle>
            <CardDescription>
              Craft your personal narrative about wealth and stewardship
            </CardDescription>
          </CardHeader>
          <CardContent>
            {wealthStory ? (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-1">{wealthStory.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {wealthStory.content}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={wealthStory.isSharedWithFamily ? 'success' : 'secondary'}>
                    {wealthStory.isSharedWithFamily ? 'Shared with family' : 'Private draft'}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/stewardship/wealth-story">
                    Continue Writing
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Write your personal wealth story to understand your relationship with money
                </p>
                <Button asChild>
                  <Link href="/dashboard/stewardship/wealth-story/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Writing
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
