// Planet configuration - each agent type has a consistent planet across all users
// This ensures whale-watcher is always Mars, airdrop-hunter is always Pluto, etc.

export interface PlanetConfig {
  name: string;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  size: number;
  hasRings: boolean;
  ringColor?: string;
  atmosphereColor: string;
  texturePattern: 'rocky' | 'gas' | 'ice' | 'volcanic' | 'ocean' | 'desert' | 'toxic' | 'crystal';
  orbitSpeed: number;
  rotationSpeed: number;
  description: string;
}

// Map agent types to specific planets - consistent across all users
export const AGENT_PLANET_MAP: Record<string, PlanetConfig> = {
  'whale-watcher': {
    name: 'Neptune Prime',
    color: '#1e3a5f',
    emissive: '#0066cc',
    emissiveIntensity: 0.3,
    size: 1.2,
    hasRings: false,
    atmosphereColor: '#4488ff',
    texturePattern: 'ocean',
    orbitSpeed: 0.3,
    rotationSpeed: 0.5,
    description: 'Deep ocean world where whale signals emerge from the depths',
  },
  'portfolio-tracker': {
    name: 'Aurum Station',
    color: '#8b6914',
    emissive: '#ffd700',
    emissiveIntensity: 0.4,
    size: 1.0,
    hasRings: true,
    ringColor: '#ffd700',
    atmosphereColor: '#ffcc00',
    texturePattern: 'desert',
    orbitSpeed: 0.4,
    rotationSpeed: 0.6,
    description: 'Golden rings orbit this treasury world of infinite wealth data',
  },
  'airdrop-hunter': {
    name: 'Pluto IX',
    color: '#2d1b4e',
    emissive: '#9933ff',
    emissiveIntensity: 0.5,
    size: 0.8,
    hasRings: false,
    atmosphereColor: '#cc66ff',
    texturePattern: 'ice',
    orbitSpeed: 0.2,
    rotationSpeed: 0.3,
    description: 'Frozen frontier where rare airdrops crystallize from the void',
  },
  'gas-monitor': {
    name: 'Vulcan Prime',
    color: '#8b2500',
    emissive: '#ff4400',
    emissiveIntensity: 0.6,
    size: 1.1,
    hasRings: false,
    atmosphereColor: '#ff6633',
    texturePattern: 'volcanic',
    orbitSpeed: 0.5,
    rotationSpeed: 0.8,
    description: 'Volcanic world where gas prices burn bright in the magma flows',
  },
  'treasury-watcher': {
    name: 'Fortuna Major',
    color: '#1a472a',
    emissive: '#00ff66',
    emissiveIntensity: 0.35,
    size: 1.3,
    hasRings: true,
    ringColor: '#00cc44',
    atmosphereColor: '#33ff88',
    texturePattern: 'crystal',
    orbitSpeed: 0.25,
    rotationSpeed: 0.4,
    description: 'Crystal spires hold the secrets of every treasury movement',
  },
  'contract-monitor': {
    name: 'Mars Nexus',
    color: '#993322',
    emissive: '#ff3300',
    emissiveIntensity: 0.4,
    size: 1.0,
    hasRings: false,
    atmosphereColor: '#ff6644',
    texturePattern: 'rocky',
    orbitSpeed: 0.45,
    rotationSpeed: 0.7,
    description: 'Red sands reveal contract deployments across the blockchain',
  },
  'market-scanner': {
    name: 'Jupiter Analytics',
    color: '#cc9966',
    emissive: '#ffaa44',
    emissiveIntensity: 0.35,
    size: 1.5,
    hasRings: true,
    ringColor: '#ffcc88',
    atmosphereColor: '#ffbb66',
    texturePattern: 'gas',
    orbitSpeed: 0.35,
    rotationSpeed: 0.9,
    description: 'Gas giant processing infinite market data in swirling storms',
  },
  'github-issue-triager': {
    name: 'Codex Prime',
    color: '#1a1a2e',
    emissive: '#6644ff',
    emissiveIntensity: 0.45,
    size: 0.9,
    hasRings: false,
    atmosphereColor: '#8866ff',
    texturePattern: 'toxic',
    orbitSpeed: 0.4,
    rotationSpeed: 0.55,
    description: 'Digital archives pulse with every issue and pull request',
  },
  'bug-reporter': {
    name: 'Sentinel Moon',
    color: '#3d3d3d',
    emissive: '#ffff00',
    emissiveIntensity: 0.5,
    size: 0.7,
    hasRings: false,
    atmosphereColor: '#ffff66',
    texturePattern: 'rocky',
    orbitSpeed: 0.6,
    rotationSpeed: 0.4,
    description: 'Warning beacons flash across this vigilant monitoring station',
  },
  'changelog-writer': {
    name: 'Scribe Station',
    color: '#2a4858',
    emissive: '#44aaff',
    emissiveIntensity: 0.4,
    size: 0.9,
    hasRings: true,
    ringColor: '#66ccff',
    atmosphereColor: '#55bbff',
    texturePattern: 'ice',
    orbitSpeed: 0.35,
    rotationSpeed: 0.5,
    description: 'Frozen archives preserve every change in crystalline clarity',
  },
  'reading-list-manager': {
    name: 'Library Prime',
    color: '#4a3728',
    emissive: '#bb8844',
    emissiveIntensity: 0.35,
    size: 1.0,
    hasRings: false,
    atmosphereColor: '#cc9955',
    texturePattern: 'desert',
    orbitSpeed: 0.3,
    rotationSpeed: 0.45,
    description: 'Ancient scrolls of knowledge float in endless sandstorms',
  },
  'lore-keeper': {
    name: 'Mythos World',
    color: '#4a1a4a',
    emissive: '#ff44ff',
    emissiveIntensity: 0.5,
    size: 1.1,
    hasRings: true,
    ringColor: '#ff88ff',
    atmosphereColor: '#ff66ff',
    texturePattern: 'crystal',
    orbitSpeed: 0.25,
    rotationSpeed: 0.6,
    description: 'Legends and stories crystallize into living memory',
  },
  'community-manager': {
    name: 'Harmony Hub',
    color: '#1a3a2a',
    emissive: '#44ff88',
    emissiveIntensity: 0.4,
    size: 1.2,
    hasRings: false,
    atmosphereColor: '#66ffaa',
    texturePattern: 'ocean',
    orbitSpeed: 0.35,
    rotationSpeed: 0.5,
    description: 'Serene oceans connect communities across the galaxy',
  },
  'trend-spotter': {
    name: 'Pulse Nova',
    color: '#3a1a1a',
    emissive: '#ff6644',
    emissiveIntensity: 0.55,
    size: 1.0,
    hasRings: false,
    atmosphereColor: '#ff8866',
    texturePattern: 'volcanic',
    orbitSpeed: 0.5,
    rotationSpeed: 0.7,
    description: 'Volcanic eruptions signal emerging trends from the core',
  },
};

