'use client';

import { cn } from '@/lib/utils';

interface AgentStatusBarProps {
  status: string;
  activityLevel?: number; // 0-4
  healthLevel?: number; // 0-4
  className?: string;
}

function Heart({ filled, animate }: { filled: boolean; animate?: boolean }) {
  return (
    <span
      className={cn(
        'text-sm transition-all duration-300',
        filled ? 'text-pink-500' : 'text-white/20',
        animate && filled && 'animate-pulse'
      )}
    >
      {filled ? '♥' : '♡'}
    </span>
  );
}

function StatusText({ status }: { status: string }) {
  const statusConfig: Record<string, { text: string; color: string }> = {
    running: { text: 'Running', color: 'text-emerald-400' },
    paused: { text: 'Sleeping', color: 'text-amber-400' },
    stopped: { text: 'Dormant', color: 'text-gray-400' },
    error: { text: 'Sick!', color: 'text-red-400' },
    starting: { text: 'Waking...', color: 'text-blue-400' },
    pending: { text: 'Pending', color: 'text-gray-400' },
    configuring: { text: 'Setting up', color: 'text-purple-400' },
  };

  const config = statusConfig[status] || { text: status, color: 'text-gray-400' };

  return (
    <span className={cn('text-xs font-medium', config.color)}>
      {config.text}
    </span>
  );
}

export function AgentStatusBar({
  status,
  activityLevel = 4,
  healthLevel = 4,
  className,
}: AgentStatusBarProps) {
  // Adjust levels based on status
  const adjustedHealth = status === 'error' ? 0 : status === 'stopped' ? 1 : healthLevel;
  const adjustedActivity = status === 'paused' ? 1 : status === 'stopped' ? 0 : activityLevel;

  const isLowHealth = adjustedHealth <= 1;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Hearts row */}
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <Heart
            key={i}
            filled={i < adjustedHealth}
            animate={isLowHealth && i < adjustedHealth}
          />
        ))}
        <span className="mx-1 text-white/20">|</span>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'text-xs transition-all',
              i < adjustedActivity ? 'text-amber-400' : 'text-white/20'
            )}
          >
            {i < adjustedActivity ? '★' : '☆'}
          </span>
        ))}
      </div>

      {/* Status text */}
      <StatusText status={status} />
    </div>
  );
}
