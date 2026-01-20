'use client';

import Image from 'next/image';

export default function LogoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e] flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Large Image */}
        <Image
          src="/toma1.png"
          alt="ElizaGotchi OS"
          width={400}
          height={400}
          className="drop-shadow-glow"
          priority
        />
        {/* Large Text Below */}
        <span className="text-5xl md:text-6xl font-bold font-diediedi bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          ElizaGotchi OS
        </span>
      </div>
    </div>
  );
}
