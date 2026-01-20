'use client';

import dynamic from 'next/dynamic';
import type { Agent } from '@/lib/api';

// Dynamically import the 3D scene with SSR disabled
// Three.js cannot run on the server
const Scene = dynamic(() => import('./Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-b from-[#0a0a0f] to-[#1a0a1f] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🥚</div>
        <p className="text-white/60 text-sm">Loading Tamagotchi World...</p>
      </div>
    </div>
  ),
});

interface TamagotchiCanvasProps {
  agents: Agent[];
  selectedAgentId: string | null;
  viewMode: 'galaxy' | 'planet';
  onSelectAgent: (agent: Agent) => void;
  onDeselectAgent: () => void;
  onFeed: (agent: Agent) => void;
  onChat: (agent: Agent) => void;
  onSettings: (agent: Agent) => void;
}

export function TamagotchiCanvas(props: TamagotchiCanvasProps) {
  return <Scene {...props} />;
}
