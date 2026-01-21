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

// Agent type to color mapping (for shell) - VIBRANT fun Tamagotchi colors only!
export const agentColors: Record<string, { shell: string; accent: string; glow: string }> = {
  'whale-watcher': { shell: '#38bdf8', accent: '#0ea5e9', glow: '#7dd3fc' },      // Electric blue
  'portfolio-tracker': { shell: '#e879f9', accent: '#d946ef', glow: '#f5d0fe' },  // Hot magenta
  'airdrop-hunter': { shell: '#a78bfa', accent: '#8b5cf6', glow: '#ddd6fe' },     // Bright violet
  'gas-monitor': { shell: '#fb7185', accent: '#f43f5e', glow: '#fecdd3' },        // Coral pink
  'treasury-watcher': { shell: '#c084fc', accent: '#a855f7', glow: '#e9d5ff' },   // Royal purple
  'contract-monitor': { shell: '#f472b6', accent: '#ec4899', glow: '#fbcfe8' },   // Hot pink
  'market-scanner': { shell: '#2dd4bf', accent: '#14b8a6', glow: '#99f6e4' },     // Bright teal
  'reading-list-manager': { shell: '#fb7185', accent: '#f43f5e', glow: '#fecdd3' }, // Coral
  'github-issue-triager': { shell: '#818cf8', accent: '#6366f1', glow: '#c7d2fe' }, // Electric indigo
  'bug-reporter': { shell: '#fbbf24', accent: '#f59e0b', glow: '#fef3c7' },       // Sunny yellow
  'changelog-writer': { shell: '#22d3ee', accent: '#06b6d4', glow: '#a5f3fc' },   // Electric cyan
  'community-manager': { shell: '#f472b6', accent: '#ec4899', glow: '#fbcfe8' },  // Hot pink
  'lore-keeper': { shell: '#e879f9', accent: '#d946ef', glow: '#f5d0fe' },        // Magenta
};

export function getAgentColors(agentType: string) {
  return agentColors[agentType] || { shell: '#6b7280', accent: '#374151', glow: '#9ca3af' };
}
