'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  Search,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  Star,
  Users,
  Trophy,
  CreditCard,
  Shield,
  Settings,
  Sparkles,
  Play,
  FileText,
  Phone,
} from 'lucide-react';

// FAQ categories and questions
const faqCategories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Lightbulb,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    questions: [
      {
        question: 'How do I get started with Ascent?',
        answer: 'Welcome to Ascent! Start by completing your profile setup and taking the initial assessment. This helps us personalize your learning journey based on your age and interests. Then, explore the learning tracks recommended for you and start with any lesson that catches your interest!',
      },
      {
        question: 'What age groups is Ascent designed for?',
        answer: 'Ascent is designed for learners ages 10-35, divided into five age bands: Junior Foundations (10-12), Teen Skills (13-15), Launch (16-22), Stewardship Practicum (23-30), and Leadership (25-35). Content is tailored to be age-appropriate and relevant to each group.',
      },
      {
        question: 'How do I set up my profile?',
        answer: 'Go to Settings > Profile to set up your profile. You can add a photo, customize your avatar, set your nickname, and share a bit about yourself. Your profile helps other learners and mentors connect with you.',
      },
    ],
  },
  {
    id: 'learning',
    name: 'Learning & Lessons',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    questions: [
      {
        question: 'How do learning tracks work?',
        answer: 'Learning tracks are structured pathways covering specific financial topics like budgeting, investing, or saving. Each track contains multiple lessons and quizzes. Complete all lessons and pass the quizzes to earn a certificate and unlock the next track!',
      },
      {
        question: 'Can I skip lessons or take them out of order?',
        answer: 'Within a track, some lessons may have prerequisites, but you can often explore content in the order that interests you most. We recommend following the suggested order for the best learning experience.',
      },
      {
        question: 'How do quizzes work?',
        answer: 'Quizzes test your understanding of lesson content. You can retake quizzes to improve your score. Scoring 80% or higher earns you XP and contributes to your track progress. Perfect scores earn bonus XP!',
      },
    ],
  },
  {
    id: 'gamification',
    name: 'XP, Levels & Rewards',
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    questions: [
      {
        question: 'How do I earn XP?',
        answer: 'You earn XP by completing lessons, passing quizzes, maintaining streaks, earning badges, completing daily challenges, and participating in family challenges. The more you learn, the more XP you earn!',
      },
      {
        question: 'What are streaks and how do they work?',
        answer: 'A streak is the number of consecutive days you complete at least one learning activity. Maintaining streaks earns bonus XP at milestones (7 days, 30 days, etc.). If you miss a day, your streak resets to zero.',
      },
      {
        question: 'What can I do with my XP?',
        answer: 'XP contributes to your level progression and can be spent in the Rewards Shop on avatar items, profile customizations, and special perks. Higher levels also unlock exclusive content and features!',
      },
      {
        question: 'How do badges work?',
        answer: 'Badges are earned for specific achievements like completing tracks, maintaining streaks, or helping others. They come in different rarities: Common, Uncommon, Rare, Epic, and Legendary. Showcase your favorite badges on your profile!',
      },
    ],
  },
  {
    id: 'social',
    name: 'Family & Social',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    questions: [
      {
        question: 'How do family connections work?',
        answer: 'Family connections allow you to link with parents, siblings, and other family members on Ascent. Connected family members can participate in family challenges together, see each other\'s progress, and celebrate achievements.',
      },
      {
        question: 'What are family challenges?',
        answer: 'Family challenges are group goals that family members work toward together. When everyone contributes, the whole family earns bonus rewards. It\'s a great way to learn together!',
      },
      {
        question: 'Can parents monitor my progress?',
        answer: 'Parents with linked accounts can view your learning progress, time spent, and achievements. They can set time limits and content preferences. This is designed to help families learn together safely.',
      },
    ],
  },
  {
    id: 'account',
    name: 'Account & Privacy',
    icon: Shield,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    questions: [
      {
        question: 'How do I change my password?',
        answer: 'Go to Settings > Security to change your password. You\'ll need to enter your current password and then create a new one. We recommend using a strong, unique password.',
      },
      {
        question: 'Is my data safe?',
        answer: 'Yes! We take privacy seriously. Your personal information is encrypted and never shared with third parties. Family members only see what you choose to share. Review our Privacy Policy for full details.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'If you need to delete your account, contact support. Note that this action is permanent and will remove all your progress, badges, and data. We\'re sad to see you go but respect your choice.',
      },
    ],
  },
];

