'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Shuffle,
  Play,
  Pause,
  Clock,
  Target,
  Sparkles,
  Brain,
  Lightbulb,
  Plus,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock flashcard decks
const flashcardDecks = [
  {
    id: 'd1',
    name: 'Financial Terms',
    description: 'Essential financial vocabulary',
    cardCount: 25,
    mastered: 12,
    category: 'basics',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'd2',
    name: 'Investing Concepts',
    description: 'Key investing terminology',
    cardCount: 30,
    mastered: 8,
    category: 'investing',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'd3',
    name: 'Budgeting Basics',
    description: 'Budgeting terms and methods',
    cardCount: 20,
    mastered: 15,
    category: 'budgeting',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'd4',
    name: 'Credit & Loans',
    description: 'Understanding credit and borrowing',
    cardCount: 18,
    mastered: 5,
    category: 'credit',
    color: 'from-orange-500 to-red-500',
  },
];

// Mock flashcards for a deck
const mockCards = [
  {
    id: 'c1',
    front: 'What is Compound Interest?',
    back: 'Interest calculated on the initial principal and also on the accumulated interest from previous periods. It allows your money to grow faster over time.',
    hint: 'Think about interest earning interest...',
    mastered: false,
  },
  {
    id: 'c2',
    front: 'What is an ETF?',
    back: 'Exchange-Traded Fund - A type of investment fund that trades on stock exchanges, similar to stocks. ETFs hold assets like stocks, bonds, or commodities.',
    hint: 'It combines features of mutual funds and stocks...',
    mastered: true,
  },
  {
    id: 'c3',
    front: 'What is Diversification?',
    back: 'Spreading investments across different assets, sectors, or geographic regions to reduce risk. "Don\'t put all your eggs in one basket."',
    hint: 'Related to reducing risk...',
    mastered: false,
  },
  {
    id: 'c4',
    front: 'What is APR?',
    back: 'Annual Percentage Rate - The yearly interest rate charged for borrowing or earned through investing, including fees and costs.',
    hint: 'Annual percentage...',
    mastered: false,
  },
  {
    id: 'c5',
    front: 'What is Net Worth?',
    back: 'Total assets minus total liabilities. It represents what you own minus what you owe.',
    hint: 'Assets minus liabilities...',
    mastered: true,
  },
];

