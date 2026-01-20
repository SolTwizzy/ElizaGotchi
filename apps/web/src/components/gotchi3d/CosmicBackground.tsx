'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

export function CosmicBackground() {
  const particlesRef = useRef<THREE.Points>(null);

  // Create floating particles
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return positions;
  }, []);

  // Animate particles rotation
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <>
      {/* Ambient lighting - soft purple/pink tint */}
      <ambientLight intensity={0.3} color="#c084fc" />

      {/* Key lights with color */}
      <pointLight
        position={[10, 10, 10]}
        intensity={0.6}
        color="#a78bfa"
        distance={50}
      />
      <pointLight
        position={[-10, -5, -10]}
        intensity={0.4}
        color="#ec4899"
        distance={40}
      />
      <pointLight
        position={[0, -10, 5]}
        intensity={0.3}
        color="#06b6d4"
        distance={30}
      />

      {/* Star field */}
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Floating particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#a855f7"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Subtle fog for depth */}
      <fog attach="fog" args={['#0a0a0f', 15, 40]} />
    </>
  );
}
