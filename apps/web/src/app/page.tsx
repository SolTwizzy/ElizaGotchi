'use client';

import Link from 'next/link';
import Image from 'next/image';

const agents = [
  { id: 'portfolio-tracker', name: 'Portfolio Tracker', desc: 'Track your wallet balances', avatar: '/toma1.png', color: '#FF6B9D' },
  { id: 'whale-watcher', name: 'Whale Watcher', desc: 'Spot big money moves', avatar: '/toma2.png', color: '#9B6BFF' },
  { id: 'airdrop-hunter', name: 'Airdrop Hunter', desc: 'Never miss free tokens', avatar: '/toma3.png', color: '#6BFFD4' },
  { id: 'bug-reporter', name: 'Bug Reporter', desc: 'Collect & format bug reports', avatar: '/toma4.png', color: '#FFD46B' },
  { id: 'treasury-watcher', name: 'Treasury Watcher', desc: 'Monitor DAO funds', avatar: '/toma5.png', color: '#6BB5FF' },
  { id: 'contract-monitor', name: 'Contract Monitor', desc: 'Watch smart contracts', avatar: '/toma6.png', color: '#FF6B6B' },
  { id: 'market-scanner', name: 'Market Scanner', desc: 'Scan news & trends', avatar: '/toma7.png', color: '#B5FF6B' },
  { id: 'reading-list-manager', name: 'Reading List', desc: 'Curate your content', avatar: '/toma8.png', color: '#FF9D6B' },
  { id: 'github-issue-triager', name: 'Issue Triager', desc: 'Organize GitHub issues', avatar: '/toma9.png', color: '#6BFFA5' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1033] via-[#0d1a2d] to-[#1a0d2e] text-white overflow-hidden font-tamaconnect">
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${['#FF6B9D', '#9B6BFF', '#6BFFD4', '#FFD46B'][i % 4]} 0%, transparent 70%)`,
              animation: `float ${10 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/toma1.png" alt="ElizaGotchi OS" width={40} height={40} className="drop-shadow-glow" />
            <span className="text-2xl font-bold font-diediedi bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ElizaGotchi OS
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-white/70 hover:text-white transition">
              Sign In
            </Link>
            <Link href="/login" className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full font-medium transition shadow-lg shadow-purple-500/25">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-block mb-4 px-4 py-1 bg-white/10 backdrop-blur rounded-full border border-white/20">
            <span className="text-sm">🎮 Your Digital Companions Await</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-wide" style={{ lineHeight: '1.8' }}>
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Hatch Your AI Agent
            </span>
          </h1>
          <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Adopt a digital companion that works 24/7. Feed it data, watch it grow, let it handle the busy work.
          </p>

          <div className="flex justify-center gap-4 mb-16">
            <Link href="/login" className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full font-bold text-lg transition shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
              🥚 Hatch Your Agent
            </Link>
            <a href="#agents" className="px-8 py-4 border-2 border-white/30 hover:border-white/50 hover:bg-white/5 rounded-full font-medium text-lg transition">
              Meet the Family
            </a>
          </div>

          {/* Agent avatars showcase */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-6 max-w-6xl mx-auto">
            {agents.map((agent, i) => (
              <Link
                key={agent.id}
                href="/login"
                className="group flex flex-col items-center"
              >
                <div
                  className="relative p-1 rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{
                    animation: `float 3s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                    background: `linear-gradient(135deg, ${agent.color}40, transparent)`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                    style={{ background: agent.color }}
                  />
                  <Image
                    src={agent.avatar}
                    alt={agent.name}
                    width={80}
                    height={80}
                    className="relative rounded-xl"
                  />
                </div>
                <span
                  className="mt-2 text-xs font-medium text-white/50 group-hover:text-white transition-colors text-center w-20 leading-tight"
                  style={{ textShadow: `0 0 20px ${agent.color}`, letterSpacing: '0.02em' }}
                >
                  {agent.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-12 bg-white/5 backdrop-blur-sm border-y border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '9', label: 'Unique Agents', color: '#FF6B9D' },
              { value: '24/7', label: 'Always Active', color: '#9B6BFF' },
              { value: '0', label: 'Code Required', color: '#6BFFD4' },
              { value: 'Free', label: 'To Start', color: '#FFD46B' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-bold mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section id="agents" className="relative z-10 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Choose Your Companion
          </h2>
          <p className="text-center text-white/50 mb-12">Each agent has unique abilities ready to help you</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href="/login"
                className="group p-5 bg-white/5 backdrop-blur border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="p-2 rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${agent.color}30, transparent)` }}
                  >
                    <Image
                      src={agent.avatar}
                      alt={agent.name}
                      width={64}
                      height={64}
                      className="rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-white transition" style={{ color: agent.color }}>
                      {agent.name}
                    </h3>
                    <p className="text-sm text-white/50">{agent.desc}</p>
                  </div>
                  <div className="text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Choose', desc: 'Pick your digital companion', icon: '🎯', color: '#FF6B9D' },
              { num: '2', title: 'Connect', desc: 'Link your accounts', icon: '🔗', color: '#9B6BFF' },
              { num: '3', title: 'Deploy', desc: 'Watch it work 24/7', icon: '🚀', color: '#6BFFD4' },
            ].map((step) => (
              <div key={step.num} className="text-center group">
                <div
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center text-4xl transition-transform group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${step.color}30, transparent)`, boxShadow: `0 0 30px ${step.color}20` }}
                >
                  {step.icon}
                </div>
                <h3 className="font-bold text-xl mb-2" style={{ color: step.color }}>{step.title}</h3>
                <p className="text-white/50">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <div className="p-8 bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur rounded-3xl border border-white/10">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-white/60 mb-8">Your AI companion is waiting to be hatched.</p>
            <Link href="/login" className="inline-block px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full font-bold text-lg transition shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
              🥚 Hatch Your Agent
            </Link>
            <p className="mt-4 text-sm text-white/40">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/toma1.png" alt="" width={28} height={28} />
              <span className="font-bold font-diediedi bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">ElizaGotchi OS</span>
            </div>
            <div className="text-sm text-white/40">© 2024 <span className="font-diediedi">ElizaGotchi OS</span></div>
            <div className="flex gap-6 text-sm text-white/50">
              <a href="#" className="hover:text-white transition">Discord</a>
              <a href="#" className="hover:text-white transition">Twitter</a>
              <a href="#" className="hover:text-white transition">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
