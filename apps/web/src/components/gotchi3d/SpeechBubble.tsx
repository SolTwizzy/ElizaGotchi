'use client';

import { Html } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ReactMarkdown from 'react-markdown';

interface SpeechBubbleProps {
  message: string;
  position?: [number, number, number];
  maxWidth?: number;
}

// Custom scrollbar styles for the speech bubble
const scrollbarStyles = `
  .speech-bubble-container::-webkit-scrollbar {
    width: 6px;
  }
  .speech-bubble-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  .speech-bubble-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 3px;
  }
  .speech-bubble-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.6);
  }
  .speech-bubble-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.4) rgba(255, 255, 255, 0.1);
  }
`;

export function SpeechBubble({
  message,
  position = [1.5, 1.2, 0],
  maxWidth = 380,
}: SpeechBubbleProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Show full message - scrolling handles overflow
  const displayMessage = message;

  return (
    <group ref={groupRef} position={position}>
      <Html
        center
        style={{
          pointerEvents: 'auto',
          userSelect: 'text',
          width: `${maxWidth}px`,
        }}
      >
        <style>{scrollbarStyles}</style>
        <div
          className="speech-bubble-container"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95), rgba(236, 72, 153, 0.95))',
            borderRadius: '16px',
            padding: '12px 16px',
            width: `${maxWidth}px`,
            maxHeight: 'calc(85vh - 150px)',
            marginTop: '150px',
            overflowY: 'auto',
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
          <div
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#ffffff',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              wordWrap: 'break-word',
            }}
            className="speech-bubble-markdown"
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '8px 0 6px 0' }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '6px 0 4px 0' }}>{children}</h3>,
                p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>{children}</ol>,
                li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                code: ({ children }) => <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px', fontSize: '13px' }}>{children}</code>,
              }}
            >
              {displayMessage}
            </ReactMarkdown>
          </div>
        </div>
      </Html>
    </group>
  );
}
