import { evmClient } from '../services/evm-client';
import { priceService } from '../services/price-service';
import type { Address } from 'viem';

export interface ContractEvent {
  contractAddress: Address;
  contractName?: string;
  eventName: string;
  args: Record<string, unknown>;
  transactionHash: string;
  blockNumber: bigint;
  timestamp: Date;
  chain: string;
  decoded?: DecodedEventData;
}

export interface DecodedEventData {
  type: 'transfer' | 'approval' | 'swap' | 'mint' | 'burn' | 'deposit' | 'withdrawal' | 'other';
  description: string;
  valueUsd?: number;
  from?: string;
  to?: string;
  amount?: string;
}

export interface ContractConfig {
  address: Address;
  abi: string[];
  events: string[];
  chain: string;
  name?: string;
  type?: ContractType;
}

export type ContractType = 'erc20' | 'erc721' | 'erc1155' | 'uniswap-v2' | 'uniswap-v3' | 'aave' | 'compound' | 'custom';

export interface EventSummary {
  contractAddress: Address;
  contractName?: string;
  eventCounts: Record<string, number>;
  period: {
    start: Date;
    end: Date;
  };
  totalEvents: number;
  topEvents: Array<{ eventName: string; count: number }>;
}

// Common event ABIs for different contract types
export const COMMON_ABIS: Record<ContractType, string[]> = {
  erc20: [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  erc721: [
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
  ],
  erc1155: [
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
    'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
  ],
  'uniswap-v2': [
    'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
    'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
    'event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)',
    'event Sync(uint112 reserve0, uint112 reserve1)',
  ],
  'uniswap-v3': [
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
    'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
    'event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
    'event Collect(address indexed owner, address recipient, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount0, uint128 amount1)',
  ],
  aave: [
    'event Deposit(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)',
    'event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)',
    'event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 indexed referral)',
    'event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount)',
    'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
  ],
  compound: [
    'event Mint(address minter, uint256 mintAmount, uint256 mintTokens)',
    'event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)',
    'event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)',
    'event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)',
    'event LiquidateBorrow(address liquidator, address borrower, uint256 repayAmount, address cTokenCollateral, uint256 seizeTokens)',
  ],
  custom: [],
};

// Known protocol contracts
const KNOWN_CONTRACTS: Record<string, { name: string; type: ContractType; chain: string }> = {
  // Ethereum
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC', type: 'erc20', chain: 'ethereum' },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': { name: 'USDT', type: 'erc20', chain: 'ethereum' },
  '0x6b175474e89094c44da98b954eecdecb5be3830': { name: 'DAI', type: 'erc20', chain: 'ethereum' },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'erc20', chain: 'ethereum' },
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640': { name: 'Uniswap V3 ETH/USDC', type: 'uniswap-v3', chain: 'ethereum' },
  '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852': { name: 'Uniswap V2 ETH/USDT', type: 'uniswap-v2', chain: 'ethereum' },
  '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2': { name: 'Aave V3 Pool', type: 'aave', chain: 'ethereum' },
};

// In-memory event store for tracking
const eventStore: Map<string, ContractEvent[]> = new Map();
const MAX_EVENTS_PER_CONTRACT = 1000;

function getContractKey(address: Address, chain: string): string {
  return `${chain}:${address.toLowerCase()}`;
}

function storeEvent(event: ContractEvent): void {
  const key = getContractKey(event.contractAddress, event.chain);
  const events = eventStore.get(key) ?? [];
  events.push(event);

  // Keep only the most recent events
  if (events.length > MAX_EVENTS_PER_CONTRACT) {
    events.shift();
  }

  eventStore.set(key, events);
}

function decodeEvent(rawEvent: any, contractType?: ContractType): DecodedEventData | undefined {
  const eventName = rawEvent.eventName?.toLowerCase() ?? '';
  const args = rawEvent.args ?? {};

  if (eventName.includes('transfer')) {
    return {
      type: 'transfer',
      description: `Transfer from ${args.from?.slice(0, 8)}... to ${args.to?.slice(0, 8)}...`,
      from: args.from,
      to: args.to,
      amount: args.value?.toString() ?? args.tokenId?.toString(),
    };
  }

  if (eventName.includes('approval')) {
    return {
      type: 'approval',
      description: `Approval granted to ${args.spender?.slice(0, 8) ?? args.approved?.slice(0, 8)}...`,
      from: args.owner,
      to: args.spender ?? args.approved,
      amount: args.value?.toString(),
    };
  }

  if (eventName.includes('swap')) {
    return {
      type: 'swap',
      description: 'Token swap executed',
      from: args.sender,
      to: args.to ?? args.recipient,
    };
  }

  if (eventName.includes('mint')) {
    return {
      type: 'mint',
      description: 'Tokens minted',
      to: args.sender ?? args.minter,
      amount: args.amount?.toString() ?? args.mintAmount?.toString(),
    };
  }

  if (eventName.includes('burn')) {
    return {
      type: 'burn',
      description: 'Tokens burned',
      from: args.sender ?? args.owner,
      amount: args.amount?.toString(),
    };
  }

  if (eventName.includes('deposit')) {
    return {
      type: 'deposit',
      description: 'Deposit made',
      from: args.user ?? args.sender,
      amount: args.amount?.toString(),
    };
  }

  if (eventName.includes('withdraw')) {
    return {
      type: 'withdrawal',
      description: 'Withdrawal made',
      to: args.to ?? args.user,
      amount: args.amount?.toString(),
    };
  }

  return {
    type: 'other',
    description: eventName || 'Unknown event',
  };
}

