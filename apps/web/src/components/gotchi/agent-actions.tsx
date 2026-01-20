'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MessageCircle, Settings, Utensils, Play, Pause, Square, RefreshCw } from 'lucide-react';

interface AgentActionsProps {
  status: string;
  onFeed?: () => void;
  onChat?: () => void;
  onSettings?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  variant?: 'compact' | 'full';
  isLoading?: boolean;
  className?: string;
}

export function AgentActions({
  status,
  onFeed,
  onChat,
  onSettings,
  onStart,
  onPause,
  onStop,
  onRestart,
  variant = 'compact',
  isLoading,
  className,
}: AgentActionsProps) {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isStopped = status === 'stopped' || status === 'pending';
  const isError = status === 'error';
  const canInteract = isRunning;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onFeed}
          disabled={!canInteract || isLoading}
          className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30"
          title="Feed (send a message)"
        >
          <Utensils className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onChat}
          disabled={!canInteract || isLoading}
          className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30"
          title="Chat"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          disabled={isLoading}
          className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Full variant with lifecycle controls
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {/* Interaction buttons */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onFeed}
        disabled={!canInteract || isLoading}
        className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30"
      >
        <Utensils className="h-4 w-4 mr-1" />
        Feed
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onChat}
        disabled={!canInteract || isLoading}
        className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30"
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        Chat
      </Button>

      {/* Lifecycle controls */}
      {isStopped && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStart}
          disabled={isLoading}
          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300"
        >
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
      )}

      {isRunning && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onPause}
            disabled={isLoading}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300"
          >
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            disabled={isLoading}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300"
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        </>
      )}

      {isPaused && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStart}
            disabled={isLoading}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 hover:text-emerald-300"
          >
            <Play className="h-4 w-4 mr-1" />
            Resume
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            disabled={isLoading}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300"
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
        </>
      )}

      {isError && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRestart}
          disabled={isLoading}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Restart
        </Button>
      )}

      {/* Settings always available */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onSettings}
        disabled={isLoading}
        className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
      >
        <Settings className="h-4 w-4 mr-1" />
        Settings
      </Button>
    </div>
  );
}
