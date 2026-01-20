/**
 * Available AI models for agents
 * - Free tier: GPT-4o-mini and Claude Haiku (included with platform)
 * - Premium tier: Requires user's own API key
 */
export const AI_MODELS = {
  // Free tier models (included)
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    tier: 'free',
    description: 'Fast and cost-effective. Great for most tasks.',
    costPer1kTokens: 0.00015,
  },
  'claude-3-haiku': {
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    tier: 'free',
    description: 'Quick responses, excellent for simple tasks.',
    costPer1kTokens: 0.00025,
  },
  // Premium tier models (require own API key)
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai',
    tier: 'premium',
    description: 'Most capable OpenAI model. Requires your own API key.',
    costPer1kTokens: 0.005,
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'openai',
    tier: 'premium',
    description: 'Powerful with 128k context. Requires your own API key.',
    costPer1kTokens: 0.01,
  },
  'claude-3.5-sonnet': {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    tier: 'premium',
    description: 'Best Claude model for complex tasks. Requires your own API key.',
    costPer1kTokens: 0.003,
  },
  'claude-3-opus': {
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    tier: 'premium',
    description: 'Most powerful Claude model. Requires your own API key.',
    costPer1kTokens: 0.015,
  },
} as const;

export type AIModel = keyof typeof AI_MODELS;
export type AIModelConfig = (typeof AI_MODELS)[AIModel];

export const FREE_MODELS: AIModel[] = ['gpt-4o-mini', 'claude-3-haiku'];
export const PREMIUM_MODELS: AIModel[] = ['gpt-4o', 'gpt-4-turbo', 'claude-3.5-sonnet', 'claude-3-opus'];
export const DEFAULT_MODEL: AIModel = 'gpt-4o-mini';

