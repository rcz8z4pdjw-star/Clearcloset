import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  BookOpen,
  Trophy,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Flame,
  Award,
  GraduationCap,
  DollarSign,
} from 'lucide-react';

// Mock analytics data
const overviewStats = {
  totalUsers: 1247,
  usersChange: 12.5,
  activeUsers: 892,
  activeChange: 8.3,
  lessonsCompleted: 15420,
  lessonsChange: 15.2,
  avgEngagement: 4.2,
  engagementChange: 5.1,
};

const ageBandStats = [
  { band: 'Junior Foundations', users: 234, active: 189, completion: 78, avgScore: 85 },
  { band: 'Teen Skills', users: 412, active: 345, completion: 72, avgScore: 82 },
  { band: 'Launch', users: 356, active: 258, completion: 68, avgScore: 79 },
  { band: 'Stewardship Practicum', users: 178, active: 78, completion: 65, avgScore: 84 },
  { band: 'Leadership', users: 67, active: 22, completion: 71, avgScore: 88 },
];

const topContent = [
  { title: 'Introduction to Budgeting', completions: 892, rating: 4.8 },
  { title: 'Understanding Compound Interest', completions: 756, rating: 4.9 },
  { title: 'Your First Investment', completions: 634, rating: 4.7 },
  { title: 'Emergency Fund Basics', completions: 589, rating: 4.6 },
  { title: 'Smart Spending Habits', completions: 534, rating: 4.5 },
];

const engagementTrends = [
  { month: 'Sep', users: 780, lessons: 8200, quizzes: 1450 },
  { month: 'Oct', users: 890, lessons: 9800, quizzes: 1680 },
  { month: 'Nov', users: 1020, lessons: 11500, quizzes: 1920 },
  { month: 'Dec', users: 1100, lessons: 12800, quizzes: 2100 },
  { month: 'Jan', users: 1180, lessons: 14200, quizzes: 2380 },
  { month: 'Feb', users: 1247, lessons: 15420, quizzes: 2540 },
];

const recentActivity = [
  { user: 'Alex C.', action: 'Completed track', target: 'Financial Foundations', time: '2 min ago' },
  { user: 'Jordan S.', action: 'Earned badge', target: 'Quiz Master', time: '15 min ago' },
  { user: 'Taylor K.', action: 'Started track', target: 'Advanced Investing', time: '32 min ago' },
  { user: 'Casey W.', action: 'Achieved streak', target: '30 days', time: '1 hour ago' },
  { user: 'Morgan L.', action: 'Passed quiz', target: 'Tax Basics', time: '2 hours ago' },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-500" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Platform-wide metrics and engagement insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last 30 days</Badge>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overviewStats.totalUsers.toLocaleString()}
          change={overviewStats.usersChange}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={overviewStats.activeUsers.toLocaleString()}
          change={overviewStats.activeChange}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Lessons Completed"
          value={overviewStats.lessonsCompleted.toLocaleString()}
          change={overviewStats.lessonsChange}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Avg. Sessions/Week"
          value={overviewStats.avgEngagement.toString()}
          change={overviewStats.engagementChange}
          icon={Target}
          color="orange"
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Trends Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Engagement Trends
                </CardTitle>
                <CardDescription>Monthly active users and completions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {engagementTrends.map((month, i) => (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full space-y-1">
                        <div
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${(month.users / 1400) * 150}px` }}
                          title={`${month.users} users`}
                        />
                        <div
                          className="w-full bg-green-400 rounded-t"
                          style={{ height: `${(month.lessons / 20000) * 100}px` }}
                          title={`${month.lessons} lessons`}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{month.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="text-sm text-muted-foreground">Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded" />
                    <span className="text-sm text-muted-foreground">Lessons</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Age Band Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-500" />
                  Users by Age Band
                </CardTitle>
                <CardDescription>Distribution across learning programs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ageBandStats.map((band) => (
                    <div key={band.band} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{band.band}</span>
                        <span className="text-muted-foreground">{band.users} users</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${(band.users / 500) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Content */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performing Content
                </CardTitle>
                <CardDescription>Most completed lessons this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topContent.map((content, i) => (
                    <div key={content.title} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-700' :
                        i === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{content.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{content.completions} completions</span>
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-yellow-500" />
                            {content.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          {activity.action}:{' '}
                          <span className="text-muted-foreground">{activity.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Metrics by Age Band</CardTitle>
              <CardDescription>Detailed breakdown of user engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Age Band</th>
                      <th className="text-right py-3 px-4 font-medium">Total Users</th>
                      <th className="text-right py-3 px-4 font-medium">Active (30d)</th>
                      <th className="text-right py-3 px-4 font-medium">Completion Rate</th>
                      <th className="text-right py-3 px-4 font-medium">Avg Quiz Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageBandStats.map((band) => (
                      <tr key={band.band} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{band.band}</td>
                        <td className="py-3 px-4 text-right">{band.users}</td>
                        <td className="py-3 px-4 text-right">
                          {band.active}
                          <span className="text-muted-foreground text-sm ml-1">
                            ({Math.round((band.active / band.users) * 100)}%)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant={band.completion >= 70 ? 'default' : 'secondary'}>
                            {band.completion}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={band.avgScore >= 80 ? 'text-green-600' : 'text-yellow-600'}>
                            {band.avgScore}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Additional user metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">78%</p>
                  <p className="text-sm text-muted-foreground">30-day retention rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avg. Streak Length</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-orange-600">12</p>
                  <p className="text-sm text-muted-foreground">days per user</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mentor Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">342</p>
                  <p className="text-sm text-muted-foreground">this month</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-muted-foreground">Total Lessons</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">48</p>
                <p className="text-xs text-muted-foreground">Total Quizzes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">32</p>
                <p className="text-xs text-muted-foreground">Badges Available</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <GraduationCap className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Learning Tracks</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Streak Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { range: '1-7 days', count: 456, pct: 36 },
                    { range: '8-14 days', count: 312, pct: 25 },
                    { range: '15-30 days', count: 234, pct: 19 },
                    { range: '31-60 days', count: 156, pct: 13 },
                    { range: '60+ days', count: 89, pct: 7 },
                  ].map((item) => (
                    <div key={item.range} className="flex items-center gap-4">
                      <span className="w-24 text-sm">{item.range}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Peak Activity Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { time: '3 PM - 5 PM', activity: 'Highest', pct: 85 },
                    { time: '7 PM - 9 PM', activity: 'High', pct: 72 },
                    { time: '10 AM - 12 PM', activity: 'Medium', pct: 58 },
                    { time: '5 PM - 7 PM', activity: 'Medium', pct: 54 },
                    { time: '9 PM - 11 PM', activity: 'Low', pct: 32 },
                  ].map((item) => (
                    <div key={item.time} className="flex items-center gap-4">
                      <span className="w-28 text-sm">{item.time}</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.activity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  const isPositive = change >= 0;

  return (
    <Card className={colorClasses[color]}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="h-5 w-5" />
          <div className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change)}%
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs opacity-80">{title}</p>
      </CardContent>
    </Card>
  );
}
