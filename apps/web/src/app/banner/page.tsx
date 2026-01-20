'use client';

import Image from 'next/image';

export default function BannerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e] flex items-center justify-center">
      <div className="flex items-center gap-12">
        {/* Large Text on Left */}
        <span className="text-9xl font-bold font-diediedi bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          ElizaGotchi OS
        </span>
        {/* Large Image on Right */}
        <Image
          src="/toma1.png"
          alt="ElizaGotchi OS"
          width={380}
          height={380}
          className="drop-shadow-glow"
          priority
        />
      </div>
    </div>
  );
}
