'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Headphones, Search, Play, Pause, SkipBack, SkipForward,
  Volume2, Heart, Share2, Download, Clock, Calendar,
  ChevronRight, List, Grid
} from 'lucide-react';

const episodes = [
  {
    id: '1',
    title: 'Building Your First Emergency Fund',
    description: 'Learn the fundamentals of emergency funds - how much to save, where to keep it, and common mistakes to avoid.',
    duration: '24:35',
    publishedAt: '2024-02-12',
    category: 'Savings',
    host: 'Sarah Chen',
    guest: 'Marcus Williams',
    plays: 1240,
    saved: true,
    progress: 100,
    thumbnail: null,
  },
  {
    id: '2',
    title: 'Investing for Beginners: Getting Started',
    description: 'A complete guide for first-time investors. We cover brokerages, index funds, and how to start with just $100.',
    duration: '32:18',
    publishedAt: '2024-02-05',
    category: 'Investing',
    host: 'Marcus Williams',
    guest: null,
    plays: 2100,
    saved: false,
    progress: 45,
    thumbnail: null,
  },
  {
    id: '3',
    title: 'Credit Score Deep Dive',
    description: 'Everything you need to know about credit scores - how they work, what affects them, and how to improve yours.',
    duration: '28:42',
    publishedAt: '2024-01-29',
    category: 'Credit',
    host: 'Emma Johnson',
    guest: 'David Garcia',
    plays: 1850,
    saved: true,
    progress: 0,
    thumbnail: null,
  },
  {
    id: '4',
    title: 'Budgeting Methods That Actually Work',
    description: 'We test popular budgeting methods like 50/30/20, envelope system, and zero-based budgeting to find what works best.',
    duration: '35:10',
    publishedAt: '2024-01-22',
    category: 'Budgeting',
    host: 'Sarah Chen',
    guest: null,
    plays: 3200,
    saved: false,
    progress: 0,
    thumbnail: null,
  },
  {
    id: '5',
    title: 'Side Hustles and Passive Income',
    description: 'Exploring ways to earn extra money on the side - from freelancing to dividend investing.',
    duration: '41:23',
    publishedAt: '2024-01-15',
    category: 'Income',
    host: 'Marcus Williams',
    guest: 'Olivia Brown',
    plays: 2800,
    saved: false,
    progress: 72,
    thumbnail: null,
  },
  {
    id: '6',
    title: 'Tax Planning for Young Adults',
    description: 'Understanding taxes doesn\'t have to be scary. We break down the basics and share money-saving tips.',
    duration: '29:55',
    publishedAt: '2024-01-08',
    category: 'Taxes',
    host: 'David Garcia',
    guest: null,
    plays: 1560,
    saved: true,
    progress: 100,
    thumbnail: null,
  },
];

const categories = ['All', 'Savings', 'Investing', 'Credit', 'Budgeting', 'Income', 'Taxes'];

export default function PodcastPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch = episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      episode.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || episode.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePlay = (episodeId: string) => {
    if (currentlyPlaying === episodeId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentlyPlaying(episodeId);
      setIsPlaying(true);
    }
  };

  const totalListenTime = episodes.reduce((sum, ep) => {
    const [mins] = ep.duration.split(':').map(Number);
    return sum + (mins * (ep.progress / 100));
  }, 0);

  const completedEpisodes = episodes.filter(ep => ep.progress === 100).length;

  const currentEpisode = episodes.find(ep => ep.id === currentlyPlaying);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Podcast</h1>
          <p className="text-muted-foreground">Learn on the go with our expert-hosted episodes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Headphones className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{episodes.length}</p>
              <p className="text-sm text-muted-foreground">Episodes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Play className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedEpisodes}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(totalListenTime)}m</p>
              <p className="text-sm text-muted-foreground">Listen Time</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-pink-100 rounded-full">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{episodes.filter(e => e.saved).length}</p>
              <p className="text-sm text-muted-foreground">Saved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search episodes..."
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
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Episodes */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredEpisodes.map((episode) => (
            <Card key={episode.id} className={`hover:shadow-md transition-shadow ${currentlyPlaying === episode.id ? 'ring-2 ring-purple-300' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Play button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full shrink-0"
                    onClick={() => togglePlay(episode.id)}
                  >
                    {currentlyPlaying === episode.id && isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{episode.title}</h3>
                      {episode.progress === 100 && (
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{episode.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {episode.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(episode.publishedAt).toLocaleDateString()}
                      </span>
                      <Badge variant="outline">{episode.category}</Badge>
                      {episode.guest && (
                        <span>w/ {episode.guest}</span>
                      )}
                    </div>
                    {episode.progress > 0 && episode.progress < 100 && (
                      <Progress value={episode.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <Heart className={`h-4 w-4 ${episode.saved ? 'fill-pink-500 text-pink-500' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEpisodes.map((episode) => (
            <Card key={episode.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center relative">
                  <Headphones className="h-12 w-12 text-white/50" />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full shadow-lg"
                    onClick={() => togglePlay(episode.id)}
                  >
                    {currentlyPlaying === episode.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">{episode.category}</Badge>
                    <span className="text-xs text-muted-foreground">{episode.duration}</span>
                  </div>
                  <h3 className="font-semibold line-clamp-2 mb-2">{episode.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                  {episode.progress > 0 && episode.progress < 100 && (
                    <Progress value={episode.progress} className="h-1 mt-3" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Now Playing Bar */}
      {currentEpisode && (
        <Card className="fixed bottom-0 left-0 right-0 mx-auto max-w-4xl mb-4 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Headphones className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentEpisode.title}</p>
                <p className="text-sm text-muted-foreground">{currentEpisode.host}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="ghost" size="icon">
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredEpisodes.length === 0 && (
        <Card className="p-12 text-center">
          <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No episodes found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
