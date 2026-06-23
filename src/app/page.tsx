import Link from 'next/link';
import { ArrowRight, BookOpen, Users, TrendingUp, Shield, Heart, Target, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const challenges = [
  {
    title: 'Imposter Syndrome & Guilt',
    description: 'Address feelings of unworthiness and learn to embrace your role as a steward.',
    icon: Shield,
  },
  {
    title: 'Financial Literacy Gaps',
    description: 'Build foundational knowledge from basics to sophisticated investment strategies.',
    icon: BookOpen,
  },
  {
    title: 'Identity & Career Navigation',
    description: 'Find your authentic path while honoring family legacy and expectations.',
    icon: Target,
  },
  {
    title: 'Pressure to Maintain Wealth',
    description: 'Learn sustainable practices and develop confidence in decision-making.',
    icon: TrendingUp,
  },
  {
    title: 'Isolation & Peer Connection',
    description: 'Connect with others who share similar experiences in a safe, confidential environment.',
    icon: Users,
  },
  {
    title: 'Lifestyle & Spending Uncertainty',
    description: 'Develop values-based frameworks for conscious consumption and giving.',
    icon: Heart,
  },
];

const tracks = [
  {
    name: 'Junior Foundations',
    ages: '10-12',
    description: 'Building blocks of financial awareness, family values, and responsible stewardship.',
    highlights: ['Money basics', 'Family values exploration', 'Savings habits', 'Giving introduction'],
  },
  {
    name: 'Teen Skills',
    ages: '13-15',
    description: 'Developing practical skills and deeper understanding of wealth responsibility.',
    highlights: ['Budgeting fundamentals', 'Investment basics', 'Communication skills', 'Goal setting'],
  },
  {
    name: 'Launch',
    ages: '16-22',
    description: 'Preparing for independence with career planning, advanced finance, and governance.',
    highlights: ['Career exploration', 'Investment 101', 'Philanthropy basics', 'Family governance intro'],
  },
  {
    name: 'Stewardship Practicum',
    ages: '23-30',
    description: 'Hands-on experience with IC participation, portfolio management, and leadership.',
    highlights: ['IC practicum', 'Portfolio practice', 'Market analysis', 'Mentor-guided decisions'],
  },
  {
    name: 'Leadership',
    ages: '25-35',
    description: 'Advanced governance, philanthropic leadership, and family enterprise roles.',
    highlights: ['Board preparation', 'Giving strategy', 'Family governance', 'Next-gen leadership'],
  },
];

const resources = [
  {
    title: 'Understanding Your Family\'s Wealth',
    type: 'Guide',
    description: 'A comprehensive introduction to wealth stewardship, governance, and responsibility.',
  },
  {
    title: 'Investment 101: Basics to Sophisticated Strategies',
    type: 'Video Series',
    description: '8-module series covering everything from asset classes to manager selection.',
  },
  {
    title: 'Career or Family Business? Navigating Your Path',
    type: 'Workbook',
    description: 'Interactive exercises to help clarify your career direction and family role.',
  },
  {
    title: 'The Psychology of Inherited Wealth',
    type: 'Workshop',
    description: '90-minute deep dive into the emotional aspects of growing up with wealth.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-ascent-cream to-white py-20 md:py-32">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="gold" className="mb-4">
                Invite-Only Platform
              </Badge>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-ascent-navy mb-6 text-balance">
                Preparing Heirs to Be Wise Stewards
              </h1>
              <p className="text-xl text-ascent-slate mb-8 text-balance">
                A comprehensive education, mentorship, and stewardship practice platform
                designed for children of client families, ages 10-35.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="premium" asChild>
                  <Link href="/request-invite">
                    Request an Invite
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-10 left-10 w-72 h-72 bg-ascent-gold rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-ascent-navy rounded-full blur-3xl" />
          </div>
        </section>

        {/* Why Next Gen Education Matters */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-ascent-navy mb-4">
                Why Next Generation Education Matters
              </h2>
              <p className="text-lg text-ascent-slate">
                Wealth transition is about more than financial transfer—it's about preparing
                the next generation to be confident, capable stewards who can preserve and
                grow family legacy for generations to come.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 border-transparent hover:border-ascent-gold/20 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-ascent-navy" />
                  </div>
                  <CardTitle className="font-serif">Structured Learning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Age-appropriate curriculum that builds progressively from basic concepts
                    to sophisticated investment and governance knowledge.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-transparent hover:border-ascent-gold/20 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-ascent-navy" />
                  </div>
                  <CardTitle className="font-serif">Guided Mentorship</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    One-on-one relationships with experienced mentors who provide personalized
                    guidance and accountability throughout the journey.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-transparent hover:border-ascent-gold/20 transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-ascent-navy/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-ascent-navy" />
                  </div>
                  <CardTitle className="font-serif">Practical Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Safe environments to practice real-world skills, from portfolio management
                    to philanthropic decision-making and family governance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Challenges We Address */}
        <section className="py-20 bg-ascent-cream/50">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-ascent-navy mb-4">
                Common Challenges We Address
              </h2>
              <p className="text-lg text-ascent-slate">
                Growing up with wealth comes with unique challenges. Our platform provides
                targeted resources and support for each of these common experiences.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => {
                const Icon = challenge.icon;
                return (
                  <Card key={challenge.title} className="bg-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-ascent-gold/20 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-ascent-navy" />
                        </div>
                        <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Track Overview */}
        <section className="py-20 bg-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-ascent-navy mb-4">
                Age-Appropriate Learning Tracks
              </h2>
              <p className="text-lg text-ascent-slate">
                Our curriculum is carefully designed for each stage of development,
                ensuring content is engaging, relevant, and appropriately challenging.
              </p>
            </div>

            <div className="space-y-6">
              {tracks.map((track, index) => (
                <Card key={track.name} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 bg-ascent-navy/5 p-6 flex flex-col justify-center">
                      <Badge variant="gold" className="w-fit mb-2">
                        Ages {track.ages}
                      </Badge>
                      <h3 className="font-serif text-2xl font-bold text-ascent-navy">
                        {track.name}
                      </h3>
                    </div>
                    <div className="md:w-2/3 p-6">
                      <p className="text-muted-foreground mb-4">{track.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {track.highlights.map((highlight) => (
                          <Badge key={highlight} variant="outline">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sample Resources */}
        <section className="py-20 bg-ascent-navy text-white">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                Premium Educational Resources
              </h2>
              <p className="text-lg text-white/80">
                Our comprehensive library includes guides, video series, workbooks,
                and workshops designed by experts in wealth education.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {resources.map((resource) => (
                <Card key={resource.title} className="bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">
                      {resource.type}
                    </Badge>
                    <CardTitle className="text-white">{resource.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">{resource.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="gold" asChild>
                <Link href="/resources">
                  View Full Resource Library
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-ascent-cream">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-ascent-navy mb-4">
                Ready to Begin the Journey?
              </h2>
              <p className="text-lg text-ascent-slate mb-8">
                The Next Gen Platform is available exclusively to children of Ascent Capital
                Partners client families. Request an invitation to get started.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="premium" asChild>
                  <Link href="/request-invite">
                    Request an Invite
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">
                    Contact Our Team
                  </Link>
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Invite-only access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Secure & confidential</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Family-scoped privacy</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
