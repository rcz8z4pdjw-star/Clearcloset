'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  BookOpen,
  Trophy,
  Target,
  Users,
  MessageCircle,
  Settings,
  Star,
  Flame,
  Award,
  Calendar,
  BarChart3,
  Shield,
  Sparkles,
  Gamepad2,
  Heart,
  Compass,
  GraduationCap,
  Bell,
  User,
} from 'lucide-react';

interface SidebarNavProps {
  userRole?: string;
  ageBand?: string;
  xp?: number;
  level?: number;
  streak?: number;
}

const navItems = [
  {
    title: 'Main',
    items: [
      { href: '/dashboard', label: 'Home', icon: Home },
      { href: '/dashboard/learning', label: 'Learning', icon: BookOpen },
      { href: '/dashboard/progress', label: 'My Progress', icon: BarChart3 },
    ],
  },
  {
    title: 'Achievements',
    items: [
      { href: '/dashboard/achievements', label: 'Achievements', icon: Trophy },
      { href: '/dashboard/badges', label: 'Badges', icon: Award },
      { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Target },
    ],
  },
  {
    title: 'Social',
    items: [
      { href: '/dashboard/activity', label: 'Activity Feed', icon: Sparkles },
      { href: '/dashboard/family', label: 'Family', icon: Users },
      { href: '/dashboard/mentors', label: 'Mentors', icon: GraduationCap },
    ],
  },
  {
    title: 'Resources',
    items: [
      { href: '/dashboard/resources', label: 'Resource Library', icon: Compass },
      { href: '/dashboard/avatar', label: 'Avatar Studio', icon: Gamepad2 },
      { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'Account',
    items: [
      { href: '/dashboard/profile', label: 'Profile', icon: User },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const parentItems = [
  {
    title: 'Parental',
    items: [
      { href: '/dashboard/parental', label: 'Parent Dashboard', icon: Shield },
    ],
  },
];

const mentorItems = [
  {
    title: 'Mentor',
    items: [
      { href: '/dashboard/mentor', label: 'Mentor Dashboard', icon: GraduationCap },
    ],
  },
];

// Age-specific labels and styling
const getAgeBandTheme = (ageBand?: string) => {
  switch (ageBand) {
    case 'JUNIOR_FOUNDATIONS':
      return {
        levelLabel: 'Rank',
        xpLabel: 'Stars',
        streakLabel: 'Fire',
        gradient: 'from-green-400 to-emerald-500',
        accent: 'bg-green-500',
      };
    case 'TEEN_SKILLS':
      return {
        levelLabel: 'Level',
        xpLabel: 'XP',
        streakLabel: 'Streak',
        gradient: 'from-blue-400 to-indigo-500',
        accent: 'bg-blue-500',
      };
    case 'LAUNCH':
      return {
        levelLabel: 'Level',
        xpLabel: 'XP',
        streakLabel: 'Streak',
        gradient: 'from-indigo-500 to-purple-500',
        accent: 'bg-indigo-500',
      };
    case 'STEWARDSHIP_PRACTICUM':
    case 'LEADERSHIP':
      return {
        levelLabel: 'Level',
        xpLabel: 'Points',
        streakLabel: 'Days',
        gradient: 'from-purple-500 to-pink-500',
        accent: 'bg-purple-500',
      };
    default:
      return {
        levelLabel: 'Level',
        xpLabel: 'XP',
        streakLabel: 'Streak',
        gradient: 'from-indigo-500 to-purple-500',
        accent: 'bg-indigo-500',
      };
  }
};

export function SidebarNav({
  userRole = 'MEMBER',
  ageBand = 'LAUNCH',
  xp = 0,
  level = 1,
  streak = 0,
}: SidebarNavProps) {
  const pathname = usePathname();
  const theme = getAgeBandTheme(ageBand);

  // Combine nav items based on role
  let allNavItems = [...navItems];

  if (userRole === 'PARENT') {
    allNavItems = [...allNavItems, ...parentItems];
  }

  if (userRole === 'MENTOR' || userRole === 'CIO' || userRole === 'PROGRAM_DIRECTOR') {
    allNavItems = [...allNavItems, ...mentorItems];
  }

  return (
    <div className="flex h-full flex-col bg-white border-r">
      {/* Logo/Brand */}
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
            <Star className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl">Ascent</h1>
            <p className="text-xs text-muted-foreground">Next Gen Platform</p>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-white shadow-sm">
            <Star className="h-4 w-4 mx-auto text-indigo-500 mb-1" />
            <p className="text-sm font-bold">{level}</p>
            <p className="text-[10px] text-muted-foreground">{theme.levelLabel}</p>
          </div>
          <div className="p-2 rounded-lg bg-white shadow-sm">
            <Trophy className="h-4 w-4 mx-auto text-purple-500 mb-1" />
            <p className="text-sm font-bold">{xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp}</p>
            <p className="text-[10px] text-muted-foreground">{theme.xpLabel}</p>
          </div>
          <div className="p-2 rounded-lg bg-white shadow-sm">
            <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
            <p className="text-sm font-bold">{streak}</p>
            <p className="text-[10px] text-muted-foreground">{theme.streakLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-6">
          {allNavItems.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start gap-3',
                            isActive && `bg-gradient-to-r ${theme.gradient} text-white hover:opacity-90`
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Daily Challenge Prompt */}
      <div className="p-4 border-t">
        <div className={`p-4 rounded-xl bg-gradient-to-r ${theme.gradient} text-white`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5" />
            <span className="font-semibold text-sm">Daily Challenge</span>
          </div>
          <p className="text-xs opacity-90 mb-3">
            Complete today&apos;s challenges to earn bonus XP!
          </p>
          <Link href="/dashboard">
            <Button
              size="sm"
              variant="secondary"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
            >
              View Challenges
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
