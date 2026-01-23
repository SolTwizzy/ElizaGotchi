import type { ToolDefinition } from './model-router';
import type { AgentType } from '@elizagotchi/shared';

export interface ToolHandler {
  pluginName: string;
  providerName: string;
  method: string;
}

export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

// Tool definitions for blockchain plugin
const BLOCKCHAIN_TOOLS: RegisteredTool[] = [
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_recent_whale_activity',
        description: 'Get recent large cryptocurrency transactions from known whale wallets. Returns transactions above a minimum USD value.',
        parameters: {
          type: 'object',
          properties: {
            chain: {
              type: 'string',
              description: 'The blockchain to query',
              enum: ['ethereum', 'solana'],
            },
            min_value_usd: {
              type: 'number',
              description: 'Minimum transaction value in USD to include (default: 100000)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of transactions to return (default: 10)',
            },
          },
          required: ['chain'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'whale-transactions',
      method: 'getRecentWhaleActivity',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_known_whales',
        description: 'Get a list of known whale wallets (exchanges, funds, protocols) for a specific blockchain',
        parameters: {
          type: 'object',
          properties: {
            chain: {
              type: 'string',
              description: 'The blockchain to get whales for',
              enum: ['ethereum', 'solana', 'all'],
            },
          },
          required: ['chain'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'whale-transactions',
      method: 'getKnownWhalesByChain',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_current_gas_prices',
        description: 'Get current gas prices on Ethereum or other EVM chains',
        parameters: {
          type: 'object',
          properties: {
            chain: {
              type: 'string',
              description: 'The blockchain to check gas prices for',
              enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
            },
          },
          required: ['chain'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'gas-prices',
      method: 'getCurrentGasPrices',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_optimal_transaction_time',
        description: 'Analyze gas price patterns to suggest the best time to make a transaction',
        parameters: {
          type: 'object',
          properties: {
            chain: {
              type: 'string',
              description: 'The blockchain to analyze',
              enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
            },
          },
          required: ['chain'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'gas-prices',
      method: 'getOptimalTransactionTime',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_wallet_balance',
        description: 'Get the token balances and portfolio value of a wallet address',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The wallet address to check',
            },
            chain: {
              type: 'string',
              description: 'The blockchain the wallet is on',
              enum: ['ethereum', 'solana', 'polygon', 'arbitrum', 'optimism', 'base'],
            },
          },
          required: ['address', 'chain'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'wallet-balance',
      method: 'getEVMWalletBalance',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'check_airdrop_eligibility',
        description: 'Check if a wallet address is eligible for any known airdrops',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The wallet address to check eligibility for',
            },
            protocol: {
              type: 'string',
              description: 'Optional specific protocol to check (e.g., "layerzero", "zksync")',
            },
          },
          required: ['address'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'airdrop-eligibility',
      method: 'checkAirdropEligibility',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_upcoming_airdrops',
        description: 'Get a list of upcoming and active airdrop opportunities',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by airdrop status',
              enum: ['upcoming', 'active', 'all'],
            },
          },
          required: [],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'airdrop-eligibility',
      method: 'getUpcomingAirdrops',
    },
  },
  {
    definition: {
      type: 'function',
      function: {
        name: 'get_contract_info',
        description: 'Get information about a smart contract including its type and recent events',
        parameters: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'The contract address',
            },
            chain: {
              type: 'string',
              description: 'The blockchain the contract is deployed on',
              enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'],
            },
          },
          required: ['address', 'chain'],
        },
      },
    },
    handler: {
      pluginName: '@elizagotchi/plugin-blockchain',
      providerName: 'contract-events',
      method: 'getContractInfo',
    },
  },
];

// Map agent types to the tools they should have access to
const AGENT_TOOL_MAP: Record<AgentType, string[]> = {
  'whale-watcher': ['get_recent_whale_activity', 'get_known_whales', 'get_wallet_balance'],
  'portfolio-tracker': ['get_wallet_balance', 'get_current_gas_prices'],
  'airdrop-hunter': ['check_airdrop_eligibility', 'get_upcoming_airdrops', 'get_wallet_balance'],
  'gas-monitor': ['get_current_gas_prices', 'get_optimal_transaction_time'],
  'treasury-watcher': ['get_wallet_balance', 'get_recent_whale_activity', 'get_contract_info'],
  'contract-monitor': ['get_contract_info', 'get_recent_whale_activity'],
  'market-scanner': ['get_recent_whale_activity', 'get_known_whales', 'get_current_gas_prices'],
  // Dev tools - no blockchain tools needed
  'github-issue-triager': [],
  'bug-reporter': [],
  'changelog-writer': [],
  // Community/personal tools
  'reading-list-manager': [],
  'lore-keeper': [],
  'community-manager': [],
};

export function getToolsForAgentType(agentType: AgentType): RegisteredTool[] {
  const toolNames = AGENT_TOOL_MAP[agentType] || [];
  return BLOCKCHAIN_TOOLS.filter(tool =>
    toolNames.includes(tool.definition.function.name)
  );
}

export function getToolDefinitions(agentType: AgentType): ToolDefinition[] {
  return getToolsForAgentType(agentType).map(t => t.definition);
}

export function getToolHandler(toolName: string): ToolHandler | undefined {
  const tool = BLOCKCHAIN_TOOLS.find(t => t.definition.function.name === toolName);
  return tool?.handler;
}

export function getAllBlockchainTools(): RegisteredTool[] {
  return BLOCKCHAIN_TOOLS;
}
