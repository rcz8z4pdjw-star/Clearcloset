'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Medal,
  GraduationCap,
  Bookmark,
  Trophy,
  Target,
} from 'lucide-react';

// Mock certificates data
const certificates = [
  {
    id: 'c1',
    title: 'Financial Foundations',
    type: 'track_completion',
    description: 'Successfully completed the Financial Foundations learning track',
    issuedAt: '2024-01-20',
    completionScore: 92,
    totalLessons: 12,
    totalQuizzes: 4,
    totalHours: 8,
    skills: ['Budgeting', 'Saving', 'Financial Planning'],
    badgeEarned: 'Financial Foundations Graduate',
    status: 'earned',
    downloadUrl: '#',
    shareUrl: '#',
  },
  {
    id: 'c2',
    title: 'Budgeting Basics',
    type: 'track_completion',
    description: 'Successfully completed the Budgeting Basics learning track',
    issuedAt: '2024-02-05',
    completionScore: 88,
    totalLessons: 8,
    totalQuizzes: 3,
    totalHours: 5,
    skills: ['Budget Creation', 'Expense Tracking', 'Financial Goals'],
    badgeEarned: 'Budget Master',
    status: 'earned',
    downloadUrl: '#',
    shareUrl: '#',
  },
  {
    id: 'c3',
    title: 'Investment Fundamentals',
    type: 'track_completion',
    description: 'Complete the Investment Fundamentals track to earn this certificate',
    issuedAt: null,
    completionScore: null,
    totalLessons: 10,
    totalQuizzes: 4,
    totalHours: 7,
    skills: ['Stock Basics', 'Portfolio Building', 'Risk Management'],
    badgeEarned: 'Young Investor',
    status: 'in_progress',
    progress: 65,
    downloadUrl: null,
    shareUrl: null,
  },
  {
    id: 'c4',
    title: 'Perfect Score Achievement',
    type: 'achievement',
    description: 'Achieved perfect scores on 5 consecutive quizzes',
    issuedAt: '2024-01-25',
    completionScore: 100,
    achievement: 'Quiz Master',
    status: 'earned',
    downloadUrl: '#',
    shareUrl: '#',
  },
  {
    id: 'c5',
    title: '30-Day Learning Streak',
    type: 'achievement',
    description: 'Maintained a 30-day consecutive learning streak',
    issuedAt: '2024-02-10',
    streakDays: 30,
    achievement: 'Dedicated Learner',
    status: 'earned',
    downloadUrl: '#',
    shareUrl: '#',
  },
];

const availableCertificates = [
  {
    id: 'ac1',
    title: 'Advanced Investing',
    description: 'Master advanced investing strategies and portfolio management',
    requirements: ['Complete 10 lessons', 'Pass 4 quizzes with 80%+', 'Submit final project'],
    estimatedHours: 12,
    skills: ['Advanced Analysis', 'Diversification', 'Market Timing'],
    difficulty: 'Advanced',
  },
  {
    id: 'ac2',
    title: 'Entrepreneurship Basics',
    description: 'Learn the fundamentals of starting and running a business',
    requirements: ['Complete 8 lessons', 'Pass 3 quizzes', 'Create business plan'],
    estimatedHours: 8,
    skills: ['Business Planning', 'Market Research', 'Financial Projections'],
    difficulty: 'Intermediate',
  },
  {
    id: 'ac3',
    title: 'Tax Fundamentals',
    description: 'Understand taxes and how they affect your finances',
    requirements: ['Complete 6 lessons', 'Pass 2 quizzes'],
    estimatedHours: 5,
    skills: ['Tax Basics', 'Deductions', 'Filing'],
    difficulty: 'Intermediate',
  },
];

const certificateTypeConfig = {
  track_completion: { icon: GraduationCap, color: 'from-blue-500 to-indigo-500' },
  achievement: { icon: Trophy, color: 'from-yellow-500 to-orange-500' },
  milestone: { icon: Medal, color: 'from-purple-500 to-pink-500' },
};

export default function CertificatesPage() {
  const [activeTab, setActiveTab] = useState('earned');
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);

  const earnedCertificates = certificates.filter(c => c.status === 'earned');
  const inProgressCertificates = certificates.filter(c => c.status === 'in_progress');

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
          <Award className="h-10 w-10 text-yellow-500" />
          Certificates
        </h1>
        <p className="text-muted-foreground">
          Showcase your achievements and track your learning milestones
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <Award className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-700">{earnedCertificates.length}</p>
            <p className="text-xs text-blue-600">Certificates Earned</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">3</p>
            <p className="text-xs text-green-600">Tracks Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold text-yellow-700">90%</p>
            <p className="text-xs text-yellow-600">Average Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">21</p>
            <p className="text-xs text-purple-600">Learning Hours</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="earned">
            Earned ({earnedCertificates.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({inProgressCertificates.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availableCertificates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {earnedCertificates.map((cert) => {
              const config = certificateTypeConfig[cert.type as keyof typeof certificateTypeConfig];
              const Icon = config?.icon || Award;

              return (
                <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all">
                  {/* Certificate Preview */}
                  <div className={`h-40 bg-gradient-to-br ${config?.color || 'from-gray-500 to-gray-600'} p-6 relative`}>
                    <div className="absolute inset-0 bg-[url('/certificate-pattern.svg')] opacity-10" />
                    <div className="relative h-full flex flex-col items-center justify-center text-white text-center">
                      <Icon className="h-12 w-12 mb-2" />
                      <h3 className="text-xl font-bold">{cert.title}</h3>
                      <p className="text-sm opacity-90">Certificate of Completion</p>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge className="bg-white/20 text-white backdrop-blur-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>

                    <div className="space-y-3">
                      {cert.completionScore && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-bold text-green-600">{cert.completionScore}%</span>
                        </div>
                      )}
                      {cert.issuedAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Issued</span>
                          <span>{new Date(cert.issuedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {cert.skills && (
                        <div className="flex flex-wrap gap-1">
                          {cert.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {cert.badgeEarned && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                          <Trophy className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700">
                            Badge Earned: {cert.badgeEarned}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inProgressCertificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden">
                <div className="h-40 bg-gradient-to-br from-gray-400 to-gray-500 p-6 relative opacity-75">
                  <div className="absolute inset-0 bg-[url('/certificate-pattern.svg')] opacity-10" />
                  <div className="relative h-full flex flex-col items-center justify-center text-white text-center">
                    <GraduationCap className="h-12 w-12 mb-2" />
                    <h3 className="text-xl font-bold">{cert.title}</h3>
                    <p className="text-sm opacity-90">In Progress</p>
                  </div>
                </div>

                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span className="font-bold">{cert.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                          style={{ width: `${cert.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="font-bold">{cert.totalLessons}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="font-bold">{cert.totalQuizzes}</p>
                        <p className="text-xs text-muted-foreground">Quizzes</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="font-bold">{cert.totalHours}h</p>
                        <p className="text-xs text-muted-foreground">Est. Time</p>
                      </div>
                    </div>

                    {cert.skills && (
                      <div className="flex flex-wrap gap-1">
                        {cert.skills.map((skill) => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-4">
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCertificates.map((cert) => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{cert.difficulty}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {cert.estimatedHours}h
                    </div>
                  </div>
                  <CardTitle className="text-lg">{cert.title}</CardTitle>
                  <CardDescription>{cert.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Requirements:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {cert.requirements.map((req, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Target className="h-3 w-3" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {cert.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <Button className="w-full">
                    Start Track
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
