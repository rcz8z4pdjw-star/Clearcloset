import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, Search } from 'lucide-react';

async function getGlossaryData() {
  const terms = await prisma.glossaryTerm.findMany({
    where: { isPublished: true },
    orderBy: { term: 'asc' },
  });

  // Group by category
  const categories = terms.reduce((acc, term) => {
    const category = term.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(term);
    return acc;
  }, {} as Record<string, typeof terms>);

  // Also group by first letter
  const alphabetical = terms.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(term);
    return acc;
  }, {} as Record<string, typeof terms>);

  return { terms, categories, alphabetical };
}

function GlossarySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

export default async function GlossaryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <Suspense fallback={<GlossarySkeleton />}>
      <GlossaryContent />
    </Suspense>
  );
}

async function GlossaryContent() {
  const { terms, categories, alphabetical } = await getGlossaryData();

  const categoryNames = Object.keys(categories).sort();
  const letters = Object.keys(alphabetical).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-ascent-navy">Glossary</h1>
        <p className="text-muted-foreground mt-1">
          {terms.length} terms to help you understand wealth management concepts
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search terms..."
          className="pl-9"
        />
      </div>

      {/* Category Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
          All ({terms.length})
        </Badge>
        {categoryNames.map((category) => (
          <Badge
            key={category}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
          >
            {category} ({categories[category].length})
          </Badge>
        ))}
      </div>

      {/* Alphabetical Index */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Jump to Letter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 flex items-center justify-center rounded border text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms by Letter */}
      <div className="space-y-8">
        {letters.map((letter) => (
          <div key={letter} id={`letter-${letter}`}>
            <h2 className="text-2xl font-bold text-ascent-navy mb-4 sticky top-0 bg-background py-2">
              {letter}
            </h2>
            <Accordion type="multiple" className="space-y-2">
              {alphabetical[letter].map((term) => (
                <AccordionItem
                  key={term.id}
                  value={term.id}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium">{term.term}</span>
                      {term.category && (
                        <Badge variant="secondary" className="text-xs">
                          {term.category}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {term.definition}
                      </p>
                      {term.relatedTerms && term.relatedTerms.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium mb-2">Related Terms:</p>
                          <div className="flex flex-wrap gap-2">
                            {term.relatedTerms.map((related) => (
                              <Badge key={related} variant="outline">
                                {related}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {terms.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No glossary terms available yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
