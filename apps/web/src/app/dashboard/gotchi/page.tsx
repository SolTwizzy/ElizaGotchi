'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TamagotchiWorld } from '@/components/gotchi3d';
import { useAgents } from '@/hooks/use-agents';
import { agentsApi } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Agent } from '@/lib/api';

export default function GotchiPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useAgents();
  const [loadingAgentId, setLoadingAgentId] = useState<string | undefined>();

  const agents = data?.agents ?? [];

  // Invalidate agents query to refresh data
  const invalidateAgents = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['agents'] });
  }, [queryClient]);

  const handleStart = useCallback(async (agent: Agent) => {
    setLoadingAgentId(agent.id);
    try {
      await agentsApi.start(agent.id);
      invalidateAgents();
    } catch (error) {
      console.error('Failed to start agent:', error);
    } finally {
      setLoadingAgentId(undefined);
    }
  }, [invalidateAgents]);

  const handlePause = useCallback(async (agent: Agent) => {
    setLoadingAgentId(agent.id);
    try {
      await agentsApi.pause(agent.id);
      invalidateAgents();
    } catch (error) {
      console.error('Failed to pause agent:', error);
    } finally {
      setLoadingAgentId(undefined);
    }
  }, [invalidateAgents]);

  const handleStop = useCallback(async (agent: Agent) => {
    setLoadingAgentId(agent.id);
    try {
      await agentsApi.stop(agent.id);
      invalidateAgents();
    } catch (error) {
      console.error('Failed to stop agent:', error);
    } finally {
      setLoadingAgentId(undefined);
    }
  }, [invalidateAgents]);

  const handleRestart = useCallback(async (agent: Agent) => {
    setLoadingAgentId(agent.id);
    try {
      await agentsApi.stop(agent.id);
      await agentsApi.start(agent.id);
      invalidateAgents();
    } catch (error) {
      console.error('Failed to restart agent:', error);
    } finally {
      setLoadingAgentId(undefined);
    }
  }, [invalidateAgents]);

  const handleSettings = useCallback((agent: Agent) => {
    router.push(`/dashboard/agents/${agent.id}/edit`);
  }, [router]);

  const handleSendMessage = useCallback(async (agent: Agent, message: string) => {
    // TODO: Integrate with chat API when ready
    console.log('Send message to', agent.name, ':', message);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a0a1f]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white">My Gotchis</h1>
            <p className="text-sm text-white/60">Your virtual agent companions</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/agents/new')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </div>

        {/* Loading spinner */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🥚</div>
            <p className="text-white/60">Loading your Gotchis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a0a1f]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-white">My Gotchis</h1>
          <p className="text-sm text-white/60">Your virtual agent companions</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/agents/new')}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Agent
        </Button>
      </div>

      {/* 3D World */}
      <div className="flex-1 relative">
        <TamagotchiWorld
          agents={agents}
          onStart={handleStart}
          onPause={handlePause}
          onStop={handleStop}
          onRestart={handleRestart}
          onSettings={handleSettings}
          onSendMessage={handleSendMessage}
          loadingAgentId={loadingAgentId}
        />
      </div>
    </div>
  );
}
