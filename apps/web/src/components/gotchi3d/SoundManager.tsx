'use client';

import { createContext, useContext, useRef, useCallback, ReactNode } from 'react';

type SoundType = 'click' | 'feed' | 'play' | 'happy' | 'sad' | 'attention' | 'start' | 'stop';

interface SoundContextValue {
  playSound: (type: SoundType) => void;
  initAudio: () => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

// Classic Tamagotchi-style beep frequencies and patterns
const soundPatterns: Record<SoundType, { freqs: number[]; durations: number[] }> = {
  click: { freqs: [800], durations: [50] },
  feed: { freqs: [600, 800, 1000], durations: [80, 80, 80] },
  play: { freqs: [500, 700, 500, 700], durations: [60, 60, 60, 60] },
  happy: { freqs: [800, 1000, 1200], durations: [100, 100, 150] },
  sad: { freqs: [400, 300, 200], durations: [150, 150, 200] },
  attention: { freqs: [1000, 800, 1000, 800], durations: [100, 100, 100, 100] },
  start: { freqs: [400, 600, 800, 1000], durations: [100, 100, 100, 150] },
  stop: { freqs: [800, 600, 400], durations: [100, 100, 150] },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isInitializedRef = useRef(false);

  const initAudio = useCallback(() => {
    if (!isInitializedRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new AudioContext();
      isInitializedRef.current = true;
    }
  }, []);

  const playSound = useCallback((type: SoundType) => {
    // Initialize on first sound (requires user interaction)
    if (!audioContextRef.current) {
      initAudio();
    }

    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const pattern = soundPatterns[type];
    if (!pattern) return;

    let startTime = ctx.currentTime;

    pattern.freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square'; // Classic 8-bit sound
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        startTime + pattern.durations[i] / 1000
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + pattern.durations[i] / 1000);

      startTime += pattern.durations[i] / 1000;
    });
  }, [initAudio]);

  return (
    <SoundContext.Provider value={{ playSound, initAudio }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return no-op if not in provider (for SSR safety)
    return {
      playSound: () => {},
      initAudio: () => {},
    };
  }
  return context;
}
