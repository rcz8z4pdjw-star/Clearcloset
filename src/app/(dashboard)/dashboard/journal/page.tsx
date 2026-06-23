'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  BookOpen, Plus, Search, Calendar, Tag, Star, Trash2,
  Edit, Lock, Unlock, TrendingUp, Target, Lightbulb, Heart
} from 'lucide-react';

const journalEntries = [
  {
    id: '1',
    title: 'My First Investment Decision',
    content: 'Today I learned about making my first investment decision. The key takeaway was understanding risk vs reward...',
    date: '2024-02-10',
    mood: 'excited',
    tags: ['investing', 'first-time', 'learning'],
    isPrivate: false,
    linkedLesson: 'Introduction to Investing',
  },
  {
    id: '2',
    title: 'Budget Reflection - Week 1',
    content: 'Tracking my spending this week was eye-opening. I realized I spend way more on subscriptions than I thought...',
    date: '2024-02-08',
    mood: 'thoughtful',
    tags: ['budgeting', 'reflection', 'spending'],
    isPrivate: true,
    linkedLesson: 'Building Your First Budget',
  },
  {
    id: '3',
    title: 'Goal Setting Session',
    content: 'Set my financial goals for the year: 1) Save $500 by summer, 2) Learn about stocks, 3) Help with family budget...',
    date: '2024-02-05',
    mood: 'motivated',
    tags: ['goals', 'planning', 'savings'],
    isPrivate: false,
    linkedLesson: null,
  },
];

const moodOptions = [
  { value: 'excited', label: 'Excited', emoji: '🎉', color: 'bg-yellow-100 text-yellow-600' },
  { value: 'motivated', label: 'Motivated', emoji: '💪', color: 'bg-green-100 text-green-600' },
  { value: 'thoughtful', label: 'Thoughtful', emoji: '🤔', color: 'bg-blue-100 text-blue-600' },
  { value: 'confused', label: 'Confused', emoji: '😕', color: 'bg-purple-100 text-purple-600' },
  { value: 'proud', label: 'Proud', emoji: '🏆', color: 'bg-orange-100 text-orange-600' },
];

const promptSuggestions = [
  'What did I learn today about money?',
  'How do I feel about my financial progress?',
  'What financial goal am I working toward?',
  'What money habit do I want to build?',
  'How can I help my family with finances?',
];

export default function JournalPage() {
  const [isWriting, setIsWriting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: '',
    tags: '',
    isPrivate: false,
  });

  const filteredEntries = journalEntries.filter(
    entry => entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getMoodInfo = (mood: string) => moodOptions.find(m => m.value === mood);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Journal</h1>
          <p className="text-muted-foreground">Reflect on your financial learning journey</p>
        </div>
        <Button onClick={() => setIsWriting(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500">
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{journalEntries.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">50</p>
              <p className="text-sm text-muted-foreground">XP from Journaling</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Goals Tracked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Entry Form */}
      {isWriting && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
            <CardDescription>Write about your financial learning today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Entry title..."
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
            />

            {/* Prompt Suggestions */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Try:
              </span>
              {promptSuggestions.slice(0, 3).map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEntry({ ...newEntry, content: prompt + '\n\n' })}
                >
                  {prompt}
                </Button>
              ))}
            </div>

            <Textarea
              placeholder="Write your thoughts..."
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              rows={6}
            />

            {/* Mood Selection */}
            <div>
              <p className="text-sm font-medium mb-2">How are you feeling?</p>
              <div className="flex flex-wrap gap-2">
                {moodOptions.map((mood) => (
                  <Button
                    key={mood.value}
                    variant={newEntry.mood === mood.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewEntry({ ...newEntry, mood: mood.value })}
                  >
                    {mood.emoji} {mood.label}
                  </Button>
                ))}
              </div>
            </div>

            <Input
              placeholder="Tags (comma separated)"
              value={newEntry.tags}
              onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
            />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewEntry({ ...newEntry, isPrivate: !newEntry.isPrivate })}
              >
                {newEntry.isPrivate ? <Lock className="h-4 w-4 mr-1" /> : <Unlock className="h-4 w-4 mr-1" />}
                {newEntry.isPrivate ? 'Private' : 'Visible to Mentors'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsWriting(false)} variant="outline">Cancel</Button>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
                Save Entry (+10 XP)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => {
          const moodInfo = getMoodInfo(entry.mood);
          return (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{entry.title}</h3>
                      {entry.isPrivate && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">{entry.content}</p>

                    <div className="flex flex-wrap items-center gap-2">
                      {moodInfo && (
                        <Badge className={moodInfo.color}>
                          {moodInfo.emoji} {moodInfo.label}
                        </Badge>
                      )}
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {entry.linkedLesson && (
                        <Badge variant="secondary">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {entry.linkedLesson}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No entries found</h3>
          <p className="text-muted-foreground mb-4">Start documenting your financial learning journey</p>
          <Button onClick={() => setIsWriting(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Write Your First Entry
          </Button>
        </Card>
      )}
    </div>
  );
}
