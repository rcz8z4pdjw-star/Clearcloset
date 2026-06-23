'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  BookOpen,
  Trophy,
  Target,
  User,
  MessageCircle,
  Bell,
  Search,
  Flame,
  Menu,
  X,
  Calculator,
  Users,
  Gift,
  Settings,
  HelpCircle,
  Calendar,
  Award,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface MobileNavProps {
  streak?: number;
  unreadMessages?: number;
  unreadNotifications?: number;
}

const mainNavItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/learn', label: 'Learn', icon: BookOpen },
  { href: '/dashboard/challenges', label: 'Challenges', icon: Target, badge: 3 },
  { href: '/dashboard/leaderboard', label: 'Ranks', icon: Trophy },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

const moreNavItems = [
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/search', label: 'Search', icon: Search },
  { href: '/dashboard/tools', label: 'Tools', icon: Calculator },
  { href: '/dashboard/connections', label: 'Connections', icon: Users },
  { href: '/dashboard/rewards', label: 'Rewards', icon: Gift },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/achievements', label: 'Achievements', icon: Award },
  { href: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/help', label: 'Help', icon: HelpCircle },
];

export function MobileBottomNav({ streak = 0, unreadMessages = 0, unreadNotifications = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full relative',
                  isActive ? 'text-indigo-600' : 'text-gray-500'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-[10px] mt-1',
                  isActive ? 'font-semibold' : 'font-normal'
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-b-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Safe area padding for bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}

// Mobile header with streak and quick actions
export function MobileHeader({ streak = 0, unreadMessages = 0, unreadNotifications = 0 }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo and Streak */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-bold text-lg text-indigo-600">
            Ascent
          </Link>
          {streak > 0 && (
            <Badge className="bg-orange-100 text-orange-600 gap-1">
              <Flame className="h-3 w-3" />
              {streak}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <Link href="/dashboard/search">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard/messages" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MessageCircle className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </Button>
          </Link>
          <Link href="/dashboard/notifications" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Button>
          </Link>

          {/* More Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-1">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

// Floating action button for mobile
export function MobileFloatingAction() {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickActions = [
    { href: '/dashboard/learn', label: 'Start Learning', icon: BookOpen, color: 'bg-blue-500' },
    { href: '/dashboard/challenges', label: 'Daily Challenges', icon: Target, color: 'bg-orange-500' },
    { href: '/dashboard/tools', label: 'Financial Tools', icon: Calculator, color: 'bg-purple-500' },
  ];

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="absolute bottom-14 right-0 space-y-2 mb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 animate-in slide-in-from-right"
                onClick={() => setIsExpanded(false)}
              >
                <span className="bg-white px-3 py-1.5 rounded-full shadow text-sm whitespace-nowrap">
                  {action.label}
                </span>
                <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        className={cn(
          'w-12 h-12 rounded-full shadow-lg transition-all',
          isExpanded
            ? 'bg-gray-800 hover:bg-gray-700 rotate-45'
            : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <X className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
      </Button>
    </div>
  );
}

// Combined mobile navigation component
export function MobileNavigation(props: MobileNavProps) {
  return (
    <>
      <MobileHeader {...props} />
      <MobileBottomNav {...props} />
      <MobileFloatingAction />
    </>
  );
}
