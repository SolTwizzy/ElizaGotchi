'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { AgentEnvironment, getAgentTheme } from './agent-environment';
import { AgentAvatar } from './agent-avatar';
import { AgentStatusBar } from './agent-status-bar';
import { AgentActions } from './agent-actions';
import { AgentChatArea } from './agent-chat-area';
import type { Agent } from '@/lib/api';

// Emoji icons for each agent type
const agentIcons: Record<string, string> = {
  'whale-watcher': '🐋',
  'portfolio-tracker': '📊',
  'airdrop-hunter': '🎁',
  'gas-monitor': '⛽',
  'treasury-watcher': '🏛️',
  'contract-monitor': '📜',
  'market-scanner': '📰',
  'reading-list-manager': '📚',
  'github-issue-triager': '🔖',
  'bug-reporter': '🐛',
  'changelog-writer': '📝',
  'community-manager': '👥',
  'lore-keeper': '📜',
};

interface AgentExpandedProps {
  agent: Agent;
  onBack: () => void;
  onSettings?: () => void;
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  onSendMessage?: (content: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function AgentExpanded({
  agent,
  onBack,
  onSettings,
  onStart,
  onPause,
  onStop,
  onRestart,
  onSendMessage,
  isLoading,
  className,
}: AgentExpandedProps) {
  const theme = getAgentTheme(agent.type);
  const icon = agentIcons[agent.type] || '🤖';

  // Calculate levels
  const activityLevel = agent.status === 'running' ? 3 : agent.status === 'paused' ? 1 : 0;
  const healthLevel = agent.status === 'error' ? 0 : agent.status === 'stopped' ? 1 : 4;

  // Calculate age
  const createdDate = new Date(agent.createdAt);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageText = ageInDays === 0 ? 'Born today' : ageInDays === 1 ? '1 day old' : `${ageInDays} days old`;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        'bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e]',
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div>
              <h1 className="font-semibold text-white">{agent.name}</h1>
              <p className="text-xs text-white/50">{ageText}</p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left side - Avatar and stats */}
        <div className="lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/10">
          <AgentEnvironment
            agentType={agent.type}
            status={agent.status}
            className="h-full flex flex-col items-center justify-center p-8"
          >
            {/* Large avatar */}
            <AgentAvatar
              agentType={agent.type}
              status={agent.status}
              size="lg"
              className="mb-6"
            />

            {/* Status meters */}
            <div className="w-full max-w-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Activity</span>
                <AgentStatusBar
                  status={agent.status}
                  activityLevel={activityLevel}
                  healthLevel={4}
                  className="flex-row items-center gap-2"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Health</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-sm',
                        i < healthLevel ? 'text-pink-500' : 'text-white/20'
                      )}
                    >
                      {i < healthLevel ? '♥' : '♡'}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Level</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-xs',
                        i < 3 ? 'text-amber-400' : 'text-white/20'
                      )}
                    >
                      {i < 3 ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 w-full max-w-xs">
              <AgentActions
                status={agent.status}
                onStart={onStart}
                onPause={onPause}
                onStop={onStop}
                onRestart={onRestart}
                onSettings={onSettings}
                variant="full"
                isLoading={isLoading}
              />
            </div>
          </AgentEnvironment>
        </div>

        {/* Right side - Chat area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <AgentChatArea
            agentType={agent.type}
            agentName={agent.name}
            status={agent.status}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
