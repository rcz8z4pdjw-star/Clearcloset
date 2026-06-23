'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, Shield, Eye, EyeOff, Users, Lock, Info } from 'lucide-react';

interface User {
  id: string;
  showProgressToParent: boolean;
  showBadgesToParent: boolean;
  allowMentorContact: boolean;
  roles: Array<{ role: string }>;
}

interface PrivacySettingsProps {
  user: User;
}

export function PrivacySettings({ user }: PrivacySettingsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    showProgressToParent: user.showProgressToParent ?? true,
    showBadgesToParent: user.showBadgesToParent ?? true,
    allowMentorContact: user.allowMentorContact ?? true,
  });

  const isMember = user.roles.some((r) => r.role === 'MEMBER');

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating privacy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Your Privacy Matters</AlertTitle>
        <AlertDescription>
          We take your privacy seriously. These settings control what information is
          visible to parents, mentors, and other users on the platform.
        </AlertDescription>
      </Alert>

      {/* Parent Visibility */}
      {isMember && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Parent Visibility
            </CardTitle>
            <CardDescription>
              Control what your parents can see on their family dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showProgressToParent" className="flex items-center gap-2">
                  Learning Progress
                  {settings.showProgressToParent ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Parents can see your lesson completion percentages
                </p>
              </div>
              <Switch
                id="showProgressToParent"
                checked={settings.showProgressToParent}
                onCheckedChange={() => handleToggle('showProgressToParent')}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="showBadgesToParent" className="flex items-center gap-2">
                  Badges & Achievements
                  {settings.showBadgesToParent ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Parents can see the badges you've earned
                </p>
              </div>
              <Switch
                id="showBadgesToParent"
                checked={settings.showBadgesToParent}
                onCheckedChange={() => handleToggle('showBadgesToParent')}
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Note:</strong> Private reflections and mentor session notes are
                  never shared with parents unless you explicitly choose to share them.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mentor & Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
          <CardDescription>
            Control how mentors and other users can reach you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowMentorContact">Allow Mentor Contact</Label>
              <p className="text-sm text-muted-foreground">
                Mentors can send you messages and session requests
              </p>
            </div>
            <Switch
              id="allowMentorContact"
              checked={settings.allowMentorContact}
              onCheckedChange={() => handleToggle('allowMentorContact')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Account */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Account</CardTitle>
          <CardDescription>
            Manage your data and account options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Download Your Data</p>
              <p className="text-sm text-muted-foreground">
                Export all your data in a machine-readable format
              </p>
            </div>
            <Button variant="outline">Export Data</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading} className="gap-2">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Privacy Settings
      </Button>
    </div>
  );
}
