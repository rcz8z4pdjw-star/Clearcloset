'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Gift,
  Users,
  Copy,
  Share2,
  Mail,
  MessageCircle,
  Check,
  Trophy,
  Star,
  Sparkles,
  ChevronRight,
  Clock,
  UserPlus,
  Zap,
  Crown,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Mock referral data
const referralStats = {
  code: 'ALEX2024',
  totalReferrals: 5,
  pendingReferrals: 2,
  xpEarned: 750,
  currentTier: 'Silver',
  nextTier: 'Gold',
  referralsToNextTier: 3,
};

const referralTiers = [
  { name: 'Bronze', min: 0, max: 2, reward: '100 XP per referral', color: 'from-amber-600 to-amber-700' },
  { name: 'Silver', min: 3, max: 7, reward: '150 XP per referral + Badge', color: 'from-gray-400 to-gray-500' },
  { name: 'Gold', min: 8, max: 14, reward: '200 XP per referral + 2x XP Boost', color: 'from-yellow-400 to-yellow-500' },
  { name: 'Platinum', min: 15, max: Infinity, reward: '250 XP per referral + Premium Rewards', color: 'from-cyan-400 to-cyan-500' },
];

const referredUsers = [
  { id: 'r1', name: 'Jamie Smith', status: 'active', joinedAt: '2024-02-15', xpEarned: 150 },
  { id: 'r2', name: 'Morgan Lee', status: 'active', joinedAt: '2024-02-10', xpEarned: 150 },
  { id: 'r3', name: 'Taylor Chen', status: 'active', joinedAt: '2024-02-05', xpEarned: 150 },
  { id: 'r4', name: 'Casey Brown', status: 'pending', joinedAt: '2024-02-18', xpEarned: 0 },
  { id: 'r5', name: 'Quinn Davis', status: 'pending', joinedAt: '2024-02-17', xpEarned: 0 },
];

const rewards = [
  {
    milestone: 1,
    reward: '100 XP Bonus',
    description: 'For your first referral',
    earned: true,
    icon: Sparkles,
  },
  {
    milestone: 3,
    reward: 'Referral Champion Badge',
    description: 'Earn an exclusive badge',
    earned: true,
    icon: Trophy,
  },
  {
    milestone: 5,
    reward: '2x XP Boost (24h)',
    description: 'Double your XP for a day',
    earned: true,
    icon: Zap,
  },
  {
    milestone: 10,
    reward: 'Exclusive Avatar Frame',
    description: 'Stand out in the community',
    earned: false,
    icon: Star,
  },
  {
    milestone: 15,
    reward: 'VIP Badge',
    description: 'Join the VIP club',
    earned: false,
    icon: Crown,
  },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralStats.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://ascent.app/join?ref=${referralStats.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTier = referralTiers.find(
    (t) => referralStats.totalReferrals >= t.min && referralStats.totalReferrals <= t.max
  );

  const nextTier = referralTiers.find(
    (t) => t.min > referralStats.totalReferrals
  );

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gift className="h-8 w-8 text-indigo-500" />
          Invite Friends
        </h1>
        <p className="text-muted-foreground mt-1">
          Share Ascent with friends and family to earn rewards
        </p>
      </div>

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Earn XP for Every Friend You Invite!</h2>
              <p className="text-indigo-100">
                When your friends join and start learning, you both earn rewards.
                The more friends you invite, the better your rewards get!
              </p>
              <div className="flex gap-2">
                <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                  150 XP per referral
                </Badge>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
              <p className="text-indigo-100 mb-2">Your Referral Code</p>
              <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg p-4">
                <span className="text-3xl font-mono font-bold">{referralStats.code}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleCopyCode}
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
              <Button
                className="w-full mt-4 bg-white text-indigo-600 hover:bg-white/90"
                onClick={handleCopyLink}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Copy Invite Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-indigo-500 mb-2" />
            <p className="text-3xl font-bold">{referralStats.totalReferrals}</p>
            <p className="text-sm text-muted-foreground">Total Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-3xl font-bold">{referralStats.pendingReferrals}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Sparkles className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-3xl font-bold">{referralStats.xpEarned}</p>
            <p className="text-sm text-muted-foreground">XP Earned</p>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${currentTier?.color} text-white`}>
          <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2" />
            <p className="text-3xl font-bold">{referralStats.currentTier}</p>
            <p className="text-sm opacity-90">Current Tier</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Share Options */}
        <Card>
          <CardHeader>
            <CardTitle>Share Your Invite</CardTitle>
            <CardDescription>Choose how you want to invite friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`mailto:?subject=Join me on Ascent!&body=Use my code ${referralStats.code} to join!`}>
                <Mail className="h-5 w-5 mr-3" />
                Share via Email
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`sms:?body=Join me on Ascent! Use code ${referralStats.code}`}>
                <MessageCircle className="h-5 w-5 mr-3" />
                Share via Text
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleCopyLink}>
              <Copy className="h-5 w-5 mr-3" />
              Copy Invite Link
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Or invite by email directly</p>
              <div className="flex gap-2">
                <Input
                  placeholder="friend@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Tiers</CardTitle>
            <CardDescription>Unlock better rewards as you refer more friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextTier && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress to {nextTier.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {referralStats.totalReferrals}/{nextTier.min}
                  </span>
                </div>
                <Progress
                  value={(referralStats.totalReferrals / nextTier.min) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {referralStats.referralsToNextTier} more referrals to unlock
                </p>
              </div>
            )}

            <div className="space-y-2">
              {referralTiers.map((tier) => {
                const isCurrentTier = tier.name === referralStats.currentTier;
                const isUnlocked = referralStats.totalReferrals >= tier.min;

                return (
                  <div
                    key={tier.name}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isCurrentTier ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                      {isUnlocked ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <Trophy className="h-5 w-5 text-white/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{tier.name}</span>
                        {isCurrentTier && (
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{tier.reward}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {tier.min}+ referrals
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Milestone Rewards
          </CardTitle>
          <CardDescription>Unlock special rewards at each milestone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {rewards.map((reward) => {
              const Icon = reward.icon;
              return (
                <div
                  key={reward.milestone}
                  className={`text-center p-4 rounded-lg border ${
                    reward.earned
                      ? 'bg-gradient-to-b from-yellow-50 to-transparent border-yellow-200'
                      : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div
                    className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                      reward.earned
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                        : 'bg-muted'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${reward.earned ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="font-semibold mt-3 text-sm">{reward.milestone} Referral{reward.milestone > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground mt-1">{reward.reward}</p>
                  {reward.earned && (
                    <Badge className="mt-2 bg-green-100 text-green-700 text-xs">Earned!</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Referred Users */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
          <CardDescription>Friends who joined using your code</CardDescription>
        </CardHeader>
        <CardContent>
          {referredUsers.length > 0 ? (
            <div className="space-y-3">
              {referredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">Joined {user.joinedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.status === 'active' ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {user.xpEarned > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-700">
                        +{user.xpEarned} XP
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No referrals yet. Start inviting friends!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle>How Referrals Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Share2 className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold mb-1">1. Share Your Code</h4>
              <p className="text-sm text-muted-foreground">
                Send your unique referral code to friends and family
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <UserPlus className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold mb-1">2. They Join</h4>
              <p className="text-sm text-muted-foreground">
                Your friend signs up using your code and completes their first lesson
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                <Gift className="h-6 w-6 text-indigo-600" />
              </div>
              <h4 className="font-semibold mb-1">3. You Both Earn</h4>
              <p className="text-sm text-muted-foreground">
                You get XP and they get a welcome bonus. Everyone wins!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
