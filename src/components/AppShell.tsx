/**
 * AppShell — themed page shell matching the v1rtopia website.
 *
 * Provides the dark grid/vignette background, a sticky glass header with the
 * brand + signed-in user, the role-aware navigation, and the instance banner.
 * Wrap an authenticated page's content with this to get the consistent look.
 */

'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Terminal,
  Plug,
  Shield,
  ScrollText,
  Bug,
  Clock,
  Settings,
  RefreshCcw,
  Lock,
  LogOut,
  Pickaxe,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import InstanceBanner from './InstanceBanner';

interface ShellUser {
  name: string;
  role: string;
}

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', href: '/users', icon: Users, roles: ['Admin', 'Super Admin'] },
  { key: 'console', label: 'Console', href: '/console', icon: Terminal, roles: ['Admin', 'Super Admin'] },
  { key: 'plugins', label: 'Plugins', href: '/plugins', icon: Plug, roles: ['Admin', 'Super Admin'] },
  { key: 'roles', label: 'Roles', href: '/roles', icon: Shield, roles: ['Super Admin'] },
  { key: 'logs', label: 'Logs', href: '/logs', icon: ScrollText, roles: ['Super Admin', 'Moderator'] },
  { key: 'error-reports', label: 'Error Reports', href: '/error-reports', icon: Bug, roles: ['Super Admin'] },
  { key: 'scheduled-tasks', label: 'Tasks', href: '/scheduled-tasks', icon: Clock, roles: ['Super Admin', 'Admin'] },
  { key: 'metrics-settings', label: 'Metrics', href: '/metrics-settings', icon: Settings, roles: ['Super Admin'] },
  { key: 'migrate', label: 'Migrate Data', href: '/migrate-instance-data', icon: RefreshCcw, roles: ['Super Admin'] },
  { key: '2fa', label: '2FA Setup', href: '/2fa-setup', icon: Lock },
];

interface AppShellProps {
  user: ShellUser;
  /** Key of the active nav item (highlights it). */
  active?: string;
  children: ReactNode;
}

export default function AppShell({ user, active, children }: AppShellProps) {
  const canSee = (item: NavItem) => !item.roles || item.roles.includes(user.role);

  return (
    <div className="relative min-h-screen text-gray-200">
      {/* Background layers */}
      <div className="fixed inset-0 -z-10 bg-[#0a0a0a]" />
      <div className="fixed inset-0 -z-10 grid-bg" />
      <div className="fixed inset-0 -z-10 vignette" />

      {/* Header */}
      <header className="glass-strong border-b border-green-500/20 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 group-hover:glow-green-sm transition-all">
              <Pickaxe className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-green-400 text-glow leading-tight">
                SMP Admin Panel
              </h1>
              <p className="text-gray-500 text-xs">Server Management System</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white font-semibold leading-tight">{user.name}</p>
              <p className="text-green-400/70 text-xs font-mono">{user.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-red-400 hover:bg-red-500/10 font-medium transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="glass border-b border-green-500/10 sticky top-[73px] z-20">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar">
            {NAV_ITEMS.filter(canSee).map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'text-gray-400 border border-transparent hover:text-green-400 hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Instance banner */}
      <InstanceBanner />

      {/* Page content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
