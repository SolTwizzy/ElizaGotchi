'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitItem } from '@/lib/api';

interface OrbitBubbleProps {
  item: OrbitItem;
  planetRadius: number;
  orbitIndex: number;
  totalBubbles: number;
  onClick: () => void;
  showLabel?: boolean;
  scale?: number;
}

// Vibrant color palette for orbit bubbles
const ORBIT_COLORS = [
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Violet
  '#eab308', // Yellow
];

// Get color based on orbit index for variety
function getOrbitColor(index: number): string {
  return ORBIT_COLORS[index % ORBIT_COLORS.length];
}

// Truncate title for display
function truncateTitle(title: string, maxLength = 20): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + '...';
}

export function OrbitBubble({
  item,
  planetRadius,
  orbitIndex,
  totalBubbles,
  onClick,
  showLabel = true,
  scale = 1,
}: OrbitBubbleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate orbit parameters based on index - more varied orbits
  const orbitParams = useMemo(() => {
    const baseRadius = planetRadius * 3.2;
    // Vary radius more significantly per bubble
    const orbitRadius = baseRadius + (orbitIndex % 3) * 0.6;
    // Different orbit tilts for each bubble (simulates inclined orbits)
    const orbitTilt = ((orbitIndex % 5) - 2) * 0.4; // -0.8 to 0.8
    // Varied speeds for more dynamic feel
    const orbitSpeed = 0.3 + (orbitIndex % 4) * 0.15;
    // Spread start angles evenly with offset
    const startAngle = (orbitIndex / Math.max(totalBubbles, 1)) * Math.PI * 2 + (orbitIndex * 0.5);
    const bubbleSize = 0.18;

    return { orbitRadius, orbitTilt, orbitSpeed, startAngle, bubbleSize };
  }, [planetRadius, orbitIndex, totalBubbles]);

  // Each orbit bubble gets a unique color based on its index
  const color = useMemo(() => getOrbitColor(orbitIndex), [orbitIndex]);

  // Animate orbit with more exciting 3D motion
  useFrame((state) => {
    if (!groupRef.current) return;

    const elapsed = state.clock.getElapsedTime();
    const angle = orbitParams.startAngle + elapsed * orbitParams.orbitSpeed;

    // True 3D orbital motion with tilted orbits
    const x = Math.cos(angle) * orbitParams.orbitRadius;
    const baseZ = Math.sin(angle) * orbitParams.orbitRadius * 0.7;
    // Y position varies based on orbit tilt and angle - creates inclined orbit effect
    const y = Math.sin(angle) * orbitParams.orbitTilt + Math.sin(elapsed * 0.8 + orbitIndex * 2) * 0.3;

    groupRef.current.position.x = x;
    groupRef.current.position.z = baseZ;
    groupRef.current.position.y = y;

    // Gentle rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }

    // Pulse glow when hovered
    if (glowRef.current && isHovered) {
      const pulseScale = 1.4 + Math.sin(elapsed * 8) * 0.1;
      glowRef.current.scale.setScalar(pulseScale);
    }
  });

  // Scaled bubble size
  const scaledBubbleSize = orbitParams.bubbleSize * scale;

  return (
    <group ref={groupRef} scale={scale}>
      {/* Main bubble */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          document.body.style.cursor = 'default';
        }}
        scale={isHovered ? 1.15 : 1}
      >
        <sphereGeometry args={[orbitParams.bubbleSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.8 : 0.5}
          transparent
          opacity={0.95}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Glow effect */}
      <mesh ref={glowRef} scale={1.4}>
        <sphereGeometry args={[orbitParams.bubbleSize, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered ? 0.35 : 0.2}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Inner shine */}
      <mesh scale={0.5}>
        <sphereGeometry args={[orbitParams.bubbleSize, 8, 8]} />
        <meshBasicMaterial color="white" transparent opacity={0.25} />
      </mesh>

      {/* Title label - no background, clean text */}
      {showLabel && (
        <Html
          position={[0, orbitParams.bubbleSize * 2.2, 0]}
          center
          style={{ pointerEvents: 'none' }}
          occlude={false}
        >
          <p
            className={`text-[11px] font-medium whitespace-nowrap transition-all ${isHovered ? 'text-white scale-110' : 'text-white/80'}`}
            style={{
              textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)',
            }}
          >
            {truncateTitle(item.name)}
          </p>
        </Html>
      )}
    </group>
  );
}

// Container component to render multiple orbit bubbles
interface OrbitBubblesProps {
  items: OrbitItem[];
  planetRadius: number;
  onItemClick: (item: OrbitItem) => void;
  showLabels?: boolean;
  scale?: number;
}

export function OrbitBubbles({ items, planetRadius, onItemClick, showLabels = true, scale = 1 }: OrbitBubblesProps) {
  // Filter out archived items for display
  const visibleItems = items.filter((item) => !item.isArchived);

  return (
    <group>
      {visibleItems.map((item, index) => (
        <OrbitBubble
          key={item.id}
          item={item}
          planetRadius={planetRadius}
          orbitIndex={index}
          totalBubbles={visibleItems.length}
          onClick={() => onItemClick(item)}
          showLabel={showLabels}
          scale={scale}
        />
      ))}
    </group>
  );
}
