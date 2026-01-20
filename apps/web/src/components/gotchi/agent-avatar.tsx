'use client';

import { cn } from '@/lib/utils';
import { getAgentTheme } from './agent-environment';
import Image from 'next/image';

interface AgentAvatarProps {
  agentType: string;
  status: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function AgentAvatar({ agentType, status, size = 'md', onClick, className }: AgentAvatarProps) {
  const theme = getAgentTheme(agentType);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const imageSizes = {
    sm: 48,
    md: 72,
    lg: 96,
  };

  // Status-based animations
  const statusAnimation = {
    running: 'animate-bounce-slow',
    paused: 'opacity-60',
    stopped: 'opacity-40 grayscale',
    error: 'animate-shake',
    starting: 'animate-pulse',
    pending: 'opacity-50',
    configuring: 'animate-pulse',
  }[status] || '';

  // Status overlays
  const renderStatusOverlay = () => {
    switch (status) {
      case 'paused':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl animate-pulse">z</span>
            <span className="text-xl animate-pulse delay-100">z</span>
            <span className="text-lg animate-pulse delay-200">z</span>
          </div>
        );
      case 'error':
        return (
          <div className="absolute -top-1 -right-1 text-red-500 text-xl">
            ☠️
          </div>
        );
      case 'stopped':
        return (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
            <span className="text-2xl">🥚</span>
          </div>
        );
      case 'starting':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute w-full h-full rounded-full animate-ping opacity-30"
              style={{ backgroundColor: theme.accentColor }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95',
        sizeClasses[size],
        statusAnimation,
        className
      )}
      onClick={onClick}
    >
      {/* Glow effect for running agents */}
      {status === 'running' && (
        <div
          className="absolute inset-0 rounded-full blur-md opacity-40"
          style={{ backgroundColor: theme.accentColor }}
        />
      )}

      {/* Avatar container */}
      <div
        className={cn(
          'relative rounded-full overflow-hidden border-2',
          status === 'running' ? 'border-white/30' : 'border-white/10'
        )}
        style={{ backgroundColor: `${theme.accentColor}20` }}
      >
        <Image
          src={theme.icon}
          alt={agentType}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-contain"
        />
      </div>

      {/* Status overlay */}
      {renderStatusOverlay()}
    </div>
  );
}
