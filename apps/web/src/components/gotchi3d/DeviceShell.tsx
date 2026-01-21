'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';

interface DeviceShellProps {
  color: string;
  glowColor: string;
  hovered: boolean;
  status: string;
}

export function DeviceShell({ color, glowColor, hovered, status }: DeviceShellProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create Tamagotchi body - a thick coin/disc shape (circle from front view)
  const bodyGeometry = useMemo(() => {
    const shape = new THREE.Shape();

    // Oval shape - slightly taller than wide like a real Tamagotchi
    const radiusX = 0.34;  // horizontal radius
    const radiusY = 0.42;  // vertical radius (taller)
    const segments = 64;

    // Draw oval
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radiusX;
      const y = Math.sin(angle) * radiusY;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 6,
      curveSegments: 64,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Translate so front face is forward
    geometry.translate(0, 0, -0.10);

    return geometry;
  }, []);

  // Starburst frame geometry - larger to match bigger screen
  const starburstGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 8;
    const outerRadius = 0.32;
    const innerRadius = 0.25;

    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.005,
      bevelSegments: 2,
    });
  }, []);

  // Always use the agent's bright color - status shown via emissive glow
  const shellColor = useMemo(() => {
    if (status === 'stopped' || status === 'pending') return '#9ca3af'; // Light gray when off
    return color; // Keep bright color for running/error
  }, [color, status]);

  const emissiveColor = useMemo(() => {
    if (status === 'error') return '#ff0000'; // Red glow for error
    if (hovered || status === 'running') return glowColor;
    return '#000000';
  }, [hovered, status, glowColor]);

  const emissiveIntensity = useMemo(() => {
    if (status === 'error') return 0.3; // Strong red glow for error
    if (hovered) return 0.2;
    if (status === 'running') return 0.1;
    return 0;
  }, [hovered, status]);

  return (
    <group>
      {/* Main body - glossy plastic */}
      <mesh ref={meshRef} geometry={bodyGeometry}>
        <meshPhysicalMaterial
          color={shellColor}
          roughness={0.1}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Screen backing - dark recessed area */}
      <mesh position={[0, 0.05, 0.16]}>
        <circleGeometry args={[0.22, 32]} />
        <meshStandardMaterial color="#080810" roughness={0.95} />
      </mesh>

      {/* Starburst/sunburst frame - bright gold/yellow like real Tamagotchi */}
      <mesh geometry={starburstGeometry} position={[0, 0.05, 0.155]} rotation={[0, 0, Math.PI / 8]}>
        <meshPhysicalMaterial
          color="#fde047"
          roughness={0.08}
          metalness={0.4}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          emissive="#fbbf24"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Inner bezel ring */}
      <mesh position={[0, 0.05, 0.175]}>
        <ringGeometry args={[0.125, 0.145, 32]} />
        <meshStandardMaterial color="#d97706" roughness={0.2} metalness={0.35} />
      </mesh>


      {/* Keychain loop */}
      <group position={[0, 0.44, -0.05]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.035, 0.012, 8, 20]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.75} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.018, 0.022, 0.025, 10]} />
          <meshStandardMaterial color="#6b7280" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

    </group>
  );
}