// Default planet for unknown agent types
export const DEFAULT_PLANET: PlanetConfig = {
  name: 'Unknown World',
  color: '#4a4a4a',
  emissive: '#666666',
  emissiveIntensity: 0.2,
  size: 1.0,
  hasRings: false,
  atmosphereColor: '#888888',
  texturePattern: 'rocky',
  orbitSpeed: 0.3,
  rotationSpeed: 0.5,
  description: 'An uncharted world awaiting discovery',
};

export function getPlanetForAgentType(agentType: string): PlanetConfig {
  return AGENT_PLANET_MAP[agentType] || DEFAULT_PLANET;
}

// Planet travel states for the harvest animation
export type TravelState = 'idle' | 'launching' | 'traveling' | 'arriving' | 'harvesting' | 'returning';

export interface TravelProgress {
  state: TravelState;
  progress: number; // 0-1
  message: string;
}

export const TRAVEL_MESSAGES: Record<TravelState, string[]> = {
  idle: ['Ready for launch'],
  launching: ['Initiating launch sequence...', 'Engines warming up...', 'Liftoff!'],
  traveling: ['Entering hyperspace...', 'Navigating asteroid field...', 'Approaching destination...'],
  arriving: ['Entering orbit...', 'Scanning surface...', 'Landing sequence initiated...'],
  harvesting: ['Collecting data...', 'Processing signals...', 'Extracting insights...'],
  returning: ['Mission complete!', 'Returning to base...', 'Preparing results...'],
};
