/**
 * Script to create demo agents for the test user account
 * Run with: bun run scripts/create-demo-agents.ts
 */

const API_URL = process.env.API_URL || 'https://eliza-kiz-production.up.railway.app';
const TEST_EMAIL = '444hoodie@gmail.com';
const TEST_PASSWORD = 'Thomas1234!';

// User's wallet addresses
const EVM_WALLET = '0xD6C25B99a56A02445C7A6F71F546D60ACF8459c2';
const SOLANA_WALLET = 'GXpL9UiB8xZeWW7WgEPqYEW4KPHmZsrvC9cieY8nQ2Wi';

// Popular contract addresses
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const AAVE_V3_POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';

// Token addresses for whale watching
const TOKEN_ADDRESSES = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH placeholder
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
};

// Agent configurations
const agentConfigs = [
  {
    name: 'Portfolio Tracker',
    type: 'portfolio-tracker',
    config: {
      walletAddresses: [EVM_WALLET, SOLANA_WALLET],
      alertThreshold: 5,
      chains: ['ethereum', 'polygon', 'arbitrum', 'base', 'optimism', 'solana'],
    },
  },
  {
    name: 'Whale Watcher',
    type: 'whale-watcher',
    config: {
      tokens: [TOKEN_ADDRESSES.WETH, TOKEN_ADDRESSES.WBTC, TOKEN_ADDRESSES.USDC, TOKEN_ADDRESSES.USDT],
      minTransactionUsd: 100000,
      chains: ['ethereum'],
    },
  },
  {
    name: 'Airdrop Hunter',
    type: 'airdrop-hunter',
    config: {
      walletAddresses: [EVM_WALLET, SOLANA_WALLET],
      checkFrequency: 'daily',
    },
  },
  {
    name: 'Gas Monitor',
    type: 'gas-monitor',
    config: {
      chains: ['ethereum'],
      lowGasThreshold: 20,
      highGasThreshold: 100,
    },
  },
  {
    name: 'Treasury Watcher',
    type: 'treasury-watcher',
    config: {
      treasuryAddresses: [AAVE_V3_POOL], // Watch Aave treasury
      reportFrequency: 'daily',
      alertOnLargeMovements: true,
      largeMovementThreshold: 100000,
    },
  },
  {
    name: 'Contract Monitor',
    type: 'contract-monitor',
    config: {
      contracts: [
        {
          address: UNISWAP_V3_ROUTER,
          chain: 'ethereum',
          events: ['Swap'],
        },
      ],
    },
  },
  {
    name: 'Market Scanner',
    type: 'market-scanner',
    config: {
      topics: ['Bitcoin', 'Ethereum', 'DeFi', 'Airdrops', 'AI agents', 'LLMs', 'Claude', 'GPT'],
      sources: [],
      digestFrequency: 'daily',
    },
  },
  {
    name: 'Reading List Manager',
    type: 'reading-list-manager',
    config: {
      categories: ['Crypto', 'AI', 'Programming', 'Business'],
      dailyGoal: 1,
    },
  },
  {
    name: 'GitHub Issue Triager',
    type: 'github-issue-triager',
    config: {
      repositories: ['ItachiDevv/BirdEye'],
      labels: ['bug', 'feature', 'question', 'documentation'],
      autoLabel: true,
      autoRespond: true,
    },
  },
  {
    name: 'Bug Reporter',
    type: 'bug-reporter',
    config: {
      repository: 'ItachiDevv/BirdEye',
      template: 'default',
      requiredFields: ['description', 'steps', 'expected', 'actual'],
    },
  },
  {
    name: 'Changelog Writer',
    type: 'changelog-writer',
    config: {
      repository: 'ItachiDevv/BirdEye',
      format: 'keepachangelog',
      includeAuthors: true,
    },
  },
  {
    name: 'Naruto Lore Keeper',
    type: 'lore-keeper',
    config: {
      universe: 'Naruto',
      knowledgeBase: 'https://naruto.fandom.com/wiki/Narutopedia',
      spoilerWarnings: true,
    },
  },
];

async function login(): Promise<string> {
  console.log('🔐 Logging in...');

  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  // Get session cookie from response
  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie returned');
  }

  // Extract auth_session cookie
  const sessionMatch = cookies.match(/auth_session=([^;]+)/);
  if (!sessionMatch) {
    throw new Error('No auth_session cookie found');
  }

  console.log('✅ Logged in successfully');
  return `auth_session=${sessionMatch[1]}`;
}

async function getExistingAgents(cookie: string): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/agents`, {
    headers: { Cookie: cookie },
  });

  if (!response.ok) {
    throw new Error('Failed to get existing agents');
  }

  const data = await response.json();
  return data.agents.map((a: { type: string }) => a.type);
}

async function createAgent(cookie: string, config: typeof agentConfigs[0]): Promise<boolean> {
  console.log(`📦 Creating ${config.name} (type: ${config.type})...`);

  const response = await fetch(`${API_URL}/api/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`   ❌ Failed (${response.status}): ${error}`);
    // Try to parse JSON error for more details
    try {
      const errorJson = JSON.parse(error);
      console.log(`   📋 Error details:`, JSON.stringify(errorJson, null, 2));
    } catch {
      // error is not JSON
    }
    return false;
  }

  const data = await response.json();
  console.log(`   ✅ Created: ${data.agent.id}`);
  return true;
}

async function main() {
  console.log('🚀 Creating demo agents for ElizaGotchi OS\n');

  try {
    // Login
    const cookie = await login();

    // Get existing agents to avoid duplicates
    const existingTypes = await getExistingAgents(cookie);
    console.log(`\n📋 Existing agent types: ${existingTypes.length > 0 ? existingTypes.join(', ') : 'none'}\n`);

    // Filter out agents that already exist
    const agentsToCreate = agentConfigs.filter(
      (config) => !existingTypes.includes(config.type)
    );

    if (agentsToCreate.length === 0) {
      console.log('✨ All agents already exist!');
      return;
    }

    console.log(`Creating ${agentsToCreate.length} new agents...\n`);

    // Create agents
    let created = 0;
    let failed = 0;

    for (const config of agentsToCreate) {
      const success = await createAgent(cookie, config);
      if (success) {
        created++;
      } else {
        failed++;
      }
    }

    console.log(`\n✨ Done! Created: ${created}, Failed: ${failed}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
