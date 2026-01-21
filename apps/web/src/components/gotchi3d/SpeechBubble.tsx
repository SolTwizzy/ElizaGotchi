'use client';

import { Html } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpeechBubbleProps {
  message: string;
  position?: [number, number, number];
  maxWidth?: number;
}

export function SpeechBubble({
  message,
  position = [1.5, 1.2, 0],
  maxWidth = 180,
}: SpeechBubbleProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Truncate message if too long
  const displayMessage =
    message.length > 100 ? message.slice(0, 100) + '...' : message;

  return (
    <group ref={groupRef} position={position}>
      <Html
        distanceFactor={4}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'translateX(50%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            padding: '10px 14px',
            maxWidth: `${maxWidth}px`,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            border: '2px solid rgba(168, 85, 247, 0.4)',
          }}
        >
          {/* Speech bubble tail - pointing left toward device */}
          <div
            style={{
              position: 'absolute',
              left: '-10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '10px solid transparent',
              borderBottom: '10px solid transparent',
              borderRight: '10px solid rgba(255, 255, 255, 0.95)',
            }}
          />
          {/* Border for tail */}
          <div
            style={{
              position: 'absolute',
              left: '-14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: '12px solid rgba(168, 85, 247, 0.4)',
              zIndex: -1,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: '1.4',
              color: '#1a1a2e',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
            }}
          >
            {displayMessage}
          </p>
        </div>
      </Html>
    </group>
  );
}
