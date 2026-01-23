import { Suspense } from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatDate, getAgeBand } from '@/lib/utils';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Search,
  BookOpen,
  Bookmark,
  ExternalLink,
  Filter,
  FolderOpen,
  ChevronRight,
} from 'lucide-react';

async function getResourcesData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
    },
  });

  if (!user) return null;

  const ageBand = getAgeBand(user.dateOfBirth, user.ageBandOverride);

  // Get resources filtered by age band
  const resources = await prisma.resource.findMany({
    where: {
      isPublished: true,
      OR: [
        { ageBands: { some: { type: ageBand } } },
        { ageBands: { none: {} } }, // Resources available to all age bands
      ],
    },
    include: {
      category: true,
      ageBands: true,
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: [
      { isFeatured: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  // Get categories with counts
  const categories = await prisma.resourceCategory.findMany({
    include: {
      _count: {
        select: { resources: { where: { isPublished: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Get glossary term count
  const glossaryCount = await prisma.glossaryTerm.count({
    where: { isPublished: true },
  });

  // Get featured resources
  const featuredResources = resources.filter((r) => r.isFeatured).slice(0, 4);

  return {
    user,
    resources,
    categories,
    glossaryCount,
    featuredResources,
    ageBand,
  };
}

function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

const typeIcons: Record<string, any> = {
  DOCUMENT: FileText,
  VIDEO: Video,
  ARTICLE: BookOpen,
  LINK: LinkIcon,
  DOWNLOAD: Download,
};

const typeColors: Record<string, string> = {
  DOCUMENT: 'bg-blue-100 text-blue-600',
  VIDEO: 'bg-purple-100 text-purple-600',
  ARTICLE: 'bg-green-100 text-green-600',
  LINK: 'bg-orange-100 text-orange-600',
  DOWNLOAD: 'bg-red-100 text-red-600',
};

export default async function ResourcesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<ResourcesSkeleton />}>
      <ResourcesContent userId={user.id} />
    </Suspense>
  );
}

async function ResourcesContent({ userId }: { userId: string }) {
  const data = await getResourcesData(userId);

  if (!data) {
    redirect('/login');
  }

  const { resources, categories, glossaryCount, featuredResources } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Resource Library</h1>
        <p className="text-muted-foreground mt-1">
          Educational materials, guides, and reference documents
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/dashboard/resources/glossary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-ascent-gold/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-ascent-gold" />
                </div>
                <div>
                  <p className="font-semibold">Glossary</p>
                  <p className="text-sm text-muted-foreground">{glossaryCount} terms</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/dashboard/resources?type=VIDEO">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Video className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Videos</p>
                  <p className="text-sm text-muted-foreground">
                    {resources.filter((r) => r.type === 'VIDEO').length} resources
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/dashboard/resources?type=DOCUMENT">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Documents</p>
                  <p className="text-sm text-muted-foreground">
                    {resources.filter((r) => r.type === 'DOCUMENT').length} resources
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/dashboard/resources/bookmarks">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <Bookmark className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold">Bookmarks</p>
                  <p className="text-sm text-muted-foreground">Your saved items</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Featured Resources</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredResources.map((resource) => {
              const Icon = typeIcons[resource.type] || FileText;
              const colorClass = typeColors[resource.type] || 'bg-gray-100 text-gray-600';

              return (
                <Card
                  key={resource.id}
                  className="hover:shadow-md transition-shadow border-ascent-gold/30"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="gold">Featured</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-1 line-clamp-2">{resource.title}</h3>
                    {resource.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description}
                      </p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link
                        href={resource.url || `/dashboard/resources/${resource.id}`}
                        target={resource.url ? '_blank' : undefined}
                      >
                        {resource.url ? (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </>
                        ) : (
                          'View Resource'
                        )}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Browse Resources</CardTitle>
          <CardDescription>
            Search and filter through our library of educational materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search resources..." className="pl-9" />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} ({category._count.resources})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DOCUMENT">Documents</SelectItem>
                <SelectItem value="VIDEO">Videos</SelectItem>
                <SelectItem value="ARTICLE">Articles</SelectItem>
                <SelectItem value="LINK">Links</SelectItem>
                <SelectItem value="DOWNLOAD">Downloads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resource Grid */}
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Resources Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {resources.filter((r) => !r.isFeatured).slice(0, 12).map((resource) => {
                const Icon = typeIcons[resource.type] || FileText;
                const colorClass = typeColors[resource.type] || 'bg-gray-100 text-gray-600';

                return (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1">{resource.title}</h3>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {resource.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {resource.category && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.category.name}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(resource.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={resource.url || `/dashboard/resources/${resource.id}`}
                            target={resource.url ? '_blank' : undefined}
                          >
                            {resource.url ? (
                              <ExternalLink className="h-4 w-4" />
                            ) : (
                              'View'
                            )}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {resources.length > 12 && (
            <div className="text-center mt-6">
              <Button variant="outline">Load More Resources</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Browse by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/dashboard/resources?category=${category.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{category.name}</span>
                </div>
                <Badge variant="secondary">{category._count.resources}</Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
