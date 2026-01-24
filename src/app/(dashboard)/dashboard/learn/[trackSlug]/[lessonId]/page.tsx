'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Star,
  Bookmark,
  BookmarkCheck,
  FileText,
  MessageCircle,
  Share2,
  ThumbsUp,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  List,
  X,
  Sparkles,
  Trophy,
  Target,
  Brain,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Mock lesson data
const mockLesson = {
  id: 'lesson-1',
  title: 'Understanding Compound Interest',
  description: 'Learn how compound interest works and how it can help grow your savings over time.',
  type: 'video', // 'video', 'article', 'interactive'
  videoUrl: 'https://example.com/video.mp4',
  duration: 15, // minutes
  track: {
    id: 'track-1',
    name: 'Investing Basics',
    slug: 'investing-basics',
  },
  module: {
    id: 'module-1',
    name: 'The Power of Compounding',
  },
  xpReward: 50,
  content: `
## What is Compound Interest?

Compound interest is one of the most powerful concepts in finance. It's often called the "eighth wonder of the world" because of its ability to grow wealth exponentially over time.

### The Basic Concept

When you earn compound interest, you earn interest not just on your initial investment (the principal), but also on the interest you've already earned. This creates a snowball effect where your money grows faster and faster over time.

### The Formula

The compound interest formula is:

**A = P(1 + r/n)^(nt)**

Where:
- A = Final amount
- P = Principal (initial investment)
- r = Annual interest rate (as a decimal)
- n = Number of times interest compounds per year
- t = Time in years

### Example

Let's say you invest $1,000 at 7% annual interest, compounded monthly, for 10 years:

- P = $1,000
- r = 0.07
- n = 12
- t = 10

A = 1000(1 + 0.07/12)^(12 × 10)
A = 1000(1.00583)^120
A = **$2,009.66**

Your money has more than doubled!

### Key Takeaways

1. **Start early**: The earlier you start, the more time your money has to grow
2. **Be consistent**: Regular contributions amplify the effect
3. **Be patient**: The real magic happens over longer time periods
4. **Reinvest earnings**: Don't withdraw your interest - let it compound

### The Rule of 72

A quick way to estimate how long it takes to double your money:

**Years to double = 72 / Interest Rate**

At 7% interest: 72 / 7 = ~10 years to double
  `,
  keyPoints: [
    'Compound interest earns interest on interest',
    'Time is your greatest ally in building wealth',
    'Start early, even with small amounts',
    'The Rule of 72 helps estimate doubling time',
  ],
  vocabulary: [
    { term: 'Principal', definition: 'The initial amount of money invested or borrowed' },
    { term: 'Compound Interest', definition: 'Interest calculated on both the initial principal and accumulated interest' },
    { term: 'APY', definition: 'Annual Percentage Yield - the effective annual rate of return' },
  ],
  nextLesson: {
    id: 'lesson-2',
    title: 'Simple vs Compound Interest',
  },
  prevLesson: null,
  quiz: {
    id: 'quiz-1',
    title: 'Compound Interest Quiz',
    questionCount: 5,
  },
  completed: false,
  bookmarked: false,
};

// Mock module lessons for sidebar
const moduleLessons = [
  { id: 'lesson-1', title: 'Understanding Compound Interest', completed: false, current: true },
  { id: 'lesson-2', title: 'Simple vs Compound Interest', completed: false, current: false },
  { id: 'lesson-3', title: 'The Time Value of Money', completed: false, current: false },
  { id: 'lesson-4', title: 'Calculating Future Value', completed: false, current: false },
  { id: 'lesson-5', title: 'Practical Applications', completed: false, current: false },
];

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState(mockLesson);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Simulate reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(scrollPercent, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMarkComplete = async () => {
    // In production: Call API to mark lesson complete
    setLesson({ ...lesson, completed: true });
    // Show celebration or navigate to next
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // In production: Call API to toggle bookmark
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/learn/${lesson.track.slug}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Track
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="hidden md:block">
              <p className="text-sm text-muted-foreground">{lesson.track.name}</p>
              <p className="text-xs text-muted-foreground">{lesson.module.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleBookmark}>
                    {isBookmarked ? (
                      <BookmarkCheck className="h-5 w-5 text-indigo-500" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isBookmarked ? 'Remove Bookmark' : 'Bookmark Lesson'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button variant="ghost" size="icon" onClick={() => setShowNotes(!showNotes)}>
              <FileText className="h-5 w-5" />
            </Button>

            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <List className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Module Lessons</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  <div className="space-y-2">
                    {moduleLessons.map((l, index) => (
                      <div
                        key={l.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          l.current
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          l.completed
                            ? 'bg-green-100 text-green-700'
                            : l.current
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {l.completed ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className={`text-sm ${l.current ? 'font-medium' : ''}`}>
                          {l.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Lesson Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">
            <BookOpen className="h-3 w-3 mr-1" />
            {lesson.module.name}
          </Badge>
          <h1 className="text-3xl font-bold mb-3">{lesson.title}</h1>
          <p className="text-muted-foreground mb-4">{lesson.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {lesson.duration} min read
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              +{lesson.xpReward} XP
            </span>
            {lesson.quiz && (
              <Badge variant="outline">
                <Brain className="h-3 w-3 mr-1" />
                Quiz Available
              </Badge>
            )}
          </div>
        </div>

        {/* Video Player (if video lesson) */}
        {lesson.type === 'video' && (
          <Card className="mb-8 overflow-hidden">
            <div className="relative aspect-video bg-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
              </div>
              {/* Video controls would go here */}
            </div>
          </Card>
        )}

        {/* Content */}
        <Card className="mb-8">
          <CardContent className="p-8 prose prose-indigo max-w-none">
            <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
          </CardContent>
        </Card>

        {/* Key Points */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {lesson.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Vocabulary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Vocabulary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lesson.vocabulary.map((item, index) => (
                <div key={index} className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-semibold text-blue-700">{item.term}</p>
                  <p className="text-sm text-blue-600 mt-1">{item.definition}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quiz CTA */}
        {lesson.quiz && (
          <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Ready to Test Your Knowledge?</h3>
                  <p className="text-indigo-100">
                    Take the quiz to earn XP and solidify your understanding.
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90"
                  asChild
                >
                  <Link href={`/dashboard/quiz/${lesson.quiz.id}`}>
                    <Trophy className="h-5 w-5 mr-2" />
                    Take Quiz
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion / Navigation */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {lesson.prevLesson ? (
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/learn/${lesson.track.slug}/${lesson.prevLesson.id}`}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous Lesson
                  </Link>
                </Button>
              ) : (
                <div />
              )}

              {!lesson.completed ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                  onClick={handleMarkComplete}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Mark as Complete
                </Button>
              ) : (
                <Badge className="bg-green-100 text-green-700 text-sm py-2 px-4">
                  <Check className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              )}

              {lesson.nextLesson ? (
                <Button asChild>
                  <Link href={`/dashboard/learn/${lesson.track.slug}/${lesson.nextLesson.id}`}>
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <div />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Sidebar */}
      {showNotes && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l shadow-lg z-50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">My Notes</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowNotes(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <textarea
            className="w-full h-[calc(100%-100px)] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Take notes while you learn..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <Button className="w-full mt-4">Save Notes</Button>
        </div>
      )}
    </div>
  );
}
