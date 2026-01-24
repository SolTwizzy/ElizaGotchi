'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { TamagotchiCanvas } from './TamagotchiCanvas';
import { SoundProvider, useSound } from './SoundManager';
import { AgentChatArea } from '../gotchi/agent-chat-area';
import { HarvestOverlay } from './HarvestOverlay';
import { SendToOrbitModal } from './SendToOrbitModal';
import { OrbitItemModal } from './OrbitItemModal';
import { getPlanetForAgentType } from './planets';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, Play, Pause, Square, RotateCcw, Settings, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentChat } from '@/hooks/use-agent-chat';
import { useOrbitItems, useAllAgentsOrbitItems } from '@/hooks/use-orbit-items';
import type { Agent, OrbitItem } from '@/lib/api';

// UI display name overrides (temporary until database is updated)
const getDisplayName = (name: string): string => {
  const overrides: Record<string, string> = {
    'Naruto Lore Keeper': 'Anime Lore Keeper',
  };
  return overrides[name] || name;
};

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
  const [viewMode, setViewMode] = useState<'galaxy' | 'planet'>('galaxy');
  const [showChat, setShowChat] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [harvestQuery, setHarvestQuery] = useState('');
  const [showSendToOrbitModal, setShowSendToOrbitModal] = useState(false);
  const [selectedOrbitItem, setSelectedOrbitItem] = useState<OrbitItem | null>(null);
  const [launchAnimation, setLaunchAnimation] = useState<{ isActive: boolean; itemName: string }>({
    isActive: false,
    itemName: '',
  });
  const { playSound } = useSound();

  // Chat hook - connected to the selected agent
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    clearMessages,
    isLoading: isChatLoading,
    error: chatError,
  } = useAgentChat(selectedAgent?.id ?? null);

  // Orbit items hook - connected to the selected agent
  const { data: orbitItems = [] } = useOrbitItems(selectedAgent?.id ?? null);

  // Fetch orbit items for ALL agents (for galaxy view)
  const agentIds = agents.map((a) => a.id);
  const { data: allOrbitItems } = useAllAgentsOrbitItems(agentIds);

  // Clear messages when deselecting agent
  useEffect(() => {
    if (!selectedAgent) {
      clearMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent?.id]);

  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setViewMode('planet');
    playSound('click');
  }, [playSound]);

  const handleDeselectAgent = useCallback(() => {
    setSelectedAgent(null);
    setViewMode('galaxy');
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

  // Handle sending message with harvest animation
  const handleSendMessage = useCallback((agent: Agent, message: string) => {
    setHarvestQuery(message);
    setIsHarvesting(true);
    playSound('start');
  }, [playSound]);

  const handleHarvestComplete = useCallback((result: string) => {
    setIsHarvesting(false);
    if (selectedAgent) {
      onSendMessage(selectedAgent, harvestQuery);
    }
    playSound('happy');
  }, [selectedAgent, harvestQuery, onSendMessage, playSound]);

  const handleHarvestCancel = useCallback(() => {
    setIsHarvesting(false);
    setHarvestQuery('');
    playSound('click');
  }, [playSound]);

  // Orbit handlers
  const handleSendToOrbit = useCallback(() => {
    if (chatMessages.length > 0) {
      setShowSendToOrbitModal(true);
      playSound('click');
    }
  }, [chatMessages.length, playSound]);

  const handleOrbitItemClick = useCallback((item: OrbitItem) => {
    setSelectedOrbitItem(item);
    playSound('click');
  }, [playSound]);

  const handleOrbitModalClose = useCallback(() => {
    setSelectedOrbitItem(null);
  }, []);

  const handleSendToOrbitSuccess = useCallback((itemName: string) => {
    // Start the launch animation
    setLaunchAnimation({ isActive: true, itemName });
    playSound('start');
  }, [playSound]);

  const handleLaunchAnimationComplete = useCallback(() => {
    setLaunchAnimation({ isActive: false, itemName: '' });
    playSound('happy');
  }, [playSound]);

  // Update selected agent if it changes in the agents array
  const currentSelectedAgent = selectedAgent
    ? agents.find((a) => a.id === selectedAgent.id) || null
    : null;

  // Get the latest assistant message for speech bubble (with welcome message fallback)
  const latestAssistantMessage = useMemo(() => {
    const assistantMessages = chatMessages.filter((m) => m.role === 'assistant');
    if (assistantMessages.length > 0) {
      return assistantMessages[assistantMessages.length - 1].content;
    }
    // Show welcome message when no chat history
    if (currentSelectedAgent) {
      return `Hey there! I'm ${getDisplayName(currentSelectedAgent.name)}. How can I help you today?`;
    }
    return undefined;
  }, [chatMessages, currentSelectedAgent]);

  return (
    <div className="absolute inset-0">
      {/* 3D Canvas - takes full space */}
      <div className="absolute inset-0">
        <TamagotchiCanvas
          agents={agents}
          selectedAgentId={currentSelectedAgent?.id || null}
          viewMode={viewMode}
          latestMessage={showSendToOrbitModal || selectedOrbitItem ? undefined : latestAssistantMessage}
          orbitItems={showSendToOrbitModal || selectedOrbitItem ? [] : orbitItems}
          allOrbitItems={showSendToOrbitModal || selectedOrbitItem ? {} : allOrbitItems}
          onSelectAgent={handleSelectAgent}
          onDeselectAgent={handleDeselectAgent}
          onFeed={handleFeed}
          onChat={handleChat}
          onSettings={handleSettingsClick}
          onOrbitItemClick={handleOrbitItemClick}
          launchAnimation={launchAnimation}
          onLaunchAnimationComplete={handleLaunchAnimationComplete}
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
              <h3 className="font-semibold text-white">{getDisplayName(currentSelectedAgent.name)}</h3>
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

          {/* Planet info */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${getPlanetForAgentType(currentSelectedAgent.type).color}, ${getPlanetForAgentType(currentSelectedAgent.type).atmosphereColor})`,
                  boxShadow: `0 0 10px ${getPlanetForAgentType(currentSelectedAgent.type).emissive}`,
                }}
              >
                <span className="text-sm">🪐</span>
              </div>
              <div>
                <div className="text-xs text-purple-400 uppercase tracking-wider">Home Planet</div>
                <div className="text-sm font-medium text-white">
                  {getPlanetForAgentType(currentSelectedAgent.type).name}
                </div>
              </div>
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                  onClick={handleSendToOrbit}
                  disabled={chatMessages.length === 0}
                  title={chatMessages.length === 0 ? 'Start a conversation first' : 'Save this chat to orbit'}
                >
                  <Rocket className="w-4 h-4" />
                  Send to Orbit
                </Button>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 h-[calc(100%-250px)]">
            <AgentChatArea
              agentType={currentSelectedAgent.type}
              agentName={getDisplayName(currentSelectedAgent.name)}
              status={currentSelectedAgent.status}
              messages={chatMessages}
              onSendMessage={sendChatMessage}
              isLoading={isChatLoading}
            />
          </div>
        </div>
      )}

      {/* Harvest Overlay - fullscreen planet travel animation */}
      {currentSelectedAgent && (
        <HarvestOverlay
          isActive={isHarvesting}
          agentType={currentSelectedAgent.type}
          agentName={getDisplayName(currentSelectedAgent.name)}
          query={harvestQuery}
          onComplete={handleHarvestComplete}
          onCancel={handleHarvestCancel}
        />
      )}

      {/* Instructions overlay (when no agent selected) */}
      {!currentSelectedAgent && agents.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-white/40 text-sm text-center">
            Click a device to interact with your Gotchi
          </p>
        </div>
      )}

      {/* Send to Orbit Modal */}
      {currentSelectedAgent && (
        <SendToOrbitModal
          isOpen={showSendToOrbitModal}
          onClose={() => setShowSendToOrbitModal(false)}
          agentId={currentSelectedAgent.id}
          agentName={getDisplayName(currentSelectedAgent.name)}
          messages={chatMessages}
          onSuccess={handleSendToOrbitSuccess}
        />
      )}

      {/* Orbit Item Modal */}
      {currentSelectedAgent && (
        <OrbitItemModal
          isOpen={selectedOrbitItem !== null}
          onClose={handleOrbitModalClose}
          item={selectedOrbitItem}
          agentId={currentSelectedAgent.id}
          agentName={getDisplayName(currentSelectedAgent.name)}
        />
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
