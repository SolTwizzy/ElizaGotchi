'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Planet } from './Planet';
import type { PlanetConfig, TravelState, TravelProgress } from './planetConfig';
import { TRAVEL_MESSAGES } from './planetConfig';

interface PlanetTravelProps {
  planetConfig: PlanetConfig;
  isActive: boolean;
  onComplete?: (result: string) => void;
  query?: string;
}

// Starfield particles for travel effect
function TravelStarfield({ speed }: { speed: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 500;

  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = Math.random() * -50;
  }

  useFrame((state, delta) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] += delta * speed * 20;
        if (positions[i * 3 + 2] > 5) {
          positions[i * 3 + 2] = -50;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Warp tunnel effect
function WarpTunnel({ intensity }: { intensity: number }) {
  const tunnelRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (tunnelRef.current) {
      tunnelRef.current.rotation.z = state.clock.elapsedTime * 0.5;
      const material = tunnelRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = intensity * 0.3;
    }
  });

  return (
    <mesh ref={tunnelRef} position={[0, 0, -5]}>
      <cylinderGeometry args={[3, 0.5, 15, 32, 1, true]} />
      <meshBasicMaterial
        color="#a855f7"
        transparent
        opacity={0.3}
        side={THREE.BackSide}
        wireframe
      />
    </mesh>
  );
}

export function PlanetTravelScene({ planetConfig, isActive, onComplete, query }: PlanetTravelProps) {
  const { camera } = useThree();
  const [travelState, setTravelState] = useState<TravelState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Ready to launch');
  const planetRef = useRef<THREE.Group>(null);

  // State machine for travel animation
  useEffect(() => {
    if (!isActive) {
      setTravelState('idle');
      setProgress(0);
      return;
    }

    const runTravelSequence = async () => {
      // Launching
      setTravelState('launching');
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i / 100);
        setCurrentMessage(TRAVEL_MESSAGES.launching[Math.floor(Math.random() * TRAVEL_MESSAGES.launching.length)]);
        await new Promise((r) => setTimeout(r, 100));
      }

      // Traveling
      setTravelState('traveling');
      for (let i = 0; i <= 100; i += 3) {
        setProgress(i / 100);
        setCurrentMessage(TRAVEL_MESSAGES.traveling[Math.floor(Math.random() * TRAVEL_MESSAGES.traveling.length)]);
        await new Promise((r) => setTimeout(r, 80));
      }

      // Arriving
      setTravelState('arriving');
      for (let i = 0; i <= 100; i += 8) {
        setProgress(i / 100);
        setCurrentMessage(TRAVEL_MESSAGES.arriving[Math.floor(Math.random() * TRAVEL_MESSAGES.arriving.length)]);
        await new Promise((r) => setTimeout(r, 100));
      }

      // Harvesting
      setTravelState('harvesting');
      for (let i = 0; i <= 100; i += 2) {
        setProgress(i / 100);
        setCurrentMessage(TRAVEL_MESSAGES.harvesting[Math.floor(Math.random() * TRAVEL_MESSAGES.harvesting.length)]);
        await new Promise((r) => setTimeout(r, 50));
      }

      // Returning
      setTravelState('returning');
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i / 100);
        setCurrentMessage(TRAVEL_MESSAGES.returning[Math.floor(Math.random() * TRAVEL_MESSAGES.returning.length)]);
        await new Promise((r) => setTimeout(r, 80));
      }

      // Complete
      onComplete?.('Harvest complete!');
      setTravelState('idle');
      setProgress(0);
    };

    runTravelSequence();
  }, [isActive, onComplete]);

  // Camera animation based on travel state
  useFrame((state, delta) => {
    if (travelState === 'traveling') {
      // Shake effect during travel
      camera.position.x += (Math.random() - 0.5) * 0.02;
      camera.position.y += (Math.random() - 0.5) * 0.02;
    }

    if (planetRef.current) {
      // Planet grows as we approach
      const targetScale = travelState === 'arriving' || travelState === 'harvesting' ? 2 : 1;
      planetRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2);

      // Planet moves closer during arrival
      const targetZ = travelState === 'arriving' || travelState === 'harvesting' ? -3 : -8;
      planetRef.current.position.z = THREE.MathUtils.lerp(planetRef.current.position.z, targetZ, delta * 2);
    }
  });

  const getTravelIntensity = () => {
    switch (travelState) {
      case 'launching': return 0.5;
      case 'traveling': return 1;
      case 'arriving': return 0.3;
      default: return 0;
    }
  };

  return (
    <>
      {/* Starfield effect during travel */}
      {(travelState === 'traveling' || travelState === 'launching') && (
        <TravelStarfield speed={getTravelIntensity()} />
      )}

      {/* Warp tunnel */}
      {travelState === 'traveling' && <WarpTunnel intensity={progress} />}

      {/* Planet destination */}
      <group ref={planetRef} position={[0, 0, -8]}>
        <Planet
          config={planetConfig}
          position={[0, 0, 0]}
          isActive={travelState === 'harvesting'}
          scale={1.5}
        />
      </group>

      {/* HUD overlay */}
      <Html fullscreen>
        <div
          className={`
            fixed inset-0 pointer-events-none
            transition-opacity duration-500
            ${isActive ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {/* Top status bar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div
              className="px-6 py-3 rounded-full"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(168, 85, 247, 0.5)',
              }}
            >
              <div className="text-white text-center">
                <div className="text-xs text-purple-400 uppercase tracking-wider mb-1">
                  Destination
                </div>
                <div className="text-lg font-bold">
                  🪐 {planetConfig.name}
                </div>
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div
              className="px-8 py-4 rounded-xl text-center"
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="text-2xl font-bold text-white mb-2">
                {currentMessage}
              </div>
              {query && (
                <div className="text-sm text-white/60 mb-3">
                  Query: "{query}"
                </div>
              )}
              <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${progress * 100}%`,
                    background: 'linear-gradient(90deg, #ec4899, #a855f7)',
                  }}
                />
              </div>
              <div className="text-xs text-white/50 mt-2 uppercase tracking-wider">
                {travelState.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div
              className="px-4 py-2 rounded-lg text-xs text-white/60"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              {planetConfig.description}
            </div>
          </div>
        </div>
      </Html>
    </>
  );
}
