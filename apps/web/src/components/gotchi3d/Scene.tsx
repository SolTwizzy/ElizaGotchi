'use client';

import { Suspense, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { TamagotchiDevice, calculateDevicePositions } from './TamagotchiDevice';
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

  // Get selected agent position for camera focus
  const selectedPosition = useMemo(() => {
    if (!selectedAgentId) return null;
    const index = agents.findIndex((a) => a.id === selectedAgentId);
    if (index === -1) return null;
    return positions[index];
  }, [selectedAgentId, agents, positions]);

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ background: 'linear-gradient(to bottom, #0a0a0f, #1a0a1f)' }}
    >
      <Suspense fallback={null}>
        {/* Lighting */}
        <ambientLight intensity={0.4} color="#c084fc" />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#a78bfa" />
        <pointLight position={[-10, -5, -10]} intensity={0.5} color="#ec4899" />
        <pointLight position={[0, -10, 5]} intensity={0.3} color="#06b6d4" />

        {/* Star field */}
        <Stars
          radius={100}
          depth={50}
          count={3000}
          factor={4}
          fade
          speed={0.3}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={12}
          target={selectedPosition ? [selectedPosition[0], selectedPosition[1], 0] : [0, 0, 0]}
        />

        {/* Render Tamagotchi devices for each agent */}
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

        {/* Empty state - show a faint egg */}
        {agents.length === 0 && (
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#4a5568" wireframe opacity={0.3} transparent />
          </mesh>
        )}
      </Suspense>
    </Canvas>
  );
}
