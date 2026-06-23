'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Award, Download, Share2, Printer, ExternalLink, CheckCircle,
  Calendar, Clock, User, BookOpen, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// Mock certificate data
const certificate = {
  id: '1',
  title: 'Investment Fundamentals',
  type: 'Track Completion',
  recipientName: 'Alex Johnson',
  issuedDate: '2024-02-10',
  credentialId: 'CERT-2024-INV-001',
  track: {
    name: 'Investment Fundamentals',
    lessonsCompleted: 12,
    quizzesPassed: 4,
    totalHours: 8,
  },
  achievements: [
    { name: 'Perfect Scores', description: 'Scored 100% on 2 quizzes', icon: 'star' },
    { name: 'Fast Learner', description: 'Completed in under 2 weeks', icon: 'zap' },
    { name: 'Consistent', description: 'Maintained 7-day streak', icon: 'flame' },
  ],
  skills: [
    'Understanding stocks and bonds',
    'Portfolio diversification',
    'Risk assessment',
    'Market analysis basics',
  ],
  verificationUrl: 'https://ascent.capital/verify/CERT-2024-INV-001',
};

export default function CertificatePage() {
  const params = useParams();
  const [isSharing, setIsSharing] = useState(false);

  const handleDownload = () => {
    // In production, this would generate and download a PDF
    console.log('Downloading certificate...');
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${certificate.title} Certificate`,
          text: `I earned my ${certificate.title} certificate from Ascent Capital!`,
          url: certificate.verificationUrl,
        });
      } else {
        // Copy to clipboard
        await navigator.clipboard.writeText(certificate.verificationUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
    setIsSharing(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back Link */}
      <Link href="/dashboard/certificates" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Certificates
      </Link>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Certificate</h1>
          <p className="text-muted-foreground">View and share your achievement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleShare} disabled={isSharing}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Certificate Preview */}
      <Card className="overflow-hidden print:shadow-none">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-8 print:p-12">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Header */}
            <div className="flex items-center justify-center gap-3">
              <Award className="h-12 w-12" />
              <div className="text-left">
                <p className="text-sm opacity-80">ASCENT CAPITAL PARTNERS</p>
                <p className="text-xl font-bold">Certificate of Completion</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/20 my-6" />

            {/* Main Content */}
            <div className="space-y-4">
              <p className="text-lg opacity-90">This is to certify that</p>
              <p className="text-4xl font-bold">{certificate.recipientName}</p>
              <p className="text-lg opacity-90">has successfully completed</p>
              <p className="text-3xl font-bold">{certificate.title}</p>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8">
              <div className="text-center">
                <p className="text-3xl font-bold">{certificate.track.lessonsCompleted}</p>
                <p className="text-sm opacity-80">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{certificate.track.quizzesPassed}</p>
                <p className="text-sm opacity-80">Quizzes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{certificate.track.totalHours}h</p>
                <p className="text-sm opacity-80">Learning</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-white/20 pt-6 mt-6">
              <div className="flex justify-between items-center text-sm opacity-80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Issued: {new Date(certificate.issuedDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span>Credential ID: {certificate.credentialId}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Certificate Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificate.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-yellow-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills Gained */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Skills Gained
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certificate.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">Verify This Certificate</h3>
              <p className="text-sm text-muted-foreground">
                Anyone can verify the authenticity of this certificate using the link below.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-muted px-3 py-2 rounded-md">
                {certificate.credentialId}
              </code>
              <Button variant="outline" size="sm" asChild>
                <a href={certificate.verificationUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
