'use client';

import { useAuth } from '@/hooks/use-auth';
import { Sidebar, MobileMenuButton } from '@/components/dashboard/sidebar';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirect('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="hidden md:block w-64 border-r p-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e]">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex md:hidden h-14 items-center border-b border-white/10 bg-white/5 backdrop-blur-sm px-4 gap-3">
          <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
          <div className="flex items-center gap-2 text-white">
            <Bot className="h-6 w-6 text-purple-400" />
            <span className="text-lg font-bold font-diediedi bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">ElizaGotchi OS</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
