'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  TrendingUp,
  Briefcase,
  LineChart,
  Heart,
  Building2,
  Settings,
  Shield,
  UserCog,
  FileText,
  Calendar,
  Target,
  Wallet,
  GraduationCap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface SidebarProps {
  userRoles: string[];
  ageBand?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: { title: string; href: string }[];
  roles?: string[];
  ageBands?: string[];
}

const memberNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Learning Hub',
    href: '/dashboard/learning',
    icon: BookOpen,
    children: [
      { title: 'All Tracks', href: '/dashboard/learning' },
      { title: 'My Progress', href: '/dashboard/learning/progress' },
      { title: 'Certificates', href: '/dashboard/learning/certificates' },
    ],
  },
  {
    title: 'Mentorship',
    href: '/dashboard/mentorship',
    icon: Users,
    children: [
      { title: 'My Mentor', href: '/dashboard/mentorship' },
      { title: 'Sessions', href: '/dashboard/mentorship/sessions' },
      { title: 'Action Plans', href: '/dashboard/mentorship/action-plans' },
    ],
  },
  {
    title: 'Community',
    href: '/dashboard/community',
    icon: MessageSquare,
    children: [
      { title: 'My Cohorts', href: '/dashboard/community' },
      { title: 'Events', href: '/dashboard/community/events' },
      { title: 'Challenges', href: '/dashboard/community/challenges' },
    ],
  },
  {
    title: 'Stewardship Lab',
    href: '/dashboard/stewardship',
    icon: Wallet,
    children: [
      { title: 'Budget Builder', href: '/dashboard/stewardship/budget' },
      { title: 'Savings Goals', href: '/dashboard/stewardship/savings' },
      { title: 'Values Framework', href: '/dashboard/stewardship/values' },
      { title: 'Wealth Story', href: '/dashboard/stewardship/story' },
    ],
  },
  {
    title: 'Career & Identity',
    href: '/dashboard/career',
    icon: Briefcase,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    children: [
      { title: 'Career Plan', href: '/dashboard/career/plan' },
      { title: 'Networking', href: '/dashboard/career/networking' },
      { title: 'Seed Review', href: '/dashboard/career/seed' },
      { title: 'Compensation Tools', href: '/dashboard/career/compensation' },
    ],
  },
  {
    title: 'IC Practicum',
    href: '/dashboard/practicum',
    icon: LineChart,
    ageBands: ['STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    children: [
      { title: 'IC Meetings', href: '/dashboard/practicum/meetings' },
      { title: 'Market Memos', href: '/dashboard/practicum/memos' },
      { title: 'My Portfolio', href: '/dashboard/practicum/portfolio' },
    ],
  },
  {
    title: 'Philanthropic Leadership',
    href: '/dashboard/philanthropy',
    icon: Heart,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    children: [
      { title: 'Giving Strategy', href: '/dashboard/philanthropy/strategy' },
      { title: 'Grant Proposals', href: '/dashboard/philanthropy/grants' },
      { title: 'Impact Tracking', href: '/dashboard/philanthropy/impact' },
    ],
  },
  {
    title: 'Family Governance',
    href: '/dashboard/governance',
    icon: Building2,
    ageBands: ['LAUNCH', 'STEWARDSHIP_PRACTICUM', 'LEADERSHIP'],
    children: [
      { title: 'Governance Basics', href: '/dashboard/governance/basics' },
      { title: 'Practice Scenarios', href: '/dashboard/governance/scenarios' },
      { title: 'Meeting Kit', href: '/dashboard/governance/meetings' },
    ],
  },
  {
    title: 'Resources',
    href: '/dashboard/resources',
    icon: FileText,
    children: [
      { title: 'Library', href: '/dashboard/resources/library' },
      { title: 'Glossary', href: '/dashboard/resources/glossary' },
      { title: 'Templates', href: '/dashboard/resources/templates' },
    ],
  },
];

const parentNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Household',
    href: '/dashboard/household',
    icon: Users,
    children: [
      { title: 'Family Members', href: '/dashboard/household' },
      { title: 'Progress Overview', href: '/dashboard/household/progress' },
      { title: 'Milestones', href: '/dashboard/household/milestones' },
    ],
  },
  {
    title: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
];

const mentorNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Mentees',
    href: '/dashboard/mentees',
    icon: Users,
  },
  {
    title: 'Sessions',
    href: '/dashboard/sessions',
    icon: Calendar,
  },
  {
    title: 'Feedback Queue',
    href: '/dashboard/feedback',
    icon: MessageSquare,
    badge: 'New',
  },
  {
    title: 'Rubric Scoring',
    href: '/dashboard/scoring',
    icon: Target,
  },
];

const cioNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'IC Practicum',
    href: '/dashboard/ic-oversight',
    icon: LineChart,
    children: [
      { title: 'Overview', href: '/dashboard/ic-oversight' },
      { title: 'Memo Queue', href: '/dashboard/ic-oversight/memos' },
      { title: 'Trade Approvals', href: '/dashboard/ic-oversight/trades' },
      { title: 'Portfolio Review', href: '/dashboard/ic-oversight/portfolios' },
    ],
  },
  {
    title: 'Constraints',
    href: '/dashboard/constraints',
    icon: Shield,
  },
];

const programDirectorNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cohorts',
    href: '/dashboard/cohorts',
    icon: Users,
  },
  {
    title: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
  {
    title: 'Attendance',
    href: '/dashboard/attendance',
    icon: Target,
  },
  {
    title: 'Mentor Assignments',
    href: '/dashboard/assignments',
    icon: UserCog,
  },
  {
    title: 'Gates Config',
    href: '/dashboard/gates',
    icon: Shield,
  },
];

const adminNav: NavItem[] = [
  {
    title: 'Admin Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Invites',
    href: '/admin/invites',
    icon: UserCog,
  },
  {
    title: 'Households',
    href: '/admin/households',
    icon: Building2,
  },
  {
    title: 'Content CMS',
    href: '/admin/content',
    icon: FileText,
    children: [
      { title: 'All Content', href: '/admin/content' },
      { title: 'Approval Queue', href: '/admin/content/approvals' },
      { title: 'Tracks & Modules', href: '/admin/content/tracks' },
    ],
  },
  {
    title: 'Cohorts',
    href: '/admin/cohorts',
    icon: GraduationCap,
  },
  {
    title: 'Moderation',
    href: '/admin/moderation',
    icon: Shield,
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit',
    icon: FileText,
  },
  {
    title: 'Exports',
    href: '/admin/exports',
    icon: TrendingUp,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function Sidebar({ userRoles, ageBand, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Determine which nav to show based on roles
  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('COMPLIANCE');
  const isMentor = userRoles.includes('MENTOR');
  const isCIO = userRoles.includes('CIO');
  const isProgramDirector = userRoles.includes('PROGRAM_DIRECTOR');
  const isParent = userRoles.includes('PARENT');
  const isMember = userRoles.includes('MEMBER');

  // Build navigation items based on roles
  let navItems: NavItem[] = [];

  if (isMember) {
    navItems = memberNav.filter((item) => {
      if (item.ageBands && ageBand) {
        return item.ageBands.includes(ageBand);
      }
      return true;
    });
  }

  if (isParent) {
    navItems = [...navItems, ...parentNav];
  }

  if (isMentor) {
    navItems = [...navItems, ...mentorNav];
  }

  if (isCIO) {
    navItems = [...navItems, ...cioNav];
  }

  if (isProgramDirector) {
    navItems = [...navItems, ...programDirectorNav];
  }

  // Deduplicate by href
  navItems = navItems.filter(
    (item, index, self) => index === self.findIndex((t) => t.href === item.href)
  );

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform duration-200 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ScrollArea className="h-full py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = isActive(item.href);
              const isExpanded = expandedItems.includes(item.href);
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.href}>
                  {hasChildren ? (
                    <button
                      onClick={() => toggleExpanded(item.href)}
                      className={cn(
                        'sidebar-link w-full justify-between',
                        isItemActive && 'sidebar-link-active'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px]">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'sidebar-link',
                        isItemActive && 'sidebar-link-active'
                      )}
                      onClick={onClose}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-[10px] ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )}

                  {hasChildren && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'sidebar-link text-sm',
                            pathname === child.href && 'sidebar-link-active'
                          )}
                          onClick={onClose}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Admin section */}
            {isAdmin && (
              <>
                <div className="my-4 border-t pt-4">
                  <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Administration
                  </div>
                  {adminNav.map((item) => {
                    const Icon = item.icon;
                    const isItemActive = isActive(item.href);
                    const isExpanded = expandedItems.includes(item.href);
                    const hasChildren = item.children && item.children.length > 0;

                    return (
                      <div key={item.href}>
                        {hasChildren ? (
                          <button
                            onClick={() => toggleExpanded(item.href)}
                            className={cn(
                              'sidebar-link w-full justify-between',
                              isItemActive && 'sidebar-link-active'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            className={cn(
                              'sidebar-link',
                              isItemActive && 'sidebar-link-active'
                            )}
                            onClick={onClose}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        )}

                        {hasChildren && isExpanded && (
                          <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                            {item.children!.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'sidebar-link text-sm',
                                  pathname === child.href && 'sidebar-link-active'
                                )}
                                onClick={onClose}
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