const helpResources = [
  {
    id: 'tutorials',
    title: 'Video Tutorials',
    description: 'Watch step-by-step guides',
    icon: Video,
    color: 'from-red-500 to-pink-500',
    count: '12 videos',
  },
  {
    id: 'guides',
    title: 'User Guides',
    description: 'Detailed documentation',
    icon: FileText,
    color: 'from-blue-500 to-indigo-500',
    count: '8 guides',
  },
  {
    id: 'community',
    title: 'Community Forum',
    description: 'Get help from other learners',
    icon: Users,
    color: 'from-green-500 to-emerald-500',
    count: 'Active community',
  },
];

const contactOptions = [
  {
    id: 'chat',
    title: 'Live Chat',
    description: 'Chat with our support team',
    icon: MessageCircle,
    availability: 'Mon-Fri, 9am-6pm EST',
    action: 'Start Chat',
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Send us an email',
    icon: Mail,
    availability: 'Response within 24 hours',
    action: 'Send Email',
  },
  {
    id: 'phone',
    title: 'Phone Support',
    description: 'Talk to a human',
    icon: Phone,
    availability: 'Mon-Fri, 9am-5pm EST',
    action: 'Call Now',
  },
];

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter FAQs based on search
  const filteredCategories = faqCategories.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.questions.length > 0);

  const displayCategories = selectedCategory
    ? filteredCategories.filter((c) => c.id === selectedCategory)
    : filteredCategories;

  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <HelpCircle className="h-10 w-10 text-blue-500" />
          Help Center
        </h1>
        <p className="text-muted-foreground">
          Find answers, tutorials, and support resources
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              className="pl-12 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {helpResources.map((resource) => {
          const Icon = resource.icon;
          return (
            <Card
              key={resource.id}
              className="cursor-pointer hover:shadow-lg transition-all group"
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${resource.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg">{resource.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                <Badge variant="secondary">{resource.count}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Support</TabsTrigger>
          <TabsTrigger value="glossary">Glossary</TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="mt-6 space-y-6">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Topics
            </Button>
            {faqCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center gap-1"
                >
                  <Icon className="h-4 w-4" />
                  {cat.name}
                </Button>
              );
            })}
          </div>

          {/* FAQ Accordion */}
          {displayCategories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try a different search term or browse categories
                </p>
              </CardContent>
            </Card>
          ) : (
            displayCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <Icon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`${category.id}-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>
                Choose your preferred way to contact our support team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{option.availability}</p>
                      </div>
                    </div>
                    <Button>{option.action}</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Sparkles className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Can&apos;t Find What You Need?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Our support team is here to help! Send us a detailed message and we&apos;ll get back to you as soon as possible.
                  </p>
                  <Button>
                    <Mail className="h-4 w-4 mr-2" />
                    Submit a Request
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glossary" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms Glossary</CardTitle>
              <CardDescription>
                Learn the meaning of common financial terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { term: 'APR (Annual Percentage Rate)', definition: 'The yearly interest rate charged for borrowing money, including fees.' },
                { term: 'Budget', definition: 'A plan for how to spend and save your money over a period of time.' },
                { term: 'Compound Interest', definition: 'Interest calculated on both the initial principal and accumulated interest from previous periods.' },
                { term: 'Credit Score', definition: 'A number that represents your creditworthiness, based on your credit history.' },
                { term: 'Diversification', definition: 'Spreading investments across different assets to reduce risk.' },
                { term: 'Emergency Fund', definition: 'Money set aside for unexpected expenses, typically 3-6 months of living expenses.' },
                { term: 'ETF (Exchange-Traded Fund)', definition: 'A type of investment fund that trades on stock exchanges, like stocks.' },
                { term: 'Index Fund', definition: 'A mutual fund designed to match the performance of a market index.' },
                { term: 'Inflation', definition: 'The rate at which the general level of prices increases over time.' },
                { term: 'Net Worth', definition: 'Total assets minus total liabilities - what you own minus what you owe.' },
              ].map((item) => (
                <div key={item.term} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-indigo-600">{item.term}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.definition}</p>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View Full Glossary
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
