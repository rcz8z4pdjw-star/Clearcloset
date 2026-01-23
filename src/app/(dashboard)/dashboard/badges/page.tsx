import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Award,
  Trophy,
  Star,
  Target,
  BookOpen,
  Flame,
  Medal,
  Crown,
  Lock,
  CheckCircle,
} from 'lucide-react';

async function getBadgesData(userId: string) {
  // Get all available badges
  const allBadges = await prisma.badge.findMany({
    include: {
      category: true,
    },
    orderBy: [
      { category: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
    ],
  });

  // Get user's earned badges
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: {
      badge: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { awardedAt: 'desc' },
  });

  const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));

  // Group badges by category
  const categories = await prisma.badgeCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  const badgesByCategory = categories.map((category) => ({
    ...category,
    badges: allBadges.filter((b) => b.categoryId === category.id),
    earnedCount: allBadges.filter((b) => b.categoryId === category.id && earnedBadgeIds.has(b.id)).length,
  }));

  // Calculate stats
  const stats = {
    totalBadges: allBadges.length,
    earnedBadges: earnedBadges.length,
    completionPercent: allBadges.length > 0 ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0,
    recentBadge: earnedBadges[0] || null,
  };

  return {
    allBadges,
    earnedBadges,
    earnedBadgeIds,
    badgesByCategory,
    stats,
  };
}

function BadgesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

const categoryIcons: Record<string, any> = {
  learning: BookOpen,
  achievement: Trophy,
  streak: Flame,
  mastery: Crown,
  community: Star,
  special: Medal,
};

const rarityColors: Record<string, string> = {
  COMMON: 'from-gray-400 to-gray-500',
  UNCOMMON: 'from-green-400 to-green-600',
  RARE: 'from-blue-400 to-blue-600',
  EPIC: 'from-purple-400 to-purple-600',
  LEGENDARY: 'from-yellow-400 to-orange-500',
};

export default async function BadgesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<BadgesSkeleton />}>
      <BadgesContent userId={user.id} />
    </Suspense>
  );
}

async function BadgesContent({ userId }: { userId: string }) {
  const { earnedBadges, earnedBadgeIds, badgesByCategory, stats } = await getBadgesData(userId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Badges</h1>
        <p className="text-muted-foreground mt-1">
          Track your achievements and milestones
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-ascent-gold/20 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-ascent-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.earnedBadges}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalBadges - stats.earnedBadges}</p>
                <p className="text-sm text-muted-foreground">To Unlock</p>
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
                <p className="text-2xl font-bold">{stats.completionPercent}%</p>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold truncate max-w-[120px]">
                  {stats.recentBadge?.badge.name || 'None'}
                </p>
                <p className="text-sm text-muted-foreground">Most Recent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Collection Progress</CardTitle>
          <CardDescription>
            Your journey to collecting all badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Progress value={stats.completionPercent} className="h-4" />
            </div>
            <span className="text-sm font-medium w-24 text-right">
              {stats.earnedBadges} / {stats.totalBadges}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Badges */}
      {earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-ascent-gold" />
              Recently Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {earnedBadges.slice(0, 5).map((ub) => (
                <div
                  key={ub.id}
                  className="flex-shrink-0 w-32 text-center"
                >
                  <div
                    className={`h-20 w-20 mx-auto rounded-full bg-gradient-to-br ${
                      rarityColors[ub.badge.rarity] || rarityColors.COMMON
                    } flex items-center justify-center shadow-lg`}
                  >
                    <Award className="h-10 w-10 text-white" />
                  </div>
                  <p className="font-semibold mt-2 text-sm">{ub.badge.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(ub.awardedAt)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badges by Category */}
      <div className="space-y-6">
        {badgesByCategory.map((category) => {
          const CategoryIcon = categoryIcons[category.slug] || Award;

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {category.earnedCount} / {category.badges.length}
                  </Badge>
                </div>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                  {category.badges.map((badge) => {
                    const isEarned = earnedBadgeIds.has(badge.id);
                    const earnedBadge = earnedBadges.find((ub) => ub.badgeId === badge.id);

                    return (
                      <div
                        key={badge.id}
                        className={`text-center p-4 rounded-lg border ${
                          isEarned
                            ? 'bg-gradient-to-b from-ascent-gold/10 to-transparent border-ascent-gold/30'
                            : 'bg-muted/30 opacity-60'
                        }`}
                      >
                        <div
                          className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center ${
                            isEarned
                              ? `bg-gradient-to-br ${rarityColors[badge.rarity] || rarityColors.COMMON} shadow-lg`
                              : 'bg-muted'
                          }`}
                        >
                          {isEarned ? (
                            <Award className="h-8 w-8 text-white" />
                          ) : (
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <p className="font-semibold mt-3 text-sm">{badge.name}</p>
                        {badge.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {badge.description}
                          </p>
                        )}
                        {isEarned && earnedBadge && (
                          <p className="text-xs text-ascent-gold mt-2">
                            Earned {formatDate(earnedBadge.awardedAt)}
                          </p>
                        )}
                        {!isEarned && badge.requirement && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {badge.requirement}
                          </p>
                        )}
                        <Badge
                          variant="outline"
                          className="mt-2 text-xs capitalize"
                        >
                          {badge.rarity.toLowerCase()}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {badgesByCategory.every((c) => c.badges.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Badges Available</h3>
            <p className="text-muted-foreground">
              Badge categories are being set up. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
