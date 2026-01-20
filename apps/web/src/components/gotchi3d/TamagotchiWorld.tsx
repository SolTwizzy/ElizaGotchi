'use client';

import { useState, useCallback } from 'react';
import { TamagotchiCanvas } from './TamagotchiCanvas';
import { SoundProvider, useSound } from './SoundManager';
import { AgentChatArea } from '../gotchi/agent-chat-area';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, Play, Pause, Square, RotateCcw, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/lib/api';

interface TamagotchiWorldProps {
  agents: Agent[];
  onStart: (agent: Agent) => void;
  onPause: (agent: Agent) => void;
  onStop: (agent: Agent) => void;
  onRestart: (agent: Agent) => void;
  onSettings: (agent: Agent) => void;
  onSendMessage: (agent: Agent, message: string) => void;
  loadingAgentId?: string;
}

function TamagotchiWorldInner({
  agents,
  onStart,
  onPause,
  onStop,
  onRestart,
  onSettings,
  onSendMessage,
  loadingAgentId,
}: TamagotchiWorldProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { playSound } = useSound();

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    playSound('click');
  }, [playSound]);

  const handleDeselectAgent = useCallback(() => {
    setSelectedAgent(null);
    setShowChat(false);
    playSound('click');
  }, [playSound]);

  const handleFeed = useCallback((agent: Agent) => {
    playSound('feed');
    // Feed action - could show a notification or animation
  }, [playSound]);

  const handleChat = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setShowChat(true);
    playSound('click');
  }, [playSound]);

  const handleSettingsClick = useCallback((agent: Agent) => {
    playSound('click');
    onSettings(agent);
  }, [playSound, onSettings]);

  const handleStart = useCallback(() => {
    if (selectedAgent) {
      playSound('start');
      onStart(selectedAgent);
    }
  }, [selectedAgent, onStart, playSound]);

  const handlePause = useCallback(() => {
    if (selectedAgent) {
      playSound('click');
      onPause(selectedAgent);
    }
  }, [selectedAgent, onPause, playSound]);

  const handleStop = useCallback(() => {
    if (selectedAgent) {
      playSound('stop');
      onStop(selectedAgent);
    }
  }, [selectedAgent, onStop, playSound]);

  const handleRestart = useCallback(() => {
    if (selectedAgent) {
      playSound('start');
      onRestart(selectedAgent);
    }
  }, [selectedAgent, onRestart, playSound]);

  // Update selected agent if it changes in the agents array
  const currentSelectedAgent = selectedAgent
    ? agents.find((a) => a.id === selectedAgent.id) || null
    : null;

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {/* 3D Canvas - takes full space */}
      <div className="absolute inset-0">
        <TamagotchiCanvas
          agents={agents}
          selectedAgentId={currentSelectedAgent?.id || null}
          onSelectAgent={handleSelectAgent}
          onDeselectAgent={handleDeselectAgent}
          onFeed={handleFeed}
          onChat={handleChat}
          onSettings={handleSettingsClick}
        />
      </div>

      {/* Empty state overlay */}
      {agents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-8xl mb-6">🥚</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Gotchis Yet</h2>
            <p className="text-white/60 max-w-md">
              Deploy your first agent to see it hatch into a virtual pet!
            </p>
          </div>
        </div>
      )}

      {/* Selected agent panel (HTML overlay) */}
      {currentSelectedAgent && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-full md:w-96 bg-black/80 backdrop-blur-lg border-l border-white/10',
            'transform transition-transform duration-300',
            showChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-80'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <button
              onClick={handleDeselectAgent}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            <div className="text-center">
              <h3 className="font-semibold text-white">{currentSelectedAgent.name}</h3>
              <p className="text-xs text-white/50 capitalize">
                {currentSelectedAgent.type.replace(/-/g, ' ')}
              </p>
            </div>
            <button
              onClick={() => handleSettingsClick(currentSelectedAgent)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Status */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-sm">Status</span>
              <span
                className={cn(
                  'text-sm font-medium px-2 py-0.5 rounded-full',
                  currentSelectedAgent.status === 'running' && 'bg-emerald-500/20 text-emerald-400',
                  currentSelectedAgent.status === 'paused' && 'bg-amber-500/20 text-amber-400',
                  currentSelectedAgent.status === 'stopped' && 'bg-gray-500/20 text-gray-400',
                  currentSelectedAgent.status === 'error' && 'bg-red-500/20 text-red-400',
                  currentSelectedAgent.status === 'starting' && 'bg-blue-500/20 text-blue-400',
                  currentSelectedAgent.status === 'pending' && 'bg-gray-500/20 text-gray-400'
                )}
              >
                {currentSelectedAgent.status}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {(currentSelectedAgent.status === 'stopped' ||
                currentSelectedAgent.status === 'pending') && (
                <Button
                  size="sm"
                  onClick={handleStart}
                  disabled={loadingAgentId === currentSelectedAgent.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </Button>
              )}
              {currentSelectedAgent.status === 'running' && (
                <Button
                  size="sm"
                  onClick={handlePause}
                  disabled={loadingAgentId === currentSelectedAgent.id}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                >
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </Button>
              )}
              {currentSelectedAgent.status === 'paused' && (
                <Button
                  size="sm"
                  onClick={handleStart}
                  disabled={loadingAgentId === currentSelectedAgent.id}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </Button>
              )}
              {(currentSelectedAgent.status === 'running' ||
                currentSelectedAgent.status === 'paused') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStop}
                  disabled={loadingAgentId === currentSelectedAgent.id}
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                >
                  <Square className="w-4 h-4" />
                </Button>
              )}
              {currentSelectedAgent.status === 'error' && (
                <Button
                  size="sm"
                  onClick={handleRestart}
                  disabled={loadingAgentId === currentSelectedAgent.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Restart
                </Button>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 h-[calc(100%-200px)]">
            <AgentChatArea
              agentId={currentSelectedAgent.id}
              agentName={currentSelectedAgent.name}
              status={currentSelectedAgent.status}
              onSendMessage={(msg) => onSendMessage(currentSelectedAgent, msg)}
            />
          </div>
        </div>
      )}

      {/* Instructions overlay (when no agent selected) */}
      {!currentSelectedAgent && agents.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-white/40 text-sm text-center">
            Click a device to interact with your Gotchi
          </p>
        </div>
      )}
    </div>
  );
}

export function TamagotchiWorld(props: TamagotchiWorldProps) {
  return (
    <SoundProvider>
      <TamagotchiWorldInner {...props} />
    </SoundProvider>
  );
}