export const AGENT_TYPES = {
  // Crypto & DeFi
  'portfolio-tracker': {
    name: 'Portfolio Tracker',
    description: 'Monitors your wallets, reports balances, alerts on significant changes',
    category: 'crypto',
    icon: 'wallet',
    requiredConnections: ['wallet-evm', 'wallet-solana'],
    optionalConnections: ['discord', 'telegram'],
    plugins: ['plugin-blockchain'],
    configSchema: {
      walletAddresses: { type: 'array', items: 'string', required: true },
      alertThreshold: { type: 'number', default: 5, description: 'Percentage change to trigger alert' },
      chains: { type: 'array', items: 'string', default: ['ethereum', 'polygon', 'arbitrum'] },
    },
    estimatedCost: '$2.20-$2.75/month',
  },

  'whale-watcher': {
    name: 'Whale Watcher',
    description: 'Tracks large transactions on specific tokens/protocols, alerts you',
    category: 'crypto',
    icon: 'fish',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: ['plugin-blockchain'],
    configSchema: {
      tokens: { type: 'array', items: 'string', required: true, description: 'Token addresses to watch' },
      minTransactionUsd: { type: 'number', default: 100000, description: 'Minimum USD value to alert' },
      chains: { type: 'array', items: 'string', default: ['ethereum'] },
    },
    estimatedCost: '$5.15-$5.50/month',
  },

  'airdrop-hunter': {
    name: 'Airdrop Hunter',
    description: 'Tracks wallet eligibility for airdrops, alerts when claimable',
    category: 'crypto',
    icon: 'gift',
    requiredConnections: ['wallet-evm'],
    optionalConnections: ['discord', 'telegram', 'wallet-solana'],
    plugins: ['plugin-blockchain'],
    configSchema: {
      walletAddresses: { type: 'array', items: 'string', required: true },
      checkFrequency: { type: 'string', default: 'daily', enum: ['hourly', 'daily', 'weekly'] },
    },
    estimatedCost: '$2.00-$3.00/month',
  },

  'gas-monitor': {
    name: 'Gas Monitor',
    description: 'Tracks gas prices, alerts when low, can queue transactions',
    category: 'crypto',
    icon: 'fuel',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: ['plugin-blockchain'],
    configSchema: {
      chains: { type: 'array', items: 'string', default: ['ethereum'] },
      lowGasThreshold: { type: 'number', default: 20, description: 'Gwei threshold for low gas alert' },
      highGasThreshold: { type: 'number', default: 100, description: 'Gwei threshold for high gas alert' },
    },
    estimatedCost: '$1.50-$2.50/month',
  },

  'treasury-watcher': {
    name: 'Treasury Watcher',
    description: 'Monitors DAO/project treasury, reports on inflows/outflows',
    category: 'crypto',
    icon: 'landmark',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: ['plugin-blockchain'],
    configSchema: {
      treasuryAddresses: { type: 'array', items: 'string', required: true },
      reportFrequency: { type: 'string', default: 'daily', enum: ['hourly', 'daily', 'weekly'] },
      alertOnLargeMovements: { type: 'boolean', default: true },
      largeMovementThreshold: { type: 'number', default: 10000, description: 'USD value' },
    },
    estimatedCost: '$2.00-$3.50/month',
  },

  'contract-monitor': {
    name: 'Contract Monitor',
    description: 'Watches specific smart contracts for events, summarizes activity',
    category: 'crypto',
    icon: 'file-code',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: ['plugin-blockchain'],
    configSchema: {
      contracts: {
        type: 'array',
        items: {
          address: 'string',
          abi: 'string',
          events: 'array',
          chain: 'string',
        },
        required: true,
      },
    },
    estimatedCost: '$2.50-$4.00/month',
  },

  // Research & Analysis
  'market-scanner': {
    name: 'Market Scanner',
    description: 'Monitors news sources for specific topics, sends daily/weekly digests',
    category: 'research',
    icon: 'newspaper',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: ['plugin-rss'],
    configSchema: {
      topics: { type: 'array', items: 'string', required: true },
      sources: { type: 'array', items: 'string', default: [] },
      digestFrequency: { type: 'string', default: 'daily', enum: ['realtime', 'daily', 'weekly'] },
    },
    estimatedCost: '$2.00-$4.00/month',
  },

  // Personal
  'reading-list-manager': {
    name: 'Reading List Manager',
    description: 'Tracks books/articles to read, summarizes them, recommends next',
    category: 'personal',
    icon: 'book-open',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: [],
    configSchema: {
      categories: { type: 'array', items: 'string', default: [] },
      dailyGoal: { type: 'number', default: 1 },
    },
    estimatedCost: '$0.75-$2.00/month',
  },

  // Developer & Technical
  'github-issue-triager': {
    name: 'GitHub Issue Triager',
    description: 'Labels issues, answers common questions, routes to maintainers',
    category: 'developer',
    icon: 'git-pull-request',
    requiredConnections: ['github'],
    optionalConnections: ['discord'],
    plugins: ['plugin-github'],
    configSchema: {
      repositories: { type: 'array', items: 'string', required: true },
      labels: { type: 'array', items: 'string', default: ['bug', 'feature', 'question', 'documentation'] },
      autoLabel: { type: 'boolean', default: true },
      autoRespond: { type: 'boolean', default: true },
    },
    estimatedCost: '$1.50-$3.50/month',
  },

  'bug-reporter': {
    name: 'Bug Reporter',
    description: 'Collects bug reports from users, formats them, creates issues',
    category: 'developer',
    icon: 'bug',
    requiredConnections: ['github'],
    optionalConnections: ['discord'],
    plugins: ['plugin-github'],
    configSchema: {
      repository: { type: 'string', required: true },
      template: { type: 'string', default: 'default' },
      requiredFields: { type: 'array', items: 'string', default: ['description', 'steps', 'expected', 'actual'] },
    },
    estimatedCost: '$1.00-$2.50/month',
  },

  'changelog-writer': {
    name: 'Changelog Writer',
    description: 'Monitors commits/PRs, generates release notes',
    category: 'developer',
    icon: 'file-text',
    requiredConnections: ['github'],
    optionalConnections: [],
    plugins: ['plugin-github'],
    configSchema: {
      repository: { type: 'string', required: true },
      format: { type: 'string', default: 'keepachangelog', enum: ['keepachangelog', 'conventional', 'custom'] },
      includeAuthors: { type: 'boolean', default: true },
    },
    estimatedCost: '$1.00-$2.50/month',
  },

  // Community
  'community-manager': {
    name: 'Community Manager',
    description: 'Welcomes new members, answers FAQs, moderates conversations, enforces rules',
    category: 'community',
    icon: 'users',
    requiredConnections: ['discord'],
    optionalConnections: ['telegram'],
    plugins: [],
    configSchema: {
      welcomeMessage: { type: 'string', default: 'Welcome to the community!' },
      rules: { type: 'array', items: 'string', default: [] },
      bannedWords: { type: 'array', items: 'string', default: [] },
      faqEnabled: { type: 'boolean', default: true },
      moderationLevel: { type: 'string', default: 'medium', enum: ['low', 'medium', 'high'] },
    },
    estimatedCost: '$1.00-$3.50/month',
  },

  // Entertainment
  'lore-keeper': {
    name: 'Lore Keeper',
    description: 'Answers questions about game/show/book lore',
    category: 'entertainment',
    icon: 'scroll',
    requiredConnections: [],
    optionalConnections: ['discord', 'telegram'],
    plugins: [],
    configSchema: {
      universe: { type: 'string', required: true, description: 'Name of the fictional universe' },
      knowledgeBase: { type: 'string', description: 'URL to wiki or documentation' },
      spoilerWarnings: { type: 'boolean', default: true },
    },
    estimatedCost: '$1.00-$3.00/month',
  },

} as const;

export type AgentType = keyof typeof AGENT_TYPES;
export type AgentTypeConfig = (typeof AGENT_TYPES)[AgentType];
