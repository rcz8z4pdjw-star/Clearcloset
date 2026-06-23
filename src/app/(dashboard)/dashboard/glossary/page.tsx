'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BookOpen, Search, Star, BookmarkPlus, Volume2, ChevronRight, Filter
} from 'lucide-react';

const glossaryTerms = [
  {
    id: '1',
    term: 'Asset',
    definition: 'Something of value that you own, like money, property, or investments.',
    example: 'A savings account is an asset because it holds money that belongs to you.',
    category: 'Basics',
    difficulty: 'Beginner',
    relatedTerms: ['Liability', 'Net Worth'],
    saved: true,
  },
  {
    id: '2',
    term: 'Budget',
    definition: 'A plan for how you will spend and save your money over a period of time.',
    example: 'Making a budget helps you make sure you have enough money for things you need.',
    category: 'Budgeting',
    difficulty: 'Beginner',
    relatedTerms: ['Income', 'Expenses', 'Savings'],
    saved: false,
  },
  {
    id: '3',
    term: 'Compound Interest',
    definition: 'Interest calculated on both the initial amount and the accumulated interest from previous periods.',
    example: 'If you have $100 earning 10% compound interest, after year 1 you have $110, and after year 2 you have $121.',
    category: 'Saving',
    difficulty: 'Intermediate',
    relatedTerms: ['Interest', 'Principal', 'APY'],
    saved: true,
  },
  {
    id: '4',
    term: 'Diversification',
    definition: 'Spreading investments across different types of assets to reduce risk.',
    example: 'Instead of putting all your money in one stock, you buy stocks, bonds, and real estate.',
    category: 'Investing',
    difficulty: 'Intermediate',
    relatedTerms: ['Portfolio', 'Risk', 'Asset Allocation'],
    saved: false,
  },
  {
    id: '5',
    term: 'ETF (Exchange-Traded Fund)',
    definition: 'A type of investment fund that holds many different stocks or bonds and trades on an exchange like a stock.',
    example: 'An S&P 500 ETF lets you invest in 500 of the largest US companies with one purchase.',
    category: 'Investing',
    difficulty: 'Intermediate',
    relatedTerms: ['Mutual Fund', 'Index Fund', 'Stock'],
    saved: false,
  },
  {
    id: '6',
    term: 'Liability',
    definition: 'Money that you owe to someone else, like a loan or credit card debt.',
    example: 'A car loan is a liability because you owe money to the bank.',
    category: 'Basics',
    difficulty: 'Beginner',
    relatedTerms: ['Asset', 'Debt', 'Net Worth'],
    saved: false,
  },
  {
    id: '7',
    term: 'Net Worth',
    definition: 'The total value of what you own minus what you owe.',
    example: 'If you have $10,000 in savings and owe $3,000 on a loan, your net worth is $7,000.',
    category: 'Basics',
    difficulty: 'Beginner',
    relatedTerms: ['Asset', 'Liability'],
    saved: false,
  },
  {
    id: '8',
    term: 'Portfolio',
    definition: 'A collection of all your investments, including stocks, bonds, and other assets.',
    example: 'Your portfolio might include 60% stocks, 30% bonds, and 10% cash.',
    category: 'Investing',
    difficulty: 'Beginner',
    relatedTerms: ['Diversification', 'Asset Allocation'],
    saved: true,
  },
  {
    id: '9',
    term: 'Risk Tolerance',
    definition: 'How much uncertainty in investment returns you are comfortable with.',
    example: 'Someone with high risk tolerance might invest mostly in stocks, while someone with low risk tolerance might prefer bonds.',
    category: 'Investing',
    difficulty: 'Intermediate',
    relatedTerms: ['Risk', 'Volatility', 'Investment Strategy'],
    saved: false,
  },
  {
    id: '10',
    term: 'Stock',
    definition: 'A share of ownership in a company. When you buy stock, you own a small piece of that company.',
    example: 'If you buy Apple stock, you own a tiny percentage of Apple Inc.',
    category: 'Investing',
    difficulty: 'Beginner',
    relatedTerms: ['Dividend', 'Market Cap', 'Portfolio'],
    saved: false,
  },
];

const categories = ['All', 'Basics', 'Budgeting', 'Saving', 'Investing', 'Credit', 'Taxes'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);

  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || term.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'All' || term.difficulty === selectedDifficulty;
      const matchesLetter = !selectedLetter || term.term.toUpperCase().startsWith(selectedLetter);
      const matchesSaved = !savedOnly || term.saved;

      return matchesSearch && matchesCategory && matchesDifficulty && matchesLetter && matchesSaved;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedLetter, savedOnly]);

  // Group terms by first letter
  const groupedTerms = useMemo(() => {
    const groups: Record<string, typeof glossaryTerms> = {};
    filteredTerms.forEach(term => {
      const letter = term.term[0].toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(term);
    });
    return groups;
  }, [filteredTerms]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Glossary</h1>
          <p className="text-muted-foreground">Learn key financial terms and concepts</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg py-1 px-3">
            {glossaryTerms.length} Terms
          </Badge>
          <Button variant={savedOnly ? 'default' : 'outline'} onClick={() => setSavedOnly(!savedOnly)}>
            <Star className={`h-4 w-4 mr-2 ${savedOnly ? 'fill-current' : ''}`} />
            Saved
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {difficulties.map(diff => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Alphabet Navigation */}
      <div className="flex flex-wrap gap-1">
        <Button
          variant={selectedLetter === null ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedLetter(null)}
        >
          All
        </Button>
        {alphabet.map(letter => {
          const hasTerms = glossaryTerms.some(t => t.term.toUpperCase().startsWith(letter));
          return (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'default' : 'ghost'}
              size="sm"
              disabled={!hasTerms}
              onClick={() => setSelectedLetter(letter)}
              className="w-8 h-8 p-0"
            >
              {letter}
            </Button>
          );
        })}
      </div>

      {/* Terms List */}
      <div className="space-y-6">
        {Object.entries(groupedTerms).map(([letter, terms]) => (
          <div key={letter}>
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">{letter}</h2>
            <div className="space-y-3">
              {terms.map(term => (
                <Card
                  key={term.id}
                  className={`cursor-pointer transition-all ${
                    expandedTerm === term.id ? 'ring-2 ring-indigo-500' : ''
                  }`}
                  onClick={() => setExpandedTerm(expandedTerm === term.id ? null : term.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{term.term}</h3>
                          {term.saved && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{term.category}</Badge>
                          <Badge variant={
                            term.difficulty === 'Beginner' ? 'default' :
                            term.difficulty === 'Intermediate' ? 'secondary' : 'destructive'
                          }>
                            {term.difficulty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{term.definition}</p>

                        {expandedTerm === term.id && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Example:</p>
                              <p className="bg-muted/50 p-3 rounded-lg text-sm">{term.example}</p>
                            </div>

                            {term.relatedTerms.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Related Terms:</p>
                                <div className="flex flex-wrap gap-2">
                                  {term.relatedTerms.map(related => (
                                    <Badge
                                      key={related}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-muted"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery(related);
                                      }}
                                    >
                                      {related}
                                      <ChevronRight className="h-3 w-3 ml-1" />
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Volume2 className="h-4 w-4 mr-1" />
                                Listen
                              </Button>
                              <Button variant="outline" size="sm">
                                <BookmarkPlus className="h-4 w-4 mr-1" />
                                {term.saved ? 'Saved' : 'Save'}
                              </Button>
                              <Button variant="outline" size="sm">
                                <BookOpen className="h-4 w-4 mr-1" />
                                Learn More
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedTerm === term.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No terms found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </Card>
      )}
    </div>
  );
}
