'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  Folder,
  BookOpen,
  FileText,
  Video,
  Calculator,
  MoreVertical,
  Trash2,
  FolderPlus,
  Star,
  Clock,
  Grid,
  List,
  Filter,
  SortAsc,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

// Mock bookmarks data
const bookmarks = [
  {
    id: 'b1',
    title: 'Understanding Compound Interest',
    type: 'lesson',
    category: 'Investing Basics',
    description: 'Learn how compound interest can grow your money over time',
    savedAt: '2024-02-18',
    folder: null,
    isFavorite: true,
    progress: 75,
  },
  {
    id: 'b2',
    title: 'Budget Planning Calculator',
    type: 'tool',
    category: 'Financial Tools',
    description: 'Interactive calculator to plan your monthly budget',
    savedAt: '2024-02-17',
    folder: 'Tools',
    isFavorite: false,
    progress: null,
  },
  {
    id: 'b3',
    title: 'Stock Market Basics Video',
    type: 'video',
    category: 'Investing',
    description: 'Introduction to how the stock market works',
    savedAt: '2024-02-16',
    folder: 'Watch Later',
    isFavorite: true,
    progress: 30,
    duration: '12:45',
  },
  {
    id: 'b4',
    title: 'Emergency Fund Guide',
    type: 'article',
    category: 'Saving',
    description: 'Complete guide to building your emergency fund',
    savedAt: '2024-02-15',
    folder: null,
    isFavorite: false,
    progress: 100,
    readTime: '8 min',
  },
  {
    id: 'b5',
    title: 'Investing Quiz',
    type: 'quiz',
    category: 'Investing Basics',
    description: 'Test your knowledge of investing fundamentals',
    savedAt: '2024-02-14',
    folder: 'Study',
    isFavorite: false,
    progress: 0,
    questions: 15,
  },
  {
    id: 'b6',
    title: 'Net Worth Calculator',
    type: 'tool',
    category: 'Financial Tools',
    description: 'Calculate your total net worth',
    savedAt: '2024-02-13',
    folder: 'Tools',
    isFavorite: true,
    progress: null,
  },
];

const folders = [
  { id: 'f1', name: 'Tools', count: 2, color: 'bg-blue-500' },
  { id: 'f2', name: 'Watch Later', count: 1, color: 'bg-purple-500' },
  { id: 'f3', name: 'Study', count: 1, color: 'bg-green-500' },
];

const typeIcons: Record<string, any> = {
  lesson: BookOpen,
  video: Video,
  article: FileText,
  tool: Calculator,
  quiz: FileText,
};

const typeColors: Record<string, string> = {
  lesson: 'bg-blue-100 text-blue-700',
  video: 'bg-red-100 text-red-700',
  article: 'bg-green-100 text-green-700',
  tool: 'bg-purple-100 text-purple-700',
  quiz: 'bg-orange-100 text-orange-700',
};

export default function BookmarksPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'favorites' && b.isFavorite) ||
      (activeTab === 'recent' && true) ||
      activeTab === b.type;

    const matchesFolder = !selectedFolder || b.folder === selectedFolder;

    return matchesSearch && matchesTab && matchesFolder;
  });

  const handleRemoveBookmark = (id: string) => {
    // In a real app, this would call an API
    console.log('Remove bookmark:', id);
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bookmark className="h-8 w-8 text-indigo-500" />
            Bookmarks
          </h1>
          <p className="text-muted-foreground mt-1">
            Save and organize your favorite content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookmarkCheck className="h-6 w-6 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold">{bookmarks.length}</p>
            <p className="text-sm text-muted-foreground">Total Saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{bookmarks.filter(b => b.isFavorite).length}</p>
            <p className="text-sm text-muted-foreground">Favorites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Folder className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{folders.length}</p>
            <p className="text-sm text-muted-foreground">Folders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Added This Week</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Folders Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Folders</CardTitle>
                <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                      <DialogDescription>
                        Organize your bookmarks into folders
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="folder-name">Folder Name</Label>
                      <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., Study Materials"
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowNewFolder(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setShowNewFolder(false)}>
                        Create Folder
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button
                variant={selectedFolder === null ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedFolder(null)}
              >
                <Bookmark className="h-4 w-4 mr-2" />
                All Bookmarks
                <Badge variant="secondary" className="ml-auto">
                  {bookmarks.length}
                </Badge>
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.name ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedFolder(folder.name)}
                >
                  <div className={`w-3 h-3 rounded ${folder.color} mr-2`} />
                  {folder.name}
                  <Badge variant="secondary" className="ml-auto">
                    {folder.count}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>All Types</DropdownMenuItem>
                  <DropdownMenuItem>Lessons</DropdownMenuItem>
                  <DropdownMenuItem>Videos</DropdownMenuItem>
                  <DropdownMenuItem>Articles</DropdownMenuItem>
                  <DropdownMenuItem>Tools</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Newest First</DropdownMenuItem>
                  <DropdownMenuItem>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem>Alphabetical</DropdownMenuItem>
                  <DropdownMenuItem>By Type</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="lesson">Lessons</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="tool">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredBookmarks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No bookmarks found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'Try a different search term'
                        : 'Start saving content to see it here'}
                    </p>
                  </CardContent>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBookmarks.map((bookmark) => {
                    const Icon = typeIcons[bookmark.type] || FileText;
                    return (
                      <Card key={bookmark.id} className="hover:shadow-lg transition-all group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${typeColors[bookmark.type]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Star className="h-4 w-4 mr-2" />
                                  {bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Folder className="h-4 w-4 mr-2" />
                                  Move to folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleRemoveBookmark(bookmark.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove bookmark
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <h3 className="font-semibold mb-1 line-clamp-1">{bookmark.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {bookmark.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {bookmark.category}
                            </Badge>
                            {bookmark.isFavorite && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>

                          {bookmark.progress !== null && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progress</span>
                                <span>{bookmark.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full"
                                  style={{ width: `${bookmark.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredBookmarks.map((bookmark) => {
                    const Icon = typeIcons[bookmark.type] || FileText;
                    return (
                      <Card key={bookmark.id} className="hover:shadow-md transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${typeColors[bookmark.type]}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{bookmark.title}</h3>
                                {bookmark.isFavorite && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {bookmark.description}
                              </p>
                            </div>
                            <Badge variant="outline">{bookmark.category}</Badge>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {bookmark.savedAt}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Star className="h-4 w-4 mr-2" />
                                  Toggle favorite
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Folder className="h-4 w-4 mr-2" />
                                  Move to folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
