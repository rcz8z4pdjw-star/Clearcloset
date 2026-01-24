'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  BookOpen,
  Video,
  FileText,
  Users,
  Calculator,
  Trophy,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Star,
  Filter,
  X,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

// Mock search results
const mockResults = {
  lessons: [
    {
      id: 'l1',
      title: 'Understanding Compound Interest',
      description: 'Learn how compound interest works and how it can help grow your savings',
      category: 'Investing Basics',
      duration: '15 min',
      difficulty: 'Beginner',
    },
    {
      id: 'l2',
      title: 'Building Your First Budget',
      description: 'Step-by-step guide to creating a personal budget',
      category: 'Budgeting',
      duration: '20 min',
      difficulty: 'Beginner',
    },
    {
      id: 'l3',
      title: 'Introduction to Stock Market',
      description: 'Basics of how the stock market works',
      category: 'Investing',
      duration: '25 min',
      difficulty: 'Intermediate',
    },
  ],
  videos: [
    {
      id: 'v1',
      title: 'Stock Market Explained for Beginners',
      description: 'Visual explanation of stock market concepts',
      duration: '12:45',
      views: '2.3K',
    },
    {
      id: 'v2',
      title: 'How to Save Money as a Teen',
      description: 'Practical tips for young savers',
      duration: '8:30',
      views: '1.8K',
    },
  ],
  articles: [
    {
      id: 'a1',
      title: 'The 50/30/20 Budget Rule Explained',
      description: 'A simple framework for managing your money',
      readTime: '5 min',
      author: 'Sarah Williams',
    },
    {
      id: 'a2',
      title: 'Emergency Fund: Why and How',
      description: 'Building financial security with an emergency fund',
      readTime: '7 min',
      author: 'Michael Chen',
    },
  ],
  tools: [
    {
      id: 't1',
      title: 'Compound Interest Calculator',
      description: 'Calculate how your investments can grow over time',
    },
    {
      id: 't2',
      title: 'Budget Planner',
      description: 'Plan your monthly income and expenses',
    },
  ],
  users: [
    {
      id: 'u1',
      name: 'Alex Johnson',
      level: 8,
      relationship: 'Friend',
      avatar: null,
    },
    {
      id: 'u2',
      name: 'Jamie Smith',
      level: 6,
      relationship: 'Sibling',
      avatar: null,
    },
  ],
};

const recentSearches = ['compound interest', 'budget', 'investing', 'savings account'];

const trendingTopics = [
  { term: 'Stock market basics', searches: '2.1K' },
  { term: 'Emergency fund', searches: '1.8K' },
  { term: 'Compound interest', searches: '1.5K' },
  { term: 'Budget tips', searches: '1.2K' },
];

const suggestedForYou = [
  { title: 'Continue: Investing Basics', type: 'lesson', progress: 65 },
  { title: 'New: Retirement Planning', type: 'lesson', isNew: true },
  { title: 'Quiz: Test Your Budget Knowledge', type: 'quiz' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    if (query.length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
        setHasSearched(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setHasSearched(false);
    }
  }, [query]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setSelectedFilters([]);
  };

  const totalResults =
    mockResults.lessons.length +
    mockResults.videos.length +
    mockResults.articles.length +
    mockResults.tools.length +
    mockResults.users.length;

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Search className="h-10 w-10 text-blue-500" />
          Search
        </h1>
        <p className="text-muted-foreground">
          Find lessons, videos, tools, and more
        </p>
      </div>

      {/* Search Input */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for anything..."
              className="pl-12 h-14 text-lg border-0 focus-visible:ring-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {hasSearched && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {['Lessons', 'Videos', 'Articles', 'Tools', 'Beginner', 'Intermediate', 'Advanced'].map(
            (filter) => (
              <Badge
                key={filter}
                variant={selectedFilters.includes(filter) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </Badge>
            )
          )}
          {selectedFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Content based on search state */}
      {!hasSearched ? (
        <div className="space-y-6">
          {/* Recent Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <Badge
                    key={search}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setQuery(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div
                    key={topic.term}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => setQuery(topic.term)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="font-medium">{topic.term}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{topic.searches} searches</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested For You */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Suggested For You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestedForYou.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <span className="font-medium">{item.title}</span>
                        {item.progress && (
                          <p className="text-xs text-muted-foreground">{item.progress}% complete</p>
                        )}
                        {item.isNew && (
                          <Badge className="bg-green-100 text-green-700 text-xs mt-1">New</Badge>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : isSearching ? (
        <div className="text-center py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/4 mx-auto" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Found {totalResults} results for &quot;{query}&quot;
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({totalResults})</TabsTrigger>
              <TabsTrigger value="lessons">Lessons ({mockResults.lessons.length})</TabsTrigger>
              <TabsTrigger value="videos">Videos ({mockResults.videos.length})</TabsTrigger>
              <TabsTrigger value="articles">Articles ({mockResults.articles.length})</TabsTrigger>
              <TabsTrigger value="tools">Tools ({mockResults.tools.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6 space-y-6">
              {/* Lessons */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  Lessons
                </h3>
                <div className="space-y-3">
                  {mockResults.lessons.map((lesson) => (
                    <Card key={lesson.id} className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{lesson.category}</Badge>
                              <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                              <Badge variant="secondary">{lesson.difficulty}</Badge>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Videos */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" />
                  Videos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockResults.videos.map((video) => (
                    <Card key={video.id} className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <h4 className="font-medium">{video.title}</h4>
                        <p className="text-sm text-muted-foreground">{video.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{video.duration}</span>
                          <span>{video.views} views</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-purple-500" />
                  Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockResults.tools.map((tool) => (
                    <Card key={tool.id} className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-purple-100">
                          <Calculator className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{tool.title}</h4>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* People */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  People
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockResults.users.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Level {user.level} • {user.relationship}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <div className="space-y-3">
                {mockResults.lessons.map((lesson) => (
                  <Card key={lesson.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{lesson.category}</Badge>
                            <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                            <Badge variant="secondary">{lesson.difficulty}</Badge>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockResults.videos.map((video) => (
                  <Card key={video.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{video.title}</h4>
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{video.duration}</span>
                        <span>{video.views} views</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="articles" className="mt-6">
              <div className="space-y-3">
                {mockResults.articles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4">
                      <h4 className="font-medium">{article.title}</h4>
                      <p className="text-sm text-muted-foreground">{article.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{article.readTime} read</span>
                        <span>by {article.author}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tools" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockResults.tools.map((tool) => (
                  <Card key={tool.id} className="hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-purple-100">
                        <Calculator className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{tool.title}</h4>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
