'use client';

import { cn } from '@/lib/utils';

// Environment themes for each agent type
const agentThemes: Record<string, {
  gradient: string;
  pattern: string;
  accentColor: string;
  icon: string;
}> = {
  'whale-watcher': {
    gradient: 'from-blue-900/40 via-cyan-900/30 to-blue-800/40',
    pattern: 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))]',
    accentColor: '#06b6d4',
    icon: '/toma2.png',
  },
  'portfolio-tracker': {
    gradient: 'from-pink-900/40 via-purple-900/30 to-fuchsia-800/40',
    pattern: 'bg-[linear-gradient(to_right,_var(--tw-gradient-stops))]',
    accentColor: '#ec4899',
    icon: '/toma1.png',
  },
  'airdrop-hunter': {
    gradient: 'from-emerald-900/40 via-green-900/30 to-teal-800/40',
    pattern: 'bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))]',
    accentColor: '#10b981',
    icon: '/toma3.png',
  },
  'gas-monitor': {
    gradient: 'from-amber-900/40 via-orange-900/30 to-yellow-800/40',
    pattern: 'bg-[conic-gradient(at_bottom_left,_var(--tw-gradient-stops))]',
    accentColor: '#f59e0b',
    icon: '/toma4.png',
  },
  'treasury-watcher': {
    gradient: 'from-blue-900/40 via-indigo-900/30 to-sky-800/40',
    pattern: 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]',
    accentColor: '#3b82f6',
    icon: '/toma5.png',
  },
  'contract-monitor': {
    gradient: 'from-red-900/40 via-rose-900/30 to-pink-800/40',
    pattern: 'bg-[linear-gradient(135deg,_var(--tw-gradient-stops))]',
    accentColor: '#ef4444',
    icon: '/toma6.png',
  },
  'market-scanner': {
    gradient: 'from-lime-900/40 via-green-900/30 to-emerald-800/40',
    pattern: 'bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))]',
    accentColor: '#84cc16',
    icon: '/toma7.png',
  },
  'reading-list-manager': {
    gradient: 'from-orange-900/40 via-amber-900/30 to-yellow-800/40',
    pattern: 'bg-[linear-gradient(to_bottom_right,_var(--tw-gradient-stops))]',
    accentColor: '#f97316',
    icon: '/toma8.png',
  },
  'github-issue-triager': {
    gradient: 'from-violet-900/40 via-purple-900/30 to-indigo-800/40',
    pattern: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]',
    accentColor: '#8b5cf6',
    icon: '/toma9.png',
  },
  'bug-reporter': {
    gradient: 'from-yellow-900/40 via-amber-900/30 to-orange-800/40',
    pattern: 'bg-[conic-gradient(at_top,_var(--tw-gradient-stops))]',
    accentColor: '#eab308',
    icon: '/toma4.png',
  },
  'changelog-writer': {
    gradient: 'from-teal-900/40 via-cyan-900/30 to-sky-800/40',
    pattern: 'bg-[radial-gradient(at_bottom_right,_var(--tw-gradient-stops))]',
    accentColor: '#14b8a6',
    icon: '/toma7.png',
  },
  'community-manager': {
    gradient: 'from-purple-900/40 via-fuchsia-900/30 to-pink-800/40',
    pattern: 'bg-[linear-gradient(to_top,_var(--tw-gradient-stops))]',
    accentColor: '#a855f7',
    icon: '/toma2.png',
  },
  'lore-keeper': {
    gradient: 'from-amber-900/40 via-yellow-900/30 to-orange-800/40',
    pattern: 'bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))]',
    accentColor: '#d97706',
    icon: '/toma8.png',
  },
};

// Default theme for unknown agent types
const defaultTheme = {
  gradient: 'from-slate-900/40 via-gray-900/30 to-zinc-800/40',
  pattern: 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]',
  accentColor: '#6b7280',
  icon: '/toma1.png',
};

export function getAgentTheme(agentType: string) {
  return agentThemes[agentType] || defaultTheme;
}

interface AgentEnvironmentProps {
  agentType: string;
  status: string;
  children: React.ReactNode;
  className?: string;
}

export function AgentEnvironment({ agentType, status, children, className }: AgentEnvironmentProps) {
  const theme = getAgentTheme(agentType);

  const statusOverlay = {
    running: '',
    paused: 'bg-black/30',
    stopped: 'bg-black/50 grayscale',
    error: 'bg-red-900/20',
    starting: '',
    pending: 'bg-black/40',
    configuring: 'bg-black/30',
  }[status] || '';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        theme.pattern,
        `bg-gradient-to-br ${theme.gradient}`,
        className
      )}
      style={{ '--accent-color': theme.accentColor } as React.CSSProperties}
    >
      {/* Animated background particles for running state */}
      {status === 'running' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-2 h-2 rounded-full opacity-30 animate-float-1"
            style={{ backgroundColor: theme.accentColor, left: '20%', top: '30%' }}
          />
          <div
            className="absolute w-1.5 h-1.5 rounded-full opacity-20 animate-float-2"
            style={{ backgroundColor: theme.accentColor, left: '70%', top: '60%' }}
          />
          <div
            className="absolute w-1 h-1 rounded-full opacity-25 animate-float-3"
            style={{ backgroundColor: theme.accentColor, left: '40%', top: '80%' }}
          />
        </div>
      )}

      {/* Status overlay */}
      <div className={cn('absolute inset-0 transition-all duration-300', statusOverlay)} />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
