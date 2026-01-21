'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useSound } from './SoundManager';

interface DeviceButtonsProps {
  onAClick: () => void; // Feed
  onBClick: () => void; // Play/Chat
  onCClick: () => void; // Settings
  disabled?: boolean;
}

interface ButtonProps {
  position: [number, number, number];
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function Button({ position, label, onClick, disabled }: ButtonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { playSound } = useSound();

  // Animate button press
  useFrame(() => {
    if (meshRef.current) {
      const targetZ = pressed ? -0.008 : 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(
        meshRef.current.position.z,
        targetZ,
        0.3
      );
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (disabled) return;
    setPressed(true);
    playSound('click');
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (disabled) return;
    setPressed(false);
    onClick();
  };

  const handlePointerLeave = () => {
    setPressed(false);
    setHovered(false);
  };

  return (
    <group position={position}>
      {/* Button base/socket - recessed ring */}
      <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.035, 0.015, 16]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>

      {/* Button body - larger rounded sphere like real Tamagotchi buttons */}
      <mesh
        ref={meshRef}
        position={[0, 0, 0.025]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => !disabled && setHovered(true)}
        onPointerOut={handlePointerLeave}
      >
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshPhysicalMaterial
          color={disabled ? '#4b5563' : hovered ? '#f87171' : '#ef4444'}
          roughness={0.15}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          emissive={disabled ? '#000000' : '#ff0000'}
          emissiveIntensity={hovered ? 0.2 : 0.05}
        />
      </mesh>
    </group>
  );
}

export function DeviceButtons({ onAClick, onBClick, onCClick, disabled }: DeviceButtonsProps) {
  return (
    <group position={[0, -0.24, 0.16]}>
      {/* Button A - Feed (left) */}
      <Button
        position={[-0.08, 0, 0]}
        label="A"
        onClick={onAClick}
        disabled={disabled}
      />

      {/* Button B - Play/Chat (center) */}
      <Button
        position={[0, 0, 0]}
        label="B"
        onClick={onBClick}
        disabled={disabled}
      />

      {/* Button C - Settings (right) */}
      <Button
        position={[0.08, 0, 0]}
        label="C"
        onClick={onCClick}
        disabled={disabled}
      />
    </group>
  );
}
