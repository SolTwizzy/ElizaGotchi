'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlanetConfig } from './planetConfig';

interface PlanetProps {
  config: PlanetConfig;
  position: [number, number, number];
  scale?: number;
  onClick?: () => void;
  isActive?: boolean;
}

// Generate procedural texture based on pattern type
function generatePlanetTexture(pattern: PlanetConfig['texturePattern'], color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);

  // Add pattern based on type
  switch (pattern) {
    case 'rocky':
      // Crater-like patterns
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = Math.random() * 20 + 5;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
        ctx.fill();
      }
      break;

    case 'gas':
      // Horizontal bands
      for (let i = 0; i < 10; i++) {
        const y = i * 26;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.2})`;
        ctx.fillRect(0, y, 256, 13);
      }
      // Add swirl effect
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(
          Math.random() * 256,
          Math.random() * 256,
          Math.random() * 40 + 20,
          Math.random() * 20 + 10,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(200,150,100,${Math.random() * 0.3})`;
        ctx.fill();
      }
      break;

    case 'ice':
      // Ice cracks
      ctx.strokeStyle = 'rgba(200,230,255,0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 256, Math.random() * 256);
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(Math.random() * 256, Math.random() * 256);
        }
        ctx.stroke();
      }
      // Frost patches
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 30, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,240,255,${Math.random() * 0.3})`;
        ctx.fill();
      }
      break;

    case 'volcanic':
      // Lava rivers
      ctx.strokeStyle = 'rgba(255,100,0,0.8)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 256, Math.random() * 256);
        for (let j = 0; j < 4; j++) {
          ctx.lineTo(Math.random() * 256, Math.random() * 256);
        }
        ctx.stroke();
      }
      // Volcanic spots
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 15 + 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,50,0,${Math.random() * 0.6 + 0.2})`;
        ctx.fill();
      }
      break;

    case 'ocean':
      // Ocean currents
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        const startX = Math.random() * 256;
        const startY = Math.random() * 256;
        ctx.moveTo(startX, startY);
        for (let j = 0; j < 6; j++) {
          ctx.quadraticCurveTo(
            startX + (Math.random() - 0.5) * 100,
            startY + j * 30,
            startX + (Math.random() - 0.5) * 50,
            startY + j * 40
          );
        }
        ctx.strokeStyle = `rgba(100,200,255,${Math.random() * 0.4})`;
        ctx.lineWidth = Math.random() * 10 + 5;
        ctx.stroke();
      }
      // Island dots
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 10 + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(50,100,50,0.6)`;
        ctx.fill();
      }
      break;

    case 'desert':
      // Sand dunes
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        ctx.ellipse(x, y, Math.random() * 60 + 20, Math.random() * 20 + 5, Math.PI * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,180,100,${Math.random() * 0.3})`;
        ctx.fill();
      }
      break;

    case 'toxic':
      // Toxic clouds
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 40 + 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,255,100,${Math.random() * 0.2})`;
        ctx.fill();
      }
      // Dark patches
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, Math.random() * 25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,50,0,${Math.random() * 0.4})`;
        ctx.fill();
      }
      break;

    case 'crystal':
      // Crystal formations
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 20 + 10;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.5, y);
        ctx.lineTo(x, y + size * 0.3);
        ctx.lineTo(x - size * 0.5, y);
        ctx.closePath();
        ctx.fillStyle = `rgba(150,255,200,${Math.random() * 0.5 + 0.2})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(200,255,230,0.8)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function Planet({ config, position, scale = 1, onClick, isActive }: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(
    () => generatePlanetTexture(config.texturePattern, config.color),
    [config.texturePattern, config.color]
  );

  // Animate rotation
  useFrame((state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * config.rotationSpeed;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z += delta * 0.1;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= delta * 0.2;
    }
  });

  const finalScale = config.size * scale * (isActive ? 1.2 : 1);

  return (
    <group position={position} onClick={onClick}>
      {/* Planet body */}
      <mesh ref={planetRef} scale={finalScale}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          emissive={config.emissive}
          emissiveIntensity={isActive ? config.emissiveIntensity * 1.5 : config.emissiveIntensity}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={finalScale * 1.15}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial
          color={config.atmosphereColor}
          transparent
          opacity={isActive ? 0.25 : 0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Rings (if planet has them) */}
      {config.hasRings && (
        <mesh ref={ringsRef} rotation={[Math.PI * 0.4, 0, 0]} scale={finalScale}>
          <ringGeometry args={[0.65, 0.9, 64]} />
          <meshBasicMaterial
            color={config.ringColor || config.color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Selection indicator */}
      {isActive && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.8 * finalScale, 0]}>
          <ringGeometry args={[0.6 * finalScale, 0.7 * finalScale, 32]} />
          <meshBasicMaterial color={config.atmosphereColor} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
