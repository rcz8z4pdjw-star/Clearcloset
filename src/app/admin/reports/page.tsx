'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText, Download, Calendar, TrendingUp, Users, BookOpen,
  Award, Clock, Filter, Search, RefreshCw, Mail, BarChart3, PieChart
} from 'lucide-react';

const reportTypes = [
  {
    id: 'user-engagement',
    name: 'User Engagement Report',
    description: 'Daily/weekly/monthly active users, session duration, feature usage',
    category: 'engagement',
    lastGenerated: '2024-02-10',
    schedule: 'weekly',
  },
  {
    id: 'learning-progress',
    name: 'Learning Progress Report',
    description: 'Lesson completions, quiz scores, track progress by age band',
    category: 'learning',
    lastGenerated: '2024-02-10',
    schedule: 'weekly',
  },
  {
    id: 'gamification',
    name: 'Gamification Report',
    description: 'XP earned, badges awarded, level ups, streaks',
    category: 'engagement',
    lastGenerated: '2024-02-09',
    schedule: 'daily',
  },
  {
    id: 'mentorship',
    name: 'Mentorship Report',
    description: 'Sessions completed, mentor ratings, mentee progress',
    category: 'mentorship',
    lastGenerated: '2024-02-07',
    schedule: 'weekly',
  },
  {
    id: 'workshop-attendance',
    name: 'Workshop Attendance Report',
    description: 'Registration rates, attendance, feedback scores',
    category: 'workshops',
    lastGenerated: '2024-02-10',
    schedule: 'per-event',
  },
  {
    id: 'content-performance',
    name: 'Content Performance Report',
    description: 'Lesson views, completion rates, ratings, feedback',
    category: 'content',
    lastGenerated: '2024-02-05',
    schedule: 'monthly',
  },
  {
    id: 'age-band-analysis',
    name: 'Age Band Analysis',
    description: 'Performance metrics segmented by age group',
    category: 'analytics',
    lastGenerated: '2024-02-01',
    schedule: 'monthly',
  },
  {
    id: 'family-activity',
    name: 'Family Activity Report',
    description: 'Parent-child engagement, family goals, messaging activity',
    category: 'engagement',
    lastGenerated: '2024-02-08',
    schedule: 'weekly',
  },
];

const savedReports = [
  {
    id: '1',
    name: 'Weekly Engagement - Feb 3-10',
    type: 'User Engagement Report',
    generatedAt: '2024-02-10T10:00:00Z',
    format: 'pdf',
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Q1 Learning Progress',
    type: 'Learning Progress Report',
    generatedAt: '2024-02-05T14:30:00Z',
    format: 'xlsx',
    size: '1.8 MB',
  },
  {
    id: '3',
    name: 'January Gamification Stats',
    type: 'Gamification Report',
    generatedAt: '2024-02-01T09:00:00Z',
    format: 'pdf',
    size: '3.1 MB',
  },
];

const categories = ['All', 'engagement', 'learning', 'mentorship', 'workshops', 'content', 'analytics'];

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  const filteredReports = reportTypes.filter((report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerate = (reportId: string) => {
    setGenerating(reportId);
    setTimeout(() => setGenerating(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      engagement: <TrendingUp className="h-5 w-5" />,
      learning: <BookOpen className="h-5 w-5" />,
      mentorship: <Users className="h-5 w-5" />,
      workshops: <Calendar className="h-5 w-5" />,
      content: <FileText className="h-5 w-5" />,
      analytics: <BarChart3 className="h-5 w-5" />,
    };
    return icons[category] || <FileText className="h-5 w-5" />;
  };

  const getScheduleBadge = (schedule: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-green-100 text-green-700',
      weekly: 'bg-blue-100 text-blue-700',
      monthly: 'bg-purple-100 text-purple-700',
      'per-event': 'bg-orange-100 text-orange-700',
    };
    return <Badge className={colors[schedule] || 'bg-gray-100'}>{schedule}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Generate and manage platform reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
            <FileText className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reportTypes.length}</p>
              <p className="text-sm text-muted-foreground">Report Types</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{savedReports.length}</p>
              <p className="text-sm text-muted-foreground">Saved Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Mail className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Auto-Emailed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Report Types Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredReports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      report.category === 'engagement' ? 'bg-blue-100 text-blue-600' :
                      report.category === 'learning' ? 'bg-green-100 text-green-600' :
                      report.category === 'mentorship' ? 'bg-purple-100 text-purple-600' :
                      report.category === 'workshops' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {getCategoryIcon(report.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{report.name}</h3>
                        {getScheduleBadge(report.schedule)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleGenerate(report.id)}
                          disabled={generating === report.id}
                        >
                          {generating === report.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Generate
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Report Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Generated</th>
                      <th className="text-left p-4 font-medium">Format</th>
                      <th className="text-left p-4 font-medium">Size</th>
                      <th className="text-right p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-muted/25">
                        <td className="p-4 font-medium">{report.name}</td>
                        <td className="p-4 text-muted-foreground">{report.type}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(report.generatedAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{report.size}</td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Scheduled Reports</h3>
            <p className="text-muted-foreground mb-4">Configure automatic report generation</p>
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Schedule New Report
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
