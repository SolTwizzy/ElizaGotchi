'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingLabelProps {
  name: string;
  agentType: string;
  planetName: string;
  position: [number, number, number];
  isSelected?: boolean;
  status?: string;
}

// Status color mapping
const STATUS_COLORS: Record<string, string> = {
  running: '#22c55e',
  paused: '#eab308',
  stopped: '#6b7280',
  error: '#ef4444',
  starting: '#3b82f6',
};

export function FloatingLabel({
  name,
  agentType,
  planetName,
  position,
  isSelected,
  status = 'stopped',
}: FloatingLabelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.03;
    }
  });

  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.stopped;
  const formattedType = agentType.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <group ref={groupRef} position={position}>
      {/* Use HTML for crisp text rendering */}
      <Html
        center
        distanceFactor={15}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          className={`
            flex flex-col items-center gap-0.5 px-2 py-1 rounded-md
            transition-all duration-300 transform
            ${isSelected ? 'scale-105' : 'scale-100'}
          `}
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(236, 72, 153, 0.9))'
              : 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: isSelected
              ? '0 0 12px rgba(168, 85, 247, 0.4)'
              : '0 2px 6px rgba(0, 0, 0, 0.3)',
            fontSize: '10px',
          }}
        >
          {/* Agent name */}
          <div className="text-white font-semibold" style={{ fontSize: '11px' }}>
            {name}
          </div>

          {/* Status indicator - compact inline */}
          <div className="flex items-center gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span
              className="capitalize"
              style={{ color: statusColor, fontSize: '9px' }}
            >
              {status}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// Simplified 3D text version (alternative for performance)
export function FloatingLabel3D({
  name,
  agentType,
  position,
  isSelected,
}: Omit<FloatingLabelProps, 'planetName' | 'status'>) {
  const textRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.03;
      // Billboard effect - always face camera
      textRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={0.15}
      color={isSelected ? '#ec4899' : '#ffffff'}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.01}
      outlineColor="#000000"
    >
      {name}
    </Text>
  );
}
