'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { DeviceShell } from './DeviceShell';
import { DeviceScreen } from './DeviceScreen';
import { DeviceButtons } from './DeviceButtons';
import { SpeechBubble } from './SpeechBubble';
import { getAgentColors } from './sprites/pixelSprites';
import { useSound } from './SoundManager';
import { Planet, getPlanetForAgentType } from './planets';
import { FloatingLabel } from './FloatingLabel';
import type { Agent } from '@/lib/api';

interface TamagotchiDeviceProps {
  agent: Agent;
  position: [number, number, number];
  isSelected: boolean;
  viewMode: 'galaxy' | 'planet';
  showLabel?: boolean;
  latestMessage?: string;
  onClick: () => void;
  onFeed: () => void;
  onChat: () => void;
  onSettings: () => void;
}

export function TamagotchiDevice({
  agent,
  position,
  isSelected,
  viewMode,
  showLabel = true,
  latestMessage,
  onClick,
  onFeed,
  onChat,
  onSettings,
}: TamagotchiDeviceProps) {
  const isPlanetView = viewMode === 'planet';
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { playSound } = useSound();

  // Get colors based on agent type
  const colors = useMemo(() => getAgentColors(agent.type), [agent.type]);

  // Get planet configuration for this agent type
  const planetConfig = useMemo(() => getPlanetForAgentType(agent.type), [agent.type]);

  // Calculate health and activity levels based on status
  const healthLevel = useMemo(() => {
    switch (agent.status) {
      case 'running':
        return 4;
      case 'paused':
        return 3;
      case 'stopped':
      case 'pending':
        return 1;
      case 'error':
        return 0;
      default:
        return 2;
    }
  }, [agent.status]);

  const activityLevel = useMemo(() => {
    switch (agent.status) {
      case 'running':
        return 3;
      case 'paused':
        return 1;
      case 'stopped':
      case 'pending':
        return 0;
      case 'starting':
        return 2;
      default:
        return 1;
    }
  }, [agent.status]);

  // Floating animation - only in galaxy view, keep stable in planet view
  useFrame((state) => {
    if (!groupRef.current) return;

    if (isPlanetView) {
      // Planet view: keep device completely stable, face camera
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.15);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.15);
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, position[0], 0.1);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1], 0.1);
    } else if (!isSelected) {
      // Galaxy view (not selected): gentle floating motion
      const baseY = position[1];
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.8 + position[0] * 2) * 0.04;
      groupRef.current.position.y = baseY + floatOffset;

      // Very subtle Y rotation only (no X rotation - it causes forward/backward appearance)
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4 + position[0]) * 0.05;
      groupRef.current.rotation.x = 0;
    } else {
      // Galaxy view (selected): face camera smoothly
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
    }

    // Error shake - only in galaxy view, gentler
    if (agent.status === 'error' && !isPlanetView) {
      const shake = Math.sin(state.clock.elapsedTime * 8) * 0.008;
      groupRef.current.position.x = position[0] + shake;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isSelected) {
      playSound('click');
      onClick();
    }
  };

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Floating label above the device (hidden in planet view) */}
      {showLabel && (
        <FloatingLabel
          name={agent.name}
          agentType={agent.type}
          planetName={planetConfig.name}
          position={[0, 1.3, 0]}
          isSelected={isSelected}
          status={agent.status}
        />
      )}

      {/* Planet - large and to the left in planet view, small beside device in galaxy view */}
      <Planet
        config={planetConfig}
        position={isPlanetView ? [-5.5, 0, -2] : [1.2, 0, 0]}
        scale={isPlanetView ? 1.4 : (isSelected ? 1.2 : 0.8)}
        isActive={isSelected}
      />

      {/* Device group - larger in planet view for visibility */}
      <group position={isPlanetView ? [0, 0, 0] : [0, 0, 0]} scale={isPlanetView ? 2.5 : 1}>
        {/* Main shell */}
        <DeviceShell
          color={colors.shell}
          glowColor={colors.glow}
          hovered={hovered}
          status={agent.status}
        />

        {/* LCD Screen */}
        <DeviceScreen
          status={agent.status}
          agentType={agent.type}
          healthLevel={healthLevel}
          activityLevel={activityLevel}
        />

        {/* Control buttons */}
        <DeviceButtons
          onAClick={onFeed}
          onBClick={onChat}
          onCClick={onSettings}
          disabled={!isSelected}
        />
      </group>

      {/* Speech bubble - outside scaled group to render correctly */}
      {isPlanetView && latestMessage && (
        <SpeechBubble
          message={latestMessage}
          position={[2.5, 1.5, 0]}
          maxWidth={220}
        />
      )}
    </group>
  );
}

// Helper to calculate device positions in a circular orbit layout
export function calculateDevicePositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];

  if (count === 0) return positions;

  if (count === 1) {
    // Single agent at center
    positions.push([0, 0, 0]);
  } else if (count <= 6) {
    // Small number: single ring with wide spacing
    const radius = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2; // Start from top
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push([x, 0, z]);
    }
  } else {
    // Larger numbers: two rings with wide spacing
    const innerCount = Math.ceil(count / 2);
    const outerCount = count - innerCount;
    const innerRadius = 4;
    const outerRadius = 8;

    // Inner ring
    for (let i = 0; i < innerCount; i++) {
      const angle = (i / innerCount) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * innerRadius;
      positions.push([x, 0, z]);
    }

    // Outer ring (offset by half step for better spacing)
    for (let i = 0; i < outerCount; i++) {
      const angle = (i / outerCount) * Math.PI * 2 - Math.PI / 2 + Math.PI / outerCount;
      const x = Math.cos(angle) * outerRadius;
      const z = Math.sin(angle) * outerRadius;
      positions.push([x, 0, z]);
    }
  }

  return positions;
}
