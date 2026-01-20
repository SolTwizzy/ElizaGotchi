'use client';

import { cn } from '@/lib/utils';
import { AgentPanel } from './agent-panel';
import type { Agent } from '@/lib/api';

interface AgentGridProps {
  agents: Agent[];
  onExpand: (agent: Agent) => void;
  onFeed?: (agent: Agent) => void;
  onChat?: (agent: Agent) => void;
  onSettings?: (agent: Agent) => void;
  onStart?: (agent: Agent) => void;
  onPause?: (agent: Agent) => void;
  onStop?: (agent: Agent) => void;
  loadingAgentId?: string;
  className?: string;
}

export function AgentGrid({
  agents,
  onExpand,
  onFeed,
  onChat,
  onSettings,
  onStart,
  onPause,
  onStop,
  loadingAgentId,
  className,
}: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-6xl mb-4">🥚</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Gotchis Yet</h3>
        <p className="text-white/60 text-center max-w-md">
          Deploy your first agent to see it here as a virtual pet!
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        className
      )}
    >
      {agents.map((agent) => (
        <AgentPanel
          key={agent.id}
          agent={agent}
          onExpand={() => onExpand(agent)}
          onFeed={onFeed ? () => onFeed(agent) : undefined}
          onChat={onChat ? () => onChat(agent) : undefined}
          onSettings={onSettings ? () => onSettings(agent) : undefined}
          onStart={onStart ? () => onStart(agent) : undefined}
          onPause={onPause ? () => onPause(agent) : undefined}
          onStop={onStop ? () => onStop(agent) : undefined}
          isLoading={loadingAgentId === agent.id}
        />
      ))}
    </div>
  );
}
