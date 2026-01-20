'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { DeviceShell } from './DeviceShell';
import { DeviceScreen } from './DeviceScreen';
import { DeviceButtons } from './DeviceButtons';
import { getAgentColors } from './sprites/pixelSprites';
import { useSound } from './SoundManager';
import type { Agent } from '@/lib/api';

interface TamagotchiDeviceProps {
  agent: Agent;
  position: [number, number, number];
  isSelected: boolean;
  onClick: () => void;
  onFeed: () => void;
  onChat: () => void;
  onSettings: () => void;
}

export function TamagotchiDevice({
  agent,
  position,
  isSelected,
  onClick,
  onFeed,
  onChat,
  onSettings,
}: TamagotchiDeviceProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { playSound } = useSound();

  // Get colors based on agent type
  const colors = useMemo(() => getAgentColors(agent.type), [agent.type]);

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

  // Floating animation
  useFrame((state) => {
    if (groupRef.current && !isSelected) {
      // Gentle floating motion
      const baseY = position[1];
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.8 + position[0] * 2) * 0.05;
      groupRef.current.position.y = baseY + floatOffset;

      // Subtle rotation wobble
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + position[1]) * 0.05;
    } else if (groupRef.current && isSelected) {
      // Face camera when selected
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
    }

    // Shake animation for error status
    if (groupRef.current && agent.status === 'error') {
      const shake = Math.sin(state.clock.elapsedTime * 20) * 0.01;
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

      {/* Name label (3D text would be better, using HTML overlay instead) */}
      {/* Agent name shown in HTML overlay when selected */}
    </group>
  );
}

// Helper to calculate device positions in a grid/circle layout
export function calculateDevicePositions(count: number): [number, number, number][] {
  const positions: [number, number, number][] = [];

  if (count === 1) {
    positions.push([0, 0, 0]);
  } else if (count === 2) {
    positions.push([-1.2, 0, 0]);
    positions.push([1.2, 0, 0]);
  } else if (count === 3) {
    positions.push([-1.5, 0.5, 0]);
    positions.push([1.5, 0.5, 0]);
    positions.push([0, -0.8, 0]);
  } else if (count === 4) {
    positions.push([-1.5, 0.8, 0]);
    positions.push([1.5, 0.8, 0]);
    positions.push([-1.5, -0.8, 0]);
    positions.push([1.5, -0.8, 0]);
  } else {
    // Arrange in rows for more devices
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const spacing = 2;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = (col - (cols - 1) / 2) * spacing;
      const y = ((rows - 1) / 2 - row) * spacing * 0.8;
      positions.push([x, y, 0]);
    }
  }

  return positions;
}
