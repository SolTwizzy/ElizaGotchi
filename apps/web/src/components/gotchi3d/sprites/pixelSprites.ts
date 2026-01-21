// 8x8 pixel art sprites for Tamagotchi LCD screen
// 1 = filled pixel, 0 = empty pixel

export type SpriteFrame = number[][];

export const sprites: Record<string, SpriteFrame> = {
  // Cute blob pet - idle standing
  idle: [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
  ],

  // Bounce frame 1 (arms up, happy)
  bounce1: [
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
  ],

  // Bounce frame 2 (squished happy)
  bounce2: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // Sleeping pet with Zzz
  sleep: [
    [0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // Sick pet (droopy, sad)
  sick: [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
  ],

  // Egg
  egg: [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ],

  // Hatching (egg cracking, eyes peeking)
  hatching: [
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 1, 1, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ],

  // Heart icon
  heart: [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // Empty heart
  heartEmpty: [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // Star
  star: [
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 0, 1, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // Food icon (onigiri/rice ball)
  food: [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],

  // Game icon (ball)
  game: [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ],

  // Medicine icon (pill)
  medicine: [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ],
};

// Status to animation mapping
export const statusAnimations: Record<string, string[]> = {
  running: ['idle', 'bounce1', 'idle', 'bounce2'],
  paused: ['sleep'],
  stopped: ['egg'],
  error: ['sick'],
  starting: ['egg', 'hatching', 'idle'],
  pending: ['egg'],
  configuring: ['hatching'],
};

// Get current sprite for status with animation frame
export function getCurrentSprite(status: string, frame: number): SpriteFrame {
  const animation = statusAnimations[status] || statusAnimations.stopped;
  const spriteKey = animation[frame % animation.length];
  return sprites[spriteKey] || sprites.idle;
}

// Agent type to color mapping (for shell) - bright, fun Tamagotchi colors!
export const agentColors: Record<string, { shell: string; accent: string; glow: string }> = {
  'whale-watcher': { shell: '#60a5fa', accent: '#38bdf8', glow: '#93c5fd' },      // Bright blue
  'portfolio-tracker': { shell: '#c084fc', accent: '#e879f9', glow: '#d8b4fe' },  // Lavender purple
  'airdrop-hunter': { shell: '#4ade80', accent: '#fde047', glow: '#86efac' },     // Mint green
  'gas-monitor': { shell: '#fb923c', accent: '#fcd34d', glow: '#fdba74' },        // Bright orange
  'treasury-watcher': { shell: '#fde047', accent: '#a3e635', glow: '#fef08a' },   // Sunny yellow
  'contract-monitor': { shell: '#f87171', accent: '#fda4af', glow: '#fca5a5' },   // Coral red
  'market-scanner': { shell: '#34d399', accent: '#67e8f9', glow: '#6ee7b7' },     // Teal
  'reading-list-manager': { shell: '#a78bfa', accent: '#f9a8d4', glow: '#c4b5fd' }, // Soft purple
  'github-issue-triager': { shell: '#818cf8', accent: '#c084fc', glow: '#a5b4fc' }, // Indigo
  'bug-reporter': { shell: '#fcd34d', accent: '#fca5a5', glow: '#fef08a' },       // Bright yellow
  'changelog-writer': { shell: '#22d3ee', accent: '#a5f3fc', glow: '#67e8f9' },   // Cyan
  'community-manager': { shell: '#f472b6', accent: '#c084fc', glow: '#f9a8d4' },  // Hot pink
  'lore-keeper': { shell: '#fbbf24', accent: '#fb923c', glow: '#fcd34d' },        // Gold
};

export function getAgentColors(agentType: string) {
  return agentColors[agentType] || { shell: '#6b7280', accent: '#374151', glow: '#9ca3af' };
}
