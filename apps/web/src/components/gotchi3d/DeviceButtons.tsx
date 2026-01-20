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
      const targetZ = pressed ? position[2] - 0.01 : position[2];
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
      {/* Button body */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => !disabled && setHovered(true)}
        onPointerOut={handlePointerLeave}
      >
        <cylinderGeometry args={[0.025, 0.028, 0.015, 16]} />
        <meshStandardMaterial
          color={disabled ? '#4b5563' : hovered ? '#e5e7eb' : '#d1d5db'}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* Button ring/bezel */}
      <mesh position={[0, 0, -0.008]}>
        <cylinderGeometry args={[0.032, 0.032, 0.005, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  );
}

export function DeviceButtons({ onAClick, onBClick, onCClick, disabled }: DeviceButtonsProps) {
  return (
    <group position={[0, -0.18, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Button A - Feed (left) */}
      <Button
        position={[-0.07, 0, 0]}
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
        position={[0.07, 0, 0]}
        label="C"
        onClick={onCClick}
        disabled={disabled}
      />
    </group>
  );
}
