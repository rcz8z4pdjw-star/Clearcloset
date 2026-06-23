'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Search,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Calendar,
  Tag,
  MoreVertical,
  Star,
  StarOff,
  Clock,
  Filter,
  SortAsc,
  Folder,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock notes data
const mockNotes = [
  {
    id: 'n1',
    title: 'Compound Interest Formula',
    content: 'A = P(1 + r/n)^(nt)\n\nWhere:\n- A = Final amount\n- P = Principal\n- r = Annual interest rate\n- n = Times compounded per year\n- t = Time in years\n\nKey insight: The more frequently interest compounds, the more you earn!',
    lessonId: 'lesson-1',
    lessonTitle: 'Understanding Compound Interest',
    tags: ['investing', 'formulas', 'important'],
    isFavorite: true,
    createdAt: '2024-02-18T10:30:00Z',
    updatedAt: '2024-02-18T10:30:00Z',
  },
  {
    id: 'n2',
    title: '50/30/20 Budget Rule',
    content: '- 50% for Needs (housing, food, utilities)\n- 30% for Wants (entertainment, dining)\n- 20% for Savings (emergency fund, investments)\n\nTip: Start with tracking expenses for a month to see where you stand.',
    lessonId: 'lesson-2',
    lessonTitle: 'Building Your First Budget',
    tags: ['budgeting', 'rules'],
    isFavorite: false,
    createdAt: '2024-02-17T14:20:00Z',
    updatedAt: '2024-02-17T14:20:00Z',
  },
  {
    id: 'n3',
    title: 'Types of Investment Accounts',
    content: '1. Brokerage Account - Flexible, taxable\n2. 401(k) - Employer-sponsored, tax-advantaged\n3. IRA - Individual, tax-advantaged\n4. Roth IRA - After-tax contributions, tax-free growth\n5. 529 Plan - Education savings',
    lessonId: 'lesson-3',
    lessonTitle: 'Investment Account Types',
    tags: ['investing', 'accounts'],
    isFavorite: true,
    createdAt: '2024-02-16T09:15:00Z',
    updatedAt: '2024-02-16T09:15:00Z',
  },
  {
    id: 'n4',
    title: 'Emergency Fund Goals',
    content: 'Target: 3-6 months of expenses\n\nSteps:\n1. Calculate monthly expenses\n2. Set initial goal of $1,000\n3. Build up to 3 months\n4. Eventually reach 6 months\n\nKeep in high-yield savings account for easy access.',
    lessonId: 'lesson-4',
    lessonTitle: 'Building an Emergency Fund',
    tags: ['saving', 'emergency-fund'],
    isFavorite: false,
    createdAt: '2024-02-15T16:45:00Z',
    updatedAt: '2024-02-15T16:45:00Z',
  },
];

const allTags = ['investing', 'budgeting', 'saving', 'formulas', 'rules', 'accounts', 'emergency-fund', 'important'];

export default function NotesPage() {
  const [notes, setNotes] = useState(mockNotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingNote, setEditingNote] = useState<typeof mockNotes[0] | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    const matchesFavorites = !showFavoritesOnly || note.isFavorite;

    return matchesSearch && matchesTag && matchesFavorites;
  });

  const handleToggleFavorite = (noteId: string) => {
    setNotes(notes.map((note) =>
      note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
    ));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter((note) => note.id !== noteId));
  };

  const handleCreateNote = () => {
    const note = {
      id: `n${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      lessonId: null,
      lessonTitle: 'General Notes',
      tags: newNote.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([note, ...notes]);
    setNewNote({ title: '', content: '', tags: '' });
    setIsCreateDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-indigo-500" />
            My Notes
          </h1>
          <p className="text-muted-foreground mt-1">
            Keep track of important concepts and insights
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
              <DialogDescription>
                Add a new note to your collection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Note title..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write your note..."
                  rows={6}
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="investing, important, formulas..."
                  value={newNote.tags}
                  onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateNote} disabled={!newNote.title || !newNote.content}>
                Create Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto text-indigo-500 mb-2" />
            <p className="text-2xl font-bold">{notes.length}</p>
            <p className="text-sm text-muted-foreground">Total Notes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{notes.filter(n => n.isFavorite).length}</p>
            <p className="text-sm text-muted-foreground">Favorites</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{new Set(notes.map(n => n.lessonId)).size}</p>
            <p className="text-sm text-muted-foreground">Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Tag className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{allTags.length}</p>
            <p className="text-sm text-muted-foreground">Tags Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedTag || 'all'} onValueChange={(v) => setSelectedTag(v === 'all' ? null : v)}>
            <SelectTrigger className="w-40">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No notes found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedTag
                ? 'Try adjusting your filters'
                : 'Start by creating your first note or taking notes during lessons'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-all group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{note.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <BookOpen className="h-3 w-3" />
                      {note.lessonTitle}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggleFavorite(note.id)}
                    >
                      {note.isFavorite ? (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingNote(note)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4 mb-3">
                  {note.content}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDate(note.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingNote.title}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  rows={8}
                  value={editingNote.content}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, content: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input
                  value={editingNote.tags.join(', ')}
                  onChange={(e) =>
                    setEditingNote({
                      ...editingNote,
                      tags: e.target.value.split(',').map((t) => t.trim()),
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingNote) {
                  setNotes(
                    notes.map((n) =>
                      n.id === editingNote.id
                        ? { ...editingNote, updatedAt: new Date().toISOString() }
                        : n
                    )
                  );
                  setEditingNote(null);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
