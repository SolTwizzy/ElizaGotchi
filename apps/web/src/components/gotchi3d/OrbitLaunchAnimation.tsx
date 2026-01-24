'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface OrbitLaunchAnimationProps {
  isActive: boolean;
  itemName: string;
  onComplete?: () => void;
}

// Easing function for smooth motion
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function OrbitLaunchAnimation({
  isActive,
  itemName,
  onComplete,
}: OrbitLaunchAnimationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'compact' | 'fly' | 'done'>('compact');

  // Trail positions for sparkle effect
  const trailPositions = useMemo(() => new Float32Array(30 * 3), []);
  const trailRef = useRef<THREE.Points>(null);

  // Start position (speech bubble area) and end position (planet orbit)
  const startPos = useMemo(() => new THREE.Vector3(2.5, 1.5, 0), []);
  const endPos = useMemo(() => new THREE.Vector3(-5.5, 0.5, -1), []); // Near planet

  // Reset when animation starts
  useEffect(() => {
    if (isActive) {
      setProgress(0);
      setPhase('compact');
      // Reset trail
      trailPositions.fill(0);
    }
  }, [isActive, trailPositions]);

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current || phase === 'done') return;

    const newProgress = Math.min(progress + delta * 1.2, 1);
    setProgress(newProgress);

    if (phase === 'compact') {
      // Phase 1: Compact animation (shrink the "speech bubble" into a ball)
      const compactProgress = Math.min(newProgress * 3, 1); // 0-0.33 of total time
      const scale = 1 - easeOutCubic(compactProgress) * 0.7; // Shrink to 30%
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.copy(startPos);

      if (compactProgress >= 1) {
        setPhase('fly');
        setProgress(0.33);
      }
    } else if (phase === 'fly') {
      // Phase 2: Fly to planet
      const flyProgress = Math.min((newProgress - 0.33) * 1.5, 1); // 0.33-1 of total time
      const easedFly = easeInOutCubic(flyProgress);

      // Bezier curve for arc motion
      const mid = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);
      mid.y += 2; // Arc height

      const t = easedFly;
      const current = new THREE.Vector3()
        .copy(startPos).multiplyScalar((1 - t) * (1 - t))
        .add(mid.clone().multiplyScalar(2 * (1 - t) * t))
        .add(endPos.clone().multiplyScalar(t * t));

      groupRef.current.position.copy(current);

      // Shrink more as it approaches
      const flyScale = 0.3 * (1 - easedFly * 0.5);
      groupRef.current.scale.setScalar(flyScale);

      // Update trail
      if (trailRef.current) {
        const positions = trailRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = positions.length - 3; i >= 3; i -= 3) {
          positions[i] = positions[i - 3];
          positions[i + 1] = positions[i - 2];
          positions[i + 2] = positions[i - 1];
        }
        positions[0] = current.x;
        positions[1] = current.y;
        positions[2] = current.z;
        trailRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (flyProgress >= 1) {
        setPhase('done');
        onComplete?.();
      }
    }
  });

  if (!isActive) return null;

  const color = '#8b5cf6';
  const showLabel = phase === 'compact';

  return (
    <>
      {/* Main flying bubble */}
      <group ref={groupRef} position={[2.5, 1.5, 0]}>
        {/* Glowing sphere */}
        <mesh>
          <sphereGeometry args={[0.25, 24, 24]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Outer glow */}
        <mesh scale={1.5}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Inner core */}
        <mesh scale={0.5}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshBasicMaterial color="white" transparent opacity={0.6} />
        </mesh>

        {/* Label during compact phase */}
        {showLabel && (
          <Html position={[0, 0.5, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-black/80 px-3 py-1.5 rounded-lg border border-purple-500/50 whitespace-nowrap animate-pulse">
              <p className="text-xs font-medium text-purple-300">{itemName}</p>
            </div>
          </Html>
        )}
      </group>

      {/* Sparkle trail */}
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={trailPositions}
            count={10}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.05}
          transparent
          opacity={phase === 'fly' ? 0.8 : 0}
          sizeAttenuation
        />
      </points>
    </>
  );
}

