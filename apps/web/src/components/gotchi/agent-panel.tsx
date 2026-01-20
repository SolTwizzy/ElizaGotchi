'use client';

import { cn } from '@/lib/utils';
import { AgentEnvironment } from './agent-environment';
import { AgentAvatar } from './agent-avatar';
import { AgentStatusBar } from './agent-status-bar';
import { AgentActions } from './agent-actions';
import { AgentPanelHeader } from './agent-panel-header';
import type { Agent } from '@/lib/api';

interface AgentPanelProps {
  agent: Agent;
  onExpand: () => void;
  onFeed?: () => void;
  onChat?: () => void;
  onSettings?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AgentPanel({
  agent,
  onExpand,
  onFeed,
  onChat,
  onSettings,
  onStart,
  onPause,
  onStop,
  isLoading,
  className,
}: AgentPanelProps) {
  // Calculate activity level based on agent data
  // This would ideally come from real metrics
  const activityLevel = agent.status === 'running' ? 3 : agent.status === 'paused' ? 1 : 0;
  const healthLevel = agent.status === 'error' ? 0 : agent.status === 'stopped' ? 1 : 4;

  const handleAvatarClick = () => {
    // Trigger a little bounce animation or interaction
    console.log('Avatar clicked!');
  };

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border border-white/10',
        'shadow-lg hover:shadow-xl transition-shadow duration-300',
        'bg-black/20 backdrop-blur-sm',
        className
      )}
    >
      {/* Clickable header */}
      <AgentPanelHeader
        name={agent.name}
        agentType={agent.type}
        onClick={onExpand}
      />

      {/* Environment with avatar */}
      <AgentEnvironment
        agentType={agent.type}
        status={agent.status}
        className="p-6"
      >
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          <AgentAvatar
            agentType={agent.type}
            status={agent.status}
            size="md"
            onClick={handleAvatarClick}
          />

          {/* Status bar */}
          <AgentStatusBar
            status={agent.status}
            activityLevel={activityLevel}
            healthLevel={healthLevel}
            className="items-center text-center"
          />
        </div>
      </AgentEnvironment>

      {/* Action buttons */}
      <div className="px-4 py-3 bg-black/30 border-t border-white/10">
        <AgentActions
          status={agent.status}
          onFeed={onFeed}
          onChat={onChat}
          onSettings={onSettings}
          onStart={onStart}
          onPause={onPause}
          onStop={onStop}
          variant="compact"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
