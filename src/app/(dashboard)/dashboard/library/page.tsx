'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, Search, Download, ExternalLink, FileText, Video,
  Headphones, Calculator, Star, Clock, Filter, Grid, List,
  Bookmark, BookmarkCheck, Eye
} from 'lucide-react';

const resources = [
  {
    id: '1',
    title: 'Budgeting Basics Workbook',
    description: 'A comprehensive workbook to help you create and maintain your first budget.',
    type: 'pdf',
    category: 'Budgeting',
    downloads: 1240,
    rating: 4.8,
    duration: null,
    fileSize: '2.4 MB',
    thumbnail: null,
    saved: true,
    featured: true,
  },
  {
    id: '2',
    title: 'Introduction to Compound Interest',
    description: 'Video explaining the power of compound interest with real-world examples.',
    type: 'video',
    category: 'Investing',
    downloads: 890,
    rating: 4.9,
    duration: '12:34',
    fileSize: null,
    thumbnail: null,
    saved: false,
    featured: true,
  },
  {
    id: '3',
    title: 'Emergency Fund Calculator',
    description: 'Interactive calculator to determine your ideal emergency fund size.',
    type: 'tool',
    category: 'Savings',
    downloads: 2100,
    rating: 4.7,
    duration: null,
    fileSize: null,
    thumbnail: null,
    saved: true,
    featured: false,
  },
  {
    id: '4',
    title: 'Financial Planning Podcast - Episode 1',
    description: 'Expert interviews on building wealth in your 20s and 30s.',
    type: 'audio',
    category: 'General',
    downloads: 560,
    rating: 4.6,
    duration: '45:00',
    fileSize: null,
    thumbnail: null,
    saved: false,
    featured: false,
  },
  {
    id: '5',
    title: 'Tax Deductions Cheat Sheet',
    description: 'Quick reference guide for common tax deductions and credits.',
    type: 'pdf',
    category: 'Taxes',
    downloads: 1850,
    rating: 4.9,
    duration: null,
    fileSize: '890 KB',
    thumbnail: null,
    saved: false,
    featured: true,
  },
  {
    id: '6',
    title: 'Investment Portfolio Tracker',
    description: 'Spreadsheet template to track your investments and returns.',
    type: 'spreadsheet',
    category: 'Investing',
    downloads: 1420,
    rating: 4.5,
    duration: null,
    fileSize: '1.2 MB',
    thumbnail: null,
    saved: true,
    featured: false,
  },
  {
    id: '7',
    title: 'Credit Score Improvement Guide',
    description: 'Step-by-step guide to understanding and improving your credit score.',
    type: 'pdf',
    category: 'Credit',
    downloads: 980,
    rating: 4.7,
    duration: null,
    fileSize: '1.8 MB',
    thumbnail: null,
    saved: false,
    featured: false,
  },
  {
    id: '8',
    title: 'Retirement Planning Workshop Recording',
    description: 'Full recording of our retirement planning workshop with Q&A.',
    type: 'video',
    category: 'Retirement',
    downloads: 650,
    rating: 4.8,
    duration: '1:23:45',
    fileSize: null,
    thumbnail: null,
    saved: false,
    featured: false,
  },
];

const categories = ['All', 'Budgeting', 'Investing', 'Savings', 'Taxes', 'Credit', 'Retirement', 'General'];
const types = ['All', 'pdf', 'video', 'audio', 'tool', 'spreadsheet'];

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  audio: <Headphones className="h-5 w-5" />,
  tool: <Calculator className="h-5 w-5" />,
  spreadsheet: <FileText className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  pdf: 'bg-red-100 text-red-600',
  video: 'bg-blue-100 text-blue-600',
  audio: 'bg-purple-100 text-purple-600',
  tool: 'bg-green-100 text-green-600',
  spreadsheet: 'bg-emerald-100 text-emerald-600',
};

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('all');

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesType = selectedType === 'All' || resource.type === selectedType;
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'saved' && resource.saved) ||
      (activeTab === 'featured' && resource.featured);

    return matchesSearch && matchesCategory && matchesType && matchesTab;
  });

  const savedCount = resources.filter(r => r.saved).length;
  const totalDownloads = resources.reduce((sum, r) => sum + r.downloads, 0);

  const toggleSave = (id: string) => {
    // Would trigger API call
    console.log('Toggle save:', id);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Resource Library</h1>
          <p className="text-muted-foreground">Downloadable guides, tools, and media to support your learning</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resources.length}</p>
              <p className="text-sm text-muted-foreground">Total Resources</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{resources.filter(r => r.featured).length}</p>
              <p className="text-sm text-muted-foreground">Featured</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Bookmark className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{savedCount}</p>
              <p className="text-sm text-muted-foreground">Saved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDownloads.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Downloads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {types.map((type) => (
                <option key={type} value={type}>{type === 'All' ? 'All Types' : type.toUpperCase()}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    {/* Thumbnail */}
                    <div className={`h-32 ${typeColors[resource.type]} flex items-center justify-center`}>
                      {typeIcons[resource.type]}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {resource.featured && (
                              <Badge className="bg-yellow-100 text-yellow-700">Featured</Badge>
                            )}
                            <Badge variant="outline" className="capitalize">{resource.type}</Badge>
                          </div>
                          <h3 className="font-semibold line-clamp-1">{resource.title}</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSave(resource.id)}
                        >
                          {resource.saved ? (
                            <BookmarkCheck className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          {resource.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {resource.downloads.toLocaleString()}
                        </span>
                        {resource.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {resource.duration}
                          </span>
                        )}
                        {resource.fileSize && (
                          <span>{resource.fileSize}</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${typeColors[resource.type]}`}>
                        {typeIcons[resource.type]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{resource.title}</h3>
                          {resource.featured && (
                            <Badge className="bg-yellow-100 text-yellow-700">Featured</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{resource.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{resource.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {resource.rating}
                          </span>
                          <span>{resource.downloads.toLocaleString()} downloads</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSave(resource.id)}
                        >
                          {resource.saved ? (
                            <BookmarkCheck className="h-4 w-4 text-indigo-600" />
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {filteredResources.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No resources found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
