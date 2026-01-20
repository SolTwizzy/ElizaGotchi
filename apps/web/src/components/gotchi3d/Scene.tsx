'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { CosmicBackground } from './CosmicBackground';
import { TamagotchiDevice, calculateDevicePositions } from './TamagotchiDevice';
import { CameraController } from './CameraController';
import type { Agent } from '@/lib/api';

interface SceneProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agent: Agent) => void;
  onDeselectAgent: () => void;
  onFeed: (agent: Agent) => void;
  onChat: (agent: Agent) => void;
  onSettings: (agent: Agent) => void;
}

export default function Scene({
  agents,
  selectedAgentId,
  onSelectAgent,
  onDeselectAgent,
  onFeed,
  onChat,
  onSettings,
}: SceneProps) {
  // Calculate positions for all devices
  const positions = useMemo(
    () => calculateDevicePositions(agents.length),
    [agents.length]
  );

  // Get selected agent position for camera
  const selectedPosition = useMemo(() => {
    if (!selectedAgentId) return null;
    const index = agents.findIndex((a) => a.id === selectedAgentId);
    if (index === -1) return null;
    return positions[index];
  }, [selectedAgentId, agents, positions]);

  // Handle background click to deselect
  const handleBackgroundClick = useCallback(() => {
    if (selectedAgentId) {
      onDeselectAgent();
    }
  }, [selectedAgentId, onDeselectAgent]);

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ background: 'linear-gradient(to bottom, #0a0a0f, #1a0a1f)' }}
      onClick={handleBackgroundClick}
    >
      <Suspense fallback={null}>
        {/* Background elements */}
        <CosmicBackground />

        {/* Camera controller */}
        <CameraController
          selectedPosition={selectedPosition}
          onDeselect={onDeselectAgent}
        />

        {/* Render all Tamagotchi devices */}
        {agents.map((agent, index) => (
          <TamagotchiDevice
            key={agent.id}
            agent={agent}
            position={positions[index]}
            isSelected={selectedAgentId === agent.id}
            onClick={() => onSelectAgent(agent)}
            onFeed={() => onFeed(agent)}
            onChat={() => onChat(agent)}
            onSettings={() => onSettings(agent)}
          />
        ))}

        {/* Post-processing effects */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.5}
            radius={0.8}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
