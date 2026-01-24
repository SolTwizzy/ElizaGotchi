'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TamagotchiDevice, calculateDevicePositions } from './TamagotchiDevice';
import type { Agent, OrbitItem } from '@/lib/api';

interface SceneProps {
  agents: Agent[];
  selectedAgentId: string | null;
  viewMode: 'galaxy' | 'planet';
  latestMessage?: string;
  orbitItems?: OrbitItem[];
  allOrbitItems?: Record<string, OrbitItem[]>;
  launchAnimation?: { isActive: boolean; itemName: string };
  onSelectAgent: (agent: Agent) => void;
  onDeselectAgent: () => void;
  onFeed: (agent: Agent) => void;
  onChat: (agent: Agent) => void;
  onSettings: (agent: Agent) => void;
  onOrbitItemClick?: (item: OrbitItem) => void;
  onLaunchAnimationComplete?: () => void;
}

// Camera controller for smooth transitions
function CameraController({
  viewMode,
  targetPosition,
}: {
  viewMode: 'galaxy' | 'planet';
  targetPosition: [number, number, number] | null;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const positionRef = useRef(new THREE.Vector3(0, 8, 10));

  useFrame(() => {
    // Set target based on view mode
    if (viewMode === 'galaxy') {
      // Galaxy view: top-down angled view, pulled back to see all agents
      positionRef.current.set(0, 12, 16);
      targetRef.current.set(0, 0, 0);
    } else if (targetPosition) {
      // Planet view: camera positioned to view both planet and large device
      positionRef.current.set(0, 1, 8);
      targetRef.current.set(0, 0, 0);
    }

    // Smooth camera movement
    camera.position.lerp(positionRef.current, 0.05);

    // Update camera look target
    const currentTarget = new THREE.Vector3();
    camera.getWorldDirection(currentTarget);
    const lookTarget = targetRef.current.clone().sub(camera.position).normalize();
    currentTarget.lerp(lookTarget, 0.05);
    camera.lookAt(
      camera.position.x + currentTarget.x,
      camera.position.y + currentTarget.y,
      camera.position.z + currentTarget.z
    );
  });

  return null;
}

export default function Scene({
  agents,
  selectedAgentId,
  viewMode,
  latestMessage,
  orbitItems = [],
  allOrbitItems = {},
  launchAnimation,
  onSelectAgent,
  onDeselectAgent,
  onFeed,
  onChat,
  onSettings,
  onOrbitItemClick,
  onLaunchAnimationComplete,
}: SceneProps) {
  // Calculate positions for all devices (circular layout)
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
      camera={{ position: [0, 12, 16], fov: 50 }}
      style={{ background: 'linear-gradient(to bottom, #0a0a0f, #1a0a1f)' }}
    >
      <Suspense fallback={null}>
        {/* Camera animation controller */}
        <CameraController viewMode={viewMode} targetPosition={selectedPosition} />

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

        {/* Controls - zoom only in galaxy view, disabled in planet view */}
        <OrbitControls
          enablePan={false}
          enableZoom={viewMode === 'galaxy'}
          enableRotate={false}
          minDistance={8}
          maxDistance={35}
        />

        {/* Render Tamagotchi devices for each agent */}
        {agents.map((agent, index) => {
          const isSelected = selectedAgentId === agent.id;
          // In planet view, only show the selected agent
          if (viewMode === 'planet' && !isSelected) return null;

          return (
            <TamagotchiDevice
              key={agent.id}
              agent={agent}
              // In planet view, center the selected agent at origin
              position={viewMode === 'planet' ? [0, 0, 0] : positions[index]}
              isSelected={isSelected}
              viewMode={viewMode}
              showLabel={viewMode === 'galaxy'}
              latestMessage={isSelected ? latestMessage : undefined}
              orbitItems={isSelected ? orbitItems : (allOrbitItems[agent.id] || [])}
              launchAnimation={isSelected ? launchAnimation : undefined}
              onClick={() => onSelectAgent(agent)}
              onFeed={() => onFeed(agent)}
              onChat={() => onChat(agent)}
              onSettings={() => onSettings(agent)}
              onOrbitItemClick={onOrbitItemClick}
              onLaunchAnimationComplete={onLaunchAnimationComplete}
            />
          );
        })}

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
