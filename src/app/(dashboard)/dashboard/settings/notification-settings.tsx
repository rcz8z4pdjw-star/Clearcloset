'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save } from 'lucide-react';

interface NotificationPreference {
  id: string;
  emailDigest: boolean;
  emailSession: boolean;
  emailBadge: boolean;
  emailAnnouncement: boolean;
  pushEnabled: boolean;
  pushSession: boolean;
  pushBadge: boolean;
}

interface NotificationSettingsProps {
  userId: string;
  preferences: NotificationPreference | null;
}

export function NotificationSettings({ userId, preferences }: NotificationSettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailDigest: preferences?.emailDigest ?? true,
    emailSession: preferences?.emailSession ?? true,
    emailBadge: preferences?.emailBadge ?? true,
    emailAnnouncement: preferences?.emailAnnouncement ?? true,
    pushEnabled: preferences?.pushEnabled ?? false,
    pushSession: preferences?.pushSession ?? true,
    pushBadge: preferences?.pushBadge ?? true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>
            Choose what you want to be notified about via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailDigest">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your learning progress
              </p>
            </div>
            <Switch
              id="emailDigest"
              checked={settings.emailDigest}
              onCheckedChange={() => handleToggle('emailDigest')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailSession">Session Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminders about upcoming mentorship sessions
              </p>
            </div>
            <Switch
              id="emailSession"
              checked={settings.emailSession}
              onCheckedChange={() => handleToggle('emailSession')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailBadge">Badge Achievements</Label>
              <p className="text-sm text-muted-foreground">
                Be notified when you earn a new badge
              </p>
            </div>
            <Switch
              id="emailBadge"
              checked={settings.emailBadge}
              onCheckedChange={() => handleToggle('emailBadge')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailAnnouncement">Announcements</Label>
              <p className="text-sm text-muted-foreground">
                Receive important announcements and updates
              </p>
            </div>
            <Switch
              id="emailAnnouncement"
              checked={settings.emailAnnouncement}
              onCheckedChange={() => handleToggle('emailAnnouncement')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Manage browser push notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushEnabled">Enable Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Allow the browser to send you notifications
              </p>
            </div>
            <Switch
              id="pushEnabled"
              checked={settings.pushEnabled}
              onCheckedChange={() => handleToggle('pushEnabled')}
            />
          </div>
          {settings.pushEnabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushSession">Session Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications for upcoming sessions
                  </p>
                </div>
                <Switch
                  id="pushSession"
                  checked={settings.pushSession}
                  onCheckedChange={() => handleToggle('pushSession')}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pushBadge">Badge Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications when you earn badges
                  </p>
                </div>
                <Switch
                  id="pushBadge"
                  checked={settings.pushBadge}
                  onCheckedChange={() => handleToggle('pushBadge')}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Preferences
      </Button>
    </div>
  );
}
