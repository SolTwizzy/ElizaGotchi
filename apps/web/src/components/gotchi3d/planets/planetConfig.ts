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
// VIBRANT COLOR PALETTE ONLY - no browns, tans, or muted tones!
export const AGENT_PLANET_MAP: Record<string, PlanetConfig> = {
  'whale-watcher': {
    name: 'Neptune Prime',
    color: '#0284c7',
    emissive: '#38bdf8',
    emissiveIntensity: 0.4,
    size: 1.2,
    hasRings: true,
    ringColor: '#7dd3fc',
    atmosphereColor: '#38bdf8',
    texturePattern: 'ocean',
    orbitSpeed: 0.3,
    rotationSpeed: 0.5,
    description: 'Deep ocean world where whale signals emerge from the depths',
  },
  'portfolio-tracker': {
    name: 'Aurum Station',
    color: '#c026d3',
    emissive: '#e879f9',
    emissiveIntensity: 0.5,
    size: 1.0,
    hasRings: true,
    ringColor: '#f0abfc',
    atmosphereColor: '#f5d0fe',
    texturePattern: 'crystal',
    orbitSpeed: 0.4,
    rotationSpeed: 0.6,
    description: 'Magenta rings orbit this treasury world of infinite wealth data',
  },
  'airdrop-hunter': {
    name: 'Pluto IX',
    color: '#7c3aed',
    emissive: '#a78bfa',
    emissiveIntensity: 0.5,
    size: 0.9,
    hasRings: true,
    ringColor: '#c4b5fd',
    atmosphereColor: '#ddd6fe',
    texturePattern: 'ice',
    orbitSpeed: 0.2,
    rotationSpeed: 0.3,
    description: 'Frozen frontier where rare airdrops crystallize from the void',
  },
  'gas-monitor': {
    name: 'Vulcan Prime',
    color: '#e11d48',
    emissive: '#fb7185',
    emissiveIntensity: 0.5,
    size: 1.1,
    hasRings: false,
    atmosphereColor: '#fda4af',
    texturePattern: 'volcanic',
    orbitSpeed: 0.5,
    rotationSpeed: 0.8,
    description: 'Volcanic world where gas prices burn bright in the magma flows',
  },
  'treasury-watcher': {
    name: 'Fortuna Major',
    color: '#7c3aed',
    emissive: '#a855f7',
    emissiveIntensity: 0.45,
    size: 1.3,
    hasRings: true,
    ringColor: '#c084fc',
    atmosphereColor: '#d8b4fe',
    texturePattern: 'crystal',
    orbitSpeed: 0.25,
    rotationSpeed: 0.4,
    description: 'Crystal spires hold the secrets of every treasury movement',
  },
  'contract-monitor': {
    name: 'Mars Nexus',
    color: '#db2777',
    emissive: '#f472b6',
    emissiveIntensity: 0.45,
    size: 1.0,
    hasRings: false,
    atmosphereColor: '#f9a8d4',
    texturePattern: 'rocky',
    orbitSpeed: 0.45,
    rotationSpeed: 0.7,
    description: 'Pink sands reveal contract deployments across the blockchain',
  },
  'market-scanner': {
    name: 'Jupiter Analytics',
    color: '#0d9488',
    emissive: '#2dd4bf',
    emissiveIntensity: 0.45,
    size: 1.5,
    hasRings: true,
    ringColor: '#5eead4',
    atmosphereColor: '#99f6e4',
    texturePattern: 'gas',
    orbitSpeed: 0.35,
    rotationSpeed: 0.9,
    description: 'Gas giant processing infinite market data in swirling storms',
  },
  'github-issue-triager': {
    name: 'Codex Prime',
    color: '#4f46e5',
    emissive: '#818cf8',
    emissiveIntensity: 0.5,
    size: 0.9,
    hasRings: true,
    ringColor: '#a5b4fc',
    atmosphereColor: '#c7d2fe',
    texturePattern: 'ice',
    orbitSpeed: 0.4,
    rotationSpeed: 0.55,
    description: 'Digital archives pulse with every issue and pull request',
  },
  'bug-reporter': {
    name: 'Sentinel Moon',
    color: '#ca8a04',
    emissive: '#facc15',
    emissiveIntensity: 0.55,
    size: 0.8,
    hasRings: false,
    atmosphereColor: '#fde047',
    texturePattern: 'crystal',
    orbitSpeed: 0.6,
    rotationSpeed: 0.4,
    description: 'Warning beacons flash across this vigilant monitoring station',
  },
  'changelog-writer': {
    name: 'Scribe Station',
    color: '#0891b2',
    emissive: '#22d3ee',
    emissiveIntensity: 0.45,
    size: 0.9,
    hasRings: true,
    ringColor: '#67e8f9',
    atmosphereColor: '#a5f3fc',
    texturePattern: 'ice',
    orbitSpeed: 0.35,
    rotationSpeed: 0.5,
    description: 'Frozen archives preserve every change in crystalline clarity',
  },
  'reading-list-manager': {
    name: 'Library Prime',
    color: '#e11d48',
    emissive: '#fb7185',
    emissiveIntensity: 0.45,
    size: 1.0,
    hasRings: true,
    ringColor: '#fda4af',
    atmosphereColor: '#fecdd3',
    texturePattern: 'crystal',
    orbitSpeed: 0.3,
    rotationSpeed: 0.45,
    description: 'Crystal libraries hold knowledge in brilliant rose formations',
  },
  'lore-keeper': {
    name: 'Mythos World',
    color: '#c026d3',
    emissive: '#e879f9',
    emissiveIntensity: 0.55,
    size: 1.1,
    hasRings: true,
    ringColor: '#f0abfc',
    atmosphereColor: '#f5d0fe',
    texturePattern: 'crystal',
    orbitSpeed: 0.25,
    rotationSpeed: 0.6,
    description: 'Legends and stories crystallize into living memory',
  },
  'community-manager': {
    name: 'Harmony Hub',
    color: '#db2777',
    emissive: '#f472b6',
    emissiveIntensity: 0.45,
    size: 1.2,
    hasRings: true,
    ringColor: '#f9a8d4',
    atmosphereColor: '#fbcfe8',
    texturePattern: 'ocean',
    orbitSpeed: 0.35,
    rotationSpeed: 0.5,
    description: 'Pink oceans connect communities across the galaxy',
  },
  'trend-spotter': {
    name: 'Pulse Nova',
    color: '#ea580c',
    emissive: '#fb923c',
    emissiveIntensity: 0.55,
    size: 1.0,
    hasRings: false,
    atmosphereColor: '#fdba74',
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