export default function FlashcardsPage() {
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [cards, setCards] = useState(mockCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [studyMode, setStudyMode] = useState<'all' | 'unmastered'>('all');
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [isStudying, setIsStudying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const filteredCards = studyMode === 'unmastered'
    ? cards.filter(c => !c.mastered)
    : cards;

  const currentCard = filteredCards[currentIndex];
  const progress = ((currentIndex + 1) / filteredCards.length) * 100;

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnew = () => {
    setSessionStats(prev => ({ ...prev, correct: prev.correct + 1 }));
    setCards(cards.map(c =>
      c.id === currentCard.id ? { ...c, mastered: true } : c
    ));
    handleNext();
  };

  const handleDidntKnow = () => {
    setSessionStats(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
    handleNext();
  };

  const handleShuffle = () => {
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  const startStudySession = (deckId: string) => {
    setSelectedDeck(deckId);
    setIsStudying(true);
    setCurrentIndex(0);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  if (!isStudying) {
    return (
      <div className="space-y-8 p-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Brain className="h-8 w-8 text-indigo-500" />
              Flashcards
            </h1>
            <p className="text-muted-foreground mt-1">
              Master financial concepts with spaced repetition
            </p>
          </div>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
            <Plus className="h-4 w-4 mr-2" />
            Create Deck
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-700">
                {flashcardDecks.reduce((sum, d) => sum + d.cardCount, 0)}
              </p>
              <p className="text-xs text-blue-600">Total Cards</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4 text-center">
              <Check className="h-6 w-6 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-700">
                {flashcardDecks.reduce((sum, d) => sum + d.mastered, 0)}
              </p>
              <p className="text-xs text-green-600">Mastered</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto text-purple-500 mb-2" />
              <p className="text-2xl font-bold text-purple-700">{flashcardDecks.length}</p>
              <p className="text-xs text-purple-600">Decks</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-yellow-700">5</p>
              <p className="text-xs text-yellow-600">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Decks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flashcardDecks.map((deck) => {
            const masteryPercent = Math.round((deck.mastered / deck.cardCount) * 100);
            return (
              <Card
                key={deck.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => startStudySession(deck.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-xl bg-gradient-to-br ${deck.color}`}>
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-indigo-600 transition-colors">
                        {deck.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{deck.description}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{deck.mastered}/{deck.cardCount} mastered</span>
                          <span className="font-medium">{masteryPercent}%</span>
                        </div>
                        <Progress value={masteryPercent} className="h-2" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Badge variant="secondary">{deck.cardCount} cards</Badge>
                    <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4 mr-1" />
                      Study Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Study */}
        <Card className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Ready to Study?</h3>
                <p className="text-white/80 mt-1">
                  Practice makes perfect. Start a quick study session now!
                </p>
              </div>
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-white/90"
                onClick={() => startStudySession('d1')}
              >
                <Shuffle className="h-5 w-5 mr-2" />
                Random Deck
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Study Mode
  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setIsStudying(false)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Decks
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Select value={studyMode} onValueChange={(v: any) => { setStudyMode(v); setCurrentIndex(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cards</SelectItem>
                <SelectItem value="unmastered">Unmastered Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Card {currentIndex + 1} of {filteredCards.length}</span>
            <div className="flex items-center gap-4">
              <span className="text-green-600">✓ {sessionStats.correct}</span>
              <span className="text-red-600">✗ {sessionStats.incorrect}</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Flashcard */}
      {currentCard ? (
        <div className="max-w-2xl mx-auto">
          <div
            className="relative h-80 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front */}
              <Card className={`absolute inset-0 backface-hidden ${isFlipped ? 'invisible' : ''}`}>
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <Badge variant="secondary" className="mb-4">Question</Badge>
                  <p className="text-2xl font-semibold">{currentCard.front}</p>
                  {currentCard.mastered && (
                    <Badge className="mt-4 bg-green-100 text-green-700">
                      <Check className="h-3 w-3 mr-1" />
                      Mastered
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-6">Click to flip</p>
                </CardContent>
              </Card>

              {/* Back */}
              <Card className={`absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-indigo-50 to-purple-50 ${!isFlipped ? 'invisible' : ''}`}>
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <Badge className="mb-4 bg-indigo-100 text-indigo-700">Answer</Badge>
                  <p className="text-lg">{currentCard.back}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hint */}
          {!isFlipped && (
            <div className="mt-4 text-center">
              {showHint ? (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center gap-2 text-yellow-700">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-sm">{currentCard.hint}</span>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setShowHint(true)}>
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Show Hint
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {isFlipped && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleDidntKnow}
                >
                  <X className="h-5 w-5 mr-1" />
                  Didn&apos;t Know
                </Button>
                <Button
                  size="lg"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={handleKnew}
                >
                  <Check className="h-5 w-5 mr-1" />
                  Got It!
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={handleNext}
              disabled={currentIndex === filteredCards.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="ghost" size="sm" onClick={handleShuffle}>
              <Shuffle className="h-4 w-4 mr-1" />
              Shuffle
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Restart
            </Button>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Session Complete!</h3>
            <p className="text-muted-foreground mb-6">
              You&apos;ve reviewed all {studyMode === 'unmastered' ? 'unmastered ' : ''}cards in this deck
            </p>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{sessionStats.correct}</p>
                <p className="text-sm text-muted-foreground">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{sessionStats.incorrect}</p>
                <p className="text-sm text-muted-foreground">Need Review</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => setIsStudying(false)}>
                Back to Decks
              </Button>
              <Button onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Study Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
