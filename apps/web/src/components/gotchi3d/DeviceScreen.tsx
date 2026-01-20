'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCurrentSprite, sprites, type SpriteFrame } from './sprites/pixelSprites';

interface DeviceScreenProps {
  status: string;
  agentType: string;
  healthLevel: number; // 0-4
  activityLevel: number; // 0-4
}

const CANVAS_WIDTH = 64;
const CANVAS_HEIGHT = 48;
const PIXEL_SIZE = 2;

// Classic LCD green color palette
const LCD_COLORS = {
  background: '#9bbc0f',
  backgroundDark: '#8bac0f',
  pixel: '#0f380f',
  pixelLight: '#306230',
};

export function DeviceScreen({ status, agentType, healthLevel, activityLevel }: DeviceScreenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [canvas] = useState(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = CANVAS_WIDTH * PIXEL_SIZE;
    c.height = CANVAS_HEIGHT * PIXEL_SIZE;
    return c;
  });
  const [texture] = useState(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    return t;
  });
  const frameRef = useRef(0);
  const lastFrameTime = useRef(0);

  // Draw pixel sprite on canvas
  const drawSprite = (
    ctx: CanvasRenderingContext2D,
    sprite: SpriteFrame,
    x: number,
    y: number,
    scale: number = 1
  ) => {
    ctx.fillStyle = LCD_COLORS.pixel;
    sprite.forEach((row, rowIdx) => {
      row.forEach((pixel, colIdx) => {
        if (pixel) {
          ctx.fillRect(
            (x + colIdx * scale) * PIXEL_SIZE,
            (y + rowIdx * scale) * PIXEL_SIZE,
            scale * PIXEL_SIZE,
            scale * PIXEL_SIZE
          );
        }
      });
    });
  };

  // Draw hearts meter
  const drawHearts = (ctx: CanvasRenderingContext2D, count: number, x: number, y: number) => {
    for (let i = 0; i < 4; i++) {
      const sprite = i < count ? sprites.heart : sprites.heartEmpty;
      // Draw smaller hearts (4x4)
      sprite.slice(0, 4).forEach((row, rowIdx) => {
        row.slice(0, 4).forEach((pixel, colIdx) => {
          if (pixel) {
            ctx.fillStyle = LCD_COLORS.pixel;
            ctx.fillRect(
              (x + i * 5 + colIdx) * PIXEL_SIZE,
              (y + rowIdx) * PIXEL_SIZE,
              PIXEL_SIZE,
              PIXEL_SIZE
            );
          }
        });
      });
    }
  };

  // Draw stars meter
  const drawStars = (ctx: CanvasRenderingContext2D, count: number, x: number, y: number) => {
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i < count ? LCD_COLORS.pixel : LCD_COLORS.pixelLight;
      // Simple star shape
      ctx.fillRect((x + i * 5 + 1) * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      ctx.fillRect((x + i * 5) * PIXEL_SIZE, (y + 1) * PIXEL_SIZE, 3 * PIXEL_SIZE, PIXEL_SIZE);
      ctx.fillRect((x + i * 5 + 1) * PIXEL_SIZE, (y + 2) * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  };

  // Animation loop
  useFrame((state) => {
    if (!canvas || !texture) return;

    // Update animation frame every 500ms
    if (state.clock.elapsedTime - lastFrameTime.current > 0.5) {
      frameRef.current++;
      lastFrameTime.current = state.clock.elapsedTime;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with LCD background
    ctx.fillStyle = LCD_COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle scanline effect
    ctx.fillStyle = LCD_COLORS.backgroundDark;
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    // Get current sprite based on status
    const sprite = getCurrentSprite(status, frameRef.current);

    // Draw main character (centered, scaled up)
    const charX = (CANVAS_WIDTH - 16) / 2; // 8 pixels * 2 scale
    const charY = 8;
    drawSprite(ctx, sprite, charX, charY, 2);

    // Draw status meters at bottom
    drawHearts(ctx, healthLevel, 4, 38);
    drawStars(ctx, activityLevel, 34, 38);

    // Mark texture for update
    texture.needsUpdate = true;
  });

  if (!texture) return null;

  return (
    <mesh ref={meshRef} position={[0, 0.08, 0.17]}>
      <planeGeometry args={[0.2, 0.15]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
