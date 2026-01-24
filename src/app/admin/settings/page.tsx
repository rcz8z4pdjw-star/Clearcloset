'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings, Shield, Bell, Mail, Database, Globe, Palette,
  Users, Award, BookOpen, Save, RefreshCw, Key, Lock, Eye
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1500);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-indigo-500 to-purple-500">
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="gamification">Gamification</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Information
              </CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform Name</label>
                  <Input defaultValue="Ascent Capital Platform" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Support Email</label>
                  <Input defaultValue="support@ascentcapital.com" type="email" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Platform Description</label>
                <Textarea
                  defaultValue="An invite-only education, mentorship, and stewardship practice platform for ages 10-35."
                  rows={3}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Default Timezone</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>America/New_York (EST)</option>
                    <option>America/Chicago (CST)</option>
                    <option>America/Denver (MST)</option>
                    <option>America/Los_Angeles (PST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Default Language</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registration Settings
              </CardTitle>
              <CardDescription>Control user registration and onboarding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Invite-Only Registration</p>
                  <p className="text-sm text-muted-foreground">Users must be invited to join</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Require Email Verification</p>
                  <p className="text-sm text-muted-foreground">Users must verify email before accessing content</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Parent Approval for Minors</p>
                  <p className="text-sm text-muted-foreground">Require parent approval for users under 18</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Welcome Message</label>
                <Textarea
                  defaultValue="Welcome to the Ascent Capital Platform! We're excited to have you on your financial education journey."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamification" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                XP & Leveling Settings
              </CardTitle>
              <CardDescription>Configure experience points and leveling system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">XP per Lesson Completion</label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">XP per Quiz (100% Score)</label>
                  <Input type="number" defaultValue="100" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">XP per Journal Entry</label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">XP per Daily Challenge</label>
                  <Input type="number" defaultValue="25" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Level XP Multiplier</label>
                <Input type="number" step="0.1" defaultValue="1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  Each level requires this multiplier more XP than the previous
                </p>
              </div>
              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <p className="font-medium">Enable Streak Bonuses</p>
                  <p className="text-sm text-muted-foreground">Award bonus XP for consecutive daily activity</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Daily Challenges
              </CardTitle>
              <CardDescription>Configure daily challenge settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Challenges Per Day</label>
                  <Input type="number" defaultValue="3" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reset Time (UTC)</label>
                  <Input type="time" defaultValue="00:00" />
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <p className="font-medium">Age-Appropriate Challenges</p>
                  <p className="text-sm text-muted-foreground">Customize challenges based on user age band</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure platform notification behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Send email notifications for important events</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Enable browser push notifications</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Streak Reminders</p>
                  <p className="text-sm text-muted-foreground">Remind users to maintain their streak</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Workshop Reminders</p>
                  <p className="text-sm text-muted-foreground">Send reminders before scheduled workshops</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Workshop Reminder Lead Time</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>1 hour before</option>
                  <option>2 hours before</option>
                  <option>1 day before</option>
                  <option>1 week before</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>Customize email notification templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['Welcome Email', 'Password Reset', 'Workshop Reminder', 'Achievement Earned', 'Weekly Digest'].map((template) => (
                  <div key={template} className="flex items-center justify-between py-2 border-b">
                    <span>{template}</span>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure platform security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <select className="px-3 py-2 border rounded-md">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>4 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium">Password Requirements</p>
                  <p className="text-sm text-muted-foreground">Minimum 8 characters, uppercase, number, symbol</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Content Moderation</p>
                  <p className="text-sm text-muted-foreground">Review user-generated content before publishing</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>Manage API access keys</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Production API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">sk_live_****...****7x9f</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">Regenerate</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Test API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">sk_test_****...****3k2m</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">Regenerate</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Third-Party Integrations
              </CardTitle>
              <CardDescription>Connect external services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Stripe', description: 'Payment processing', connected: true },
                  { name: 'SendGrid', description: 'Email delivery', connected: true },
                  { name: 'Zoom', description: 'Video workshops', connected: false },
                  { name: 'Slack', description: 'Team notifications', connected: false },
                  { name: 'Google Analytics', description: 'Usage analytics', connected: true },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                    {integration.connected ? (
                      <Badge className="bg-green-100 text-green-700">Connected</Badge>
                    ) : (
                      <Button variant="outline" size="sm">Connect</Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Edit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
