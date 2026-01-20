'use client';

import { Bell, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-sm px-6">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-white/50">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/40" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-8 bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-[10px] font-medium text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {/* Action button */}
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0">
                <Plus className="h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0" onClick={action.onClick}>
              <Plus className="h-4 w-4" />
              {action.label}
            </Button>
          )
        )}
      </div>
    </header>
  );
}
