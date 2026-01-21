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
  maxWidth = 240,
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
    message.length > 120 ? message.slice(0, 120) + '...' : message;

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          width: `${maxWidth}px`,
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(236, 72, 153, 0.95))',
            borderRadius: '16px',
            padding: '12px 16px',
            width: `${maxWidth}px`,
            boxShadow: '0 4px 24px rgba(168, 85, 247, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* Speech bubble tail - pointing left toward device */}
          <div
            style={{
              position: 'absolute',
              left: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              borderRight: '12px solid rgba(168, 85, 247, 0.95)',
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
              color: '#ffffff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              wordWrap: 'break-word',
              whiteSpace: 'normal',
            }}
          >
            {displayMessage}
          </p>
        </div>
      </Html>
    </group>
  );
}
