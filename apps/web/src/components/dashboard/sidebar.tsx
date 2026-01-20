'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Bot,
  LayoutDashboard,
  Link2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Egg,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/gotchi', icon: Egg, label: 'My Gotchis' },
  { href: '/dashboard/agents', icon: Bot, label: 'Agents' },
  { href: '/dashboard/connections', icon: Link2, label: 'Connections' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onMobileClose}>
          <Bot className="h-6 w-6 text-purple-400" />
          {!collapsed && <span className="font-bold font-diediedi bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">ElizaGotchi OS</span>}
        </Link>
        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto h-8 w-8 hidden md:flex text-white/60 hover:text-white hover:bg-white/10', collapsed && 'mx-auto')}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8 md:hidden text-white/60 hover:text-white hover:bg-white/10"
          onClick={onMobileClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-white/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5',
                collapsed && 'md:justify-center md:px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-purple-400')} />
              <span className={cn(collapsed && 'md:hidden')}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-white/10" />

      {/* User */}
      <div className={cn('p-4', collapsed && 'md:p-2')}>
        {user && (
          <div
            className={cn(
              'flex items-center gap-3',
              collapsed && 'md:flex-col md:gap-2'
            )}
          >
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {user.name?.[0] ?? user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className={cn('flex-1 overflow-hidden', collapsed && 'md:hidden')}>
              <p className="truncate text-sm font-medium text-white">
                {user.name ?? user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="h-8 w-8 text-white/60 hover:text-white hover:bg-white/10"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex h-screen flex-col border-r border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-white/10 bg-[#1a1033]/95 backdrop-blur-sm transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ display: 'flex' }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
