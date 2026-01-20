'use client';

import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { PlanetTravelScene, getPlanetForAgentType, type PlanetConfig } from './planets';
import { cn } from '@/lib/utils';

interface HarvestOverlayProps {
  isActive: boolean;
  agentType: string;
  agentName: string;
  query: string;
  onComplete: (result: string) => void;
  onCancel: () => void;
}

export function HarvestOverlay({
  isActive,
  agentType,
  agentName,
  query,
  onComplete,
  onCancel,
}: HarvestOverlayProps) {
  const [planetConfig, setPlanetConfig] = useState<PlanetConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      const config = getPlanetForAgentType(agentType);
      setPlanetConfig(config);
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsVisible(false);
    }
  }, [isActive, agentType]);

  const handleComplete = useCallback((result: string) => {
    setIsVisible(false);
    setTimeout(() => onComplete(result), 300);
  }, [onComplete]);

  if (!isActive || !planetConfig) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition-all duration-500',
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        background: 'radial-gradient(ellipse at center, #0a0015 0%, #000000 100%)',
      }}
    >
      {/* 3D Travel Scene */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={0.5} color="#a855f7" />
          <Stars radius={100} depth={50} count={5000} factor={4} fade speed={2} />
          <PlanetTravelScene
            planetConfig={planetConfig}
            isActive={isVisible}
            onComplete={handleComplete}
            query={query}
          />
        </Canvas>
      </div>

      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors z-10"
      >
        Cancel Mission
      </button>

      {/* Agent info badge */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className="px-4 py-2 rounded-lg"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="text-xs text-purple-400 uppercase tracking-wider">
            Contacting Agent
          </div>
          <div className="text-white font-semibold">{agentName}</div>
        </div>
      </div>
    </div>
  );
}

// Simplified inline harvest animation (for use within the existing UI)
export function InlineHarvestAnimation({
  isActive,
  agentType,
  progress,
  message,
}: {
  isActive: boolean;
  agentType: string;
  progress: number;
  message: string;
}) {
  const planetConfig = getPlanetForAgentType(agentType);

  if (!isActive) return null;

  return (
    <div className="relative py-4">
      {/* Planet indicator */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${planetConfig.color}, ${planetConfig.atmosphereColor})`,
            boxShadow: `0 0 20px ${planetConfig.emissive}`,
          }}
        >
          <span className="text-lg">🪐</span>
        </div>
        <div>
          <div className="text-sm font-medium text-white">
            Traveling to {planetConfig.name}
          </div>
          <div className="text-xs text-white/60">{message}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${planetConfig.emissive}, ${planetConfig.atmosphereColor})`,
          }}
        />
      </div>
    </div>
  );
}
