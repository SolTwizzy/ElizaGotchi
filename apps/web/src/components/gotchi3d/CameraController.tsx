'use client';

import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraControllerProps {
  selectedPosition: [number, number, number] | null;
  onDeselect: () => void;
}

export function CameraController({ selectedPosition, onDeselect }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const targetPosition = useRef(new THREE.Vector3(0, 0, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Update target when selection changes
  useEffect(() => {
    if (selectedPosition) {
      // Zoom in to selected device
      targetPosition.current.set(
        selectedPosition[0],
        selectedPosition[1],
        selectedPosition[2] + 1.5 // Close to the device
      );
      targetLookAt.current.set(
        selectedPosition[0],
        selectedPosition[1],
        selectedPosition[2]
      );
    } else {
      // Reset to overview
      targetPosition.current.set(0, 0, 8);
      targetLookAt.current.set(0, 0, 0);
    }
  }, [selectedPosition]);

  // Smooth camera movement
  useFrame(() => {
    // Lerp camera position
    camera.position.lerp(targetPosition.current, 0.05);

    // Update controls target for smooth look-at
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.05);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={!selectedPosition}
      enablePan={!selectedPosition}
      enableRotate={!selectedPosition}
      minDistance={3}
      maxDistance={15}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 1.5}
      // Double-click to deselect (go back to overview)
      onEnd={() => {
        // Check if we should deselect based on camera distance
      }}
    />
  );
}
