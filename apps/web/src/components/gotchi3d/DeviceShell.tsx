'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DeviceShellProps {
  color: string;
  glowColor: string;
  hovered: boolean;
  status: string;
}

export function DeviceShell({ color, glowColor, hovered, status }: DeviceShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Create egg-shaped geometry using LatheGeometry
  const eggGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 40;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Egg curve: wider at bottom, narrower at top
      const y = t * 0.6 - 0.3; // Height from -0.3 to 0.3
      // Egg profile using a modified sine curve
      const r = 0.22 * Math.sin(Math.PI * t) * (1 - 0.3 * t); // Wider at bottom
      points.push(new THREE.Vector2(Math.max(0.01, r), y));
    }

    return new THREE.LatheGeometry(points, 32);
  }, []);

  // Slightly larger shell for glow effect
  const glowGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 40;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = t * 0.62 - 0.31;
      const r = 0.24 * Math.sin(Math.PI * t) * (1 - 0.3 * t);
      points.push(new THREE.Vector2(Math.max(0.01, r), y));
    }

    return new THREE.LatheGeometry(points, 32);
  }, []);

  // Animate glow based on hover/status
  useFrame((state) => {
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.2;

      if (status === 'error') {
        material.opacity = 0.4 + pulse;
      } else if (status === 'starting') {
        material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
      } else if (hovered) {
        material.opacity = 0.25;
      } else if (status === 'running') {
        material.opacity = 0.15 + pulse * 0.5;
      } else {
        material.opacity = 0;
      }
    }
  });

  // Get shell color based on status
  const shellColor = useMemo(() => {
    if (status === 'stopped' || status === 'pending') {
      return '#4b5563'; // Gray for inactive
    }
    if (status === 'error') {
      return '#dc2626'; // Red for error
    }
    return color;
  }, [color, status]);

  const emissiveColor = useMemo(() => {
    if (status === 'error') return '#ef4444';
    if (hovered || status === 'running') return glowColor;
    return '#000000';
  }, [hovered, status, glowColor]);

  return (
    <group>
      {/* Main shell */}
      <mesh ref={meshRef} geometry={eggGeometry}>
        <meshStandardMaterial
          color={shellColor}
          roughness={0.3}
          metalness={0.1}
          emissive={emissiveColor}
          emissiveIntensity={hovered ? 0.3 : status === 'running' ? 0.15 : 0}
        />
      </mesh>

      {/* Glow shell (slightly larger, transparent) */}
      <mesh ref={glowRef} geometry={glowGeometry}>
        <meshBasicMaterial
          color={status === 'error' ? '#ef4444' : glowColor}
          transparent
          opacity={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Screen cutout frame (darker ring around screen area) */}
      <mesh position={[0, 0.08, 0.18]} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.11, 0.13, 32]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}