export function getContractInfo(address: Address): { name: string; type: ContractType; chain: string } | undefined {
  return KNOWN_CONTRACTS[address.toLowerCase()];
}

export function getAbiForType(type: ContractType): string[] {
  return COMMON_ABIS[type] ?? [];
}

export async function watchContractEvents(
  config: ContractConfig,
  onEvent: (event: ContractEvent) => void
): Promise<() => void> {
  // Auto-detect contract type if not provided
  const contractInfo = getContractInfo(config.address);
  const contractType = config.type ?? contractInfo?.type ?? 'custom';
  const contractName = config.name ?? contractInfo?.name;

  // Use provided ABI or get common ABI for the type
  const abi = config.abi.length > 0 ? config.abi : getAbiForType(contractType);

  return evmClient.watchContractEvents(
    config.address,
    abi,
    config.chain,
    (rawEvent: any) => {
      const decoded = decodeEvent(rawEvent, contractType);

      const event: ContractEvent = {
        contractAddress: config.address,
        contractName,
        eventName: rawEvent.eventName || 'Unknown',
        args: rawEvent.args || {},
        transactionHash: rawEvent.transactionHash,
        blockNumber: rawEvent.blockNumber,
        timestamp: new Date(),
        chain: config.chain,
        decoded,
      };

      // Store event for historical queries
      storeEvent(event);

      onEvent(event);
    }
  );
}

export async function watchMultipleContracts(
  configs: ContractConfig[],
  onEvent: (event: ContractEvent) => void
): Promise<() => void> {
  const unwatchers: Array<() => void> = [];

  for (const config of configs) {
    const unwatch = await watchContractEvents(config, onEvent);
    unwatchers.push(unwatch);
  }

  return () => {
    unwatchers.forEach((unwatch) => unwatch());
  };
}

export function createContractConfig(
  address: Address,
  chain: string = 'ethereum',
  type?: ContractType,
  customAbi?: string[]
): ContractConfig {
  const contractInfo = getContractInfo(address);
  const contractType = type ?? contractInfo?.type ?? 'erc20';

  return {
    address,
    abi: customAbi ?? getAbiForType(contractType),
    events: [],
    chain,
    name: contractInfo?.name,
    type: contractType,
  };
}

export async function getEventSummary(
  contractAddress: Address,
  chain: string = 'ethereum',
  periodHours: number = 24
): Promise<EventSummary> {
  const key = getContractKey(contractAddress, chain);
  const storedEvents = eventStore.get(key) ?? [];
  const contractInfo = getContractInfo(contractAddress);

  const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000);
  const periodEnd = new Date();

  // Filter events within the period
  const eventsInPeriod = storedEvents.filter(
    (e) => e.timestamp >= periodStart && e.timestamp <= periodEnd
  );

  // Count events by name
  const eventCounts: Record<string, number> = {};
  for (const event of eventsInPeriod) {
    const name = event.eventName;
    eventCounts[name] = (eventCounts[name] ?? 0) + 1;
  }

  // Get top events
  const topEvents = Object.entries(eventCounts)
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    contractAddress,
    contractName: contractInfo?.name,
    eventCounts,
    period: {
      start: periodStart,
      end: periodEnd,
    },
    totalEvents: eventsInPeriod.length,
    topEvents,
  };
}

export function getStoredEvents(
  contractAddress: Address,
  chain: string = 'ethereum',
  limit: number = 100
): ContractEvent[] {
  const key = getContractKey(contractAddress, chain);
  const events = eventStore.get(key) ?? [];
  return events.slice(-limit);
}

export function clearStoredEvents(contractAddress?: Address, chain?: string): void {
  if (contractAddress && chain) {
    const key = getContractKey(contractAddress, chain);
    eventStore.delete(key);
  } else {
    eventStore.clear();
  }
}

export const contractEventsProvider = {
  name: 'contract-events',
  description: 'Monitors smart contract events',
  watchContractEvents,
  watchMultipleContracts,
  getEventSummary,
  createContractConfig,
  getContractInfo,
  getAbiForType,
  getStoredEvents,
  clearStoredEvents,
  COMMON_ABIS,
};
