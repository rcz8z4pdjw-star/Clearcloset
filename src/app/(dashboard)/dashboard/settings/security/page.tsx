'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  Check,
  LogOut,
  Monitor,
  Clock,
  MapPin,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

// Mock session data
const activeSessions = [
  {
    id: 's1',
    device: 'MacBook Pro',
    browser: 'Chrome 121',
    location: 'New York, NY',
    ip: '192.168.1.***',
    lastActive: 'Now',
    isCurrent: true,
  },
  {
    id: 's2',
    device: 'iPhone 14',
    browser: 'Safari Mobile',
    location: 'New York, NY',
    ip: '192.168.1.***',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 's3',
    device: 'iPad',
    browser: 'Safari',
    location: 'New York, NY',
    ip: '192.168.1.***',
    lastActive: '1 day ago',
    isCurrent: false,
  },
];

export default function SecuritySettingsPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [passwordChangeDialog, setPasswordChangeDialog] = useState(false);
  const [sessions, setSessions] = useState(activeSessions);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = () => {
    // In a real app, this would call an API
    setPasswordChangeDialog(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const handleRevokeAllSessions = () => {
    setSessions(sessions.filter(s => s.isCurrent));
  };

  const passwordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 66, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength(passwordForm.newPassword);

  return (
    <div className="space-y-6 p-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-500" />
          Security Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account security and active sessions
        </p>
      </div>

      {/* Security Score */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Security Score</h3>
              <p className="text-sm text-muted-foreground">Your account security level</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-indigo-600">
                {twoFactorEnabled ? '85' : '60'}/100
              </p>
              <Badge className={twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                {twoFactorEnabled ? 'Good' : 'Fair'}
              </Badge>
            </div>
          </div>
          {!twoFactorEnabled && (
            <Alert className="mt-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Improve your security</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Enable two-factor authentication to significantly increase your account security.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your password regularly to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Password</p>
              <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
            </div>
            <Dialog open={passwordChangeDialog} onOpenChange={setPasswordChangeDialog}>
              <DialogTrigger asChild>
                <Button>Change Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordForm.newPassword && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${strength.color} transition-all`}
                              style={{ width: `${strength.score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{strength.label}</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li className={passwordForm.newPassword.length >= 8 ? 'text-green-600' : ''}>
                            {passwordForm.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : ''}>
                            {/[A-Z]/.test(passwordForm.newPassword) ? '✓' : '○'} One uppercase letter
                          </li>
                          <li className={/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : ''}>
                            {/[0-9]/.test(passwordForm.newPassword) ? '✓' : '○'} One number
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPasswordChangeDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      passwordForm.newPassword !== passwordForm.confirmPassword ||
                      strength.score < 66
                    }
                  >
                    Update Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${twoFactorEnabled ? 'bg-green-100' : 'bg-muted'}`}>
                <Lock className={`h-6 w-6 ${twoFactorEnabled ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Use an app like Google Authenticator or Authy'}
                </p>
              </div>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>
          {twoFactorEnabled && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">Two-factor authentication is enabled</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your account is protected with an additional security layer
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Login Notifications</CardTitle>
          <CardDescription>
            Get notified about new logins to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive an email when a new device logs in
              </p>
            </div>
            <Switch
              checked={loginNotifications}
              onCheckedChange={setLoginNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Devices where your account is currently logged in
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                <LogOut className="h-4 w-4 mr-1" />
                Sign out all other devices
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                session.isCurrent ? 'bg-green-50 border-green-200' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${session.isCurrent ? 'bg-green-100' : 'bg-muted'}`}>
                  <Monitor className={`h-5 w-5 ${session.isCurrent ? 'text-green-600' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.isCurrent && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{session.browser}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRevokeSession(session.id)}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
