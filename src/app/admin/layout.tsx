'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  FileText,
  GraduationCap,
  Shield,
  ClipboardList,
  Download,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  roles: string[];
}

const adminNav = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Invites', href: '/admin/invites', icon: UserPlus },
  { title: 'Households', href: '/admin/households', icon: Building2 },
  { title: 'Content CMS', href: '/admin/content', icon: FileText },
  { title: 'Cohorts', href: '/admin/cohorts', icon: GraduationCap },
  { title: 'Moderation', href: '/admin/moderation', icon: Shield },
  { title: 'Audit Logs', href: '/admin/audit', icon: ClipboardList },
  { title: 'Exports', href: '/admin/exports', icon: Download },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          // Check if user has admin role
          if (
            !data.user.roles.includes('ADMIN') &&
            !data.user.roles.includes('COMPLIANCE')
          ) {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 rounded bg-ascent-navy flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-lg">AC</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background">
          <ScrollArea className="h-full py-4">
            <div className="px-3 mb-4">
              <h2 className="px-3 text-lg font-semibold text-ascent-navy">
                Admin Console
              </h2>
            </div>
            <nav className="space-y-1 px-3">
              {adminNav.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted',
                      isActive && 'bg-muted text-foreground font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        <main className="flex-1 ml-64 min-h-[calc(100vh-4rem)]">
          <div className="container py-6 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
