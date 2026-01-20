'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { getAgentTheme } from './agent-environment';

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

interface AgentPanelHeaderProps {
  name: string;
  agentType: string;
  onClick: () => void;
  className?: string;
}

export function AgentPanelHeader({ name, agentType, onClick, className }: AgentPanelHeaderProps) {
  const theme = getAgentTheme(agentType);
  const icon = agentIcons[agentType] || '🤖';

  // Format agent type for display
  const formattedType = agentType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-4 py-3',
        'bg-black/20 hover:bg-black/30 transition-colors',
        'border-b border-white/10',
        'cursor-pointer group',
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="min-w-0 text-left">
          <h3 className="font-semibold text-white truncate text-sm">
            {name}
          </h3>
          <p className="text-xs text-white/50 truncate">
            {formattedType}
          </p>
        </div>
      </div>
      <ChevronRight
        className="h-5 w-5 text-white/40 group-hover:text-white/70 transition-all group-hover:translate-x-0.5 flex-shrink-0"
        style={{ color: theme.accentColor }}
      />
    </button>
  );
}
