import { evmClient } from '../services/evm-client';
import { solanaClient } from '../services/solana-client';
import type { Address } from 'viem';

export interface AirdropInfo {
  protocol: string;
  status: 'eligible' | 'not_eligible' | 'claimed' | 'unknown' | 'pending';
  estimatedTokens?: number;
  estimatedValueUsd?: number;
  claimDeadline?: Date;
  claimUrl?: string;
  requirements?: string[];
  completedRequirements?: string[];
  chain: string;
  snapshotDate?: Date;
  tokenSymbol?: string;
}

export interface EligibilityCheck {
  wallet: Address;
  chain: string;
  airdrops: AirdropInfo[];
  lastChecked: Date;
  totalPotentialValue?: number;
}

export interface AirdropCampaign {
  protocol: string;
  chain: string;
  status: 'active' | 'upcoming' | 'completed' | 'claiming';
  requirements: AirdropRequirement[];
  snapshotDate?: Date;
  claimStart?: Date;
  claimEnd?: Date;
  claimUrl?: string;
  tokenSymbol?: string;
  totalAllocation?: number;
  minTxCount?: number;
  minVolumeUsd?: number;
  contractAddresses?: Address[];
}

export interface AirdropRequirement {
  description: string;
  type: 'transaction_count' | 'volume' | 'protocol_interaction' | 'bridge' | 'hold_token' | 'time_active' | 'other';
  threshold?: number;
  checkFn?: (address: Address) => Promise<boolean>;
}

// Active and upcoming airdrop campaigns
const AIRDROP_CAMPAIGNS: AirdropCampaign[] = [
  // Live claiming
  {
    protocol: 'Starknet',
    chain: 'starknet',
    status: 'claiming',
    tokenSymbol: 'STRK',
    claimUrl: 'https://provisions.starknet.io/',
    requirements: [
      { description: 'Bridge to Starknet before snapshot', type: 'bridge' },
      { description: 'Make transactions on Starknet', type: 'transaction_count', threshold: 5 },
      { description: 'Interact with Starknet dApps', type: 'protocol_interaction' },
    ],
    snapshotDate: new Date('2024-02-14'),
    claimStart: new Date('2024-02-20'),
  },
  // Upcoming/speculative
  {
    protocol: 'LayerZero',
    chain: 'ethereum',
    status: 'upcoming',
    tokenSymbol: 'ZRO',
    requirements: [
      { description: 'Use LayerZero bridges (Stargate, etc.)', type: 'bridge', threshold: 3 },
      { description: 'Bridge to multiple chains', type: 'protocol_interaction', threshold: 5 },
      { description: 'Maintain bridge activity over time', type: 'time_active' },
      { description: 'Volume > $1,000', type: 'volume', threshold: 1000 },
    ],
    minTxCount: 10,
    minVolumeUsd: 1000,
    contractAddresses: [
      '0x8731d54E9D02c286767d56ac03e8037C07e01e98' as Address, // Stargate Router
    ],
  },
  {
    protocol: 'zkSync Era',
    chain: 'zksync',
    status: 'upcoming',
    requirements: [
      { description: 'Bridge ETH to zkSync Era', type: 'bridge' },
      { description: 'Make 10+ transactions', type: 'transaction_count', threshold: 10 },
      { description: 'Use native DEXs (SyncSwap, Mute)', type: 'protocol_interaction' },
      { description: 'Deploy a smart contract', type: 'other' },
      { description: 'Be active across multiple months', type: 'time_active' },
    ],
    minTxCount: 10,
    minVolumeUsd: 500,
  },
  {
    protocol: 'Scroll',
    chain: 'scroll',
    status: 'upcoming',
    requirements: [
      { description: 'Bridge to Scroll mainnet', type: 'bridge' },
      { description: 'Interact with Scroll dApps', type: 'protocol_interaction' },
      { description: 'Make 5+ transactions', type: 'transaction_count', threshold: 5 },
      { description: 'Provide liquidity', type: 'other' },
    ],
    minTxCount: 5,
  },
  {
    protocol: 'Linea',
    chain: 'linea',
    status: 'upcoming',
    requirements: [
      { description: 'Bridge to Linea', type: 'bridge' },
      { description: 'Complete Linea Voyage tasks', type: 'protocol_interaction' },
      { description: 'Use Linea DEXs', type: 'protocol_interaction' },
      { description: 'Make 10+ transactions', type: 'transaction_count', threshold: 10 },
    ],
    minTxCount: 10,
  },
  {
    protocol: 'Base',
    chain: 'base',
    status: 'upcoming',
    requirements: [
      { description: 'Bridge to Base', type: 'bridge' },
      { description: 'Use native dApps (Aerodrome, etc.)', type: 'protocol_interaction' },
      { description: 'Hold NFTs on Base', type: 'hold_token' },
      { description: 'Active user over time', type: 'time_active' },
    ],
    minTxCount: 20,
  },
  {
    protocol: 'Blast',
    chain: 'blast',
    status: 'active',
    tokenSymbol: 'BLAST',
    requirements: [
      { description: 'Bridge ETH/USDB to Blast', type: 'bridge' },
      { description: 'Earn Blast Points', type: 'protocol_interaction' },
      { description: 'Earn Gold through dApps', type: 'protocol_interaction' },
      { description: 'Maintain deposits over time', type: 'time_active' },
    ],
    claimUrl: 'https://blast.io/',
  },
  {
    protocol: 'Eigenlayer',
    chain: 'ethereum',
    status: 'active',
    tokenSymbol: 'EIGEN',
    requirements: [
      { description: 'Restake ETH or LSTs', type: 'protocol_interaction' },
      { description: 'Earn Eigenlayer points', type: 'other' },
      { description: 'Delegate to operators', type: 'protocol_interaction' },
    ],
    contractAddresses: [
      '0x858646372CC42E1A627fcE94aa7A7033e7CF075A' as Address, // Eigenlayer Strategy Manager
    ],
  },
];

// Solana-specific airdrop campaigns
const SOLANA_AIRDROP_CAMPAIGNS: AirdropCampaign[] = [
  {
    protocol: 'Jupiter',
    chain: 'solana',
    status: 'active',
    tokenSymbol: 'JUP',
    claimUrl: 'https://jup.ag/airdrop',
    requirements: [
      { description: 'Use Jupiter aggregator for swaps', type: 'protocol_interaction' },
      { description: 'Swap volume > $1,000', type: 'volume', threshold: 1000 },
      { description: 'Active before snapshot date', type: 'time_active' },
    ],
    minTxCount: 5,
    minVolumeUsd: 1000,
  },
  {
    protocol: 'Tensor',
    chain: 'solana',
    status: 'active',
    tokenSymbol: 'TNSR',
    claimUrl: 'https://www.tensor.trade/',
    requirements: [
      { description: 'Trade NFTs on Tensor', type: 'protocol_interaction' },
      { description: 'List NFTs on Tensor', type: 'other' },
      { description: 'Earn Tensor points', type: 'other' },
    ],
    minTxCount: 10,
  },
  {
    protocol: 'Marinade',
    chain: 'solana',
    status: 'active',
    tokenSymbol: 'MNDE',
    claimUrl: 'https://marinade.finance/',
    requirements: [
      { description: 'Stake SOL with Marinade', type: 'protocol_interaction' },
      { description: 'Hold mSOL', type: 'hold_token' },
      { description: 'Provide liquidity for mSOL', type: 'other' },
    ],
  },
  {
    protocol: 'Kamino',
    chain: 'solana',
    status: 'active',
    tokenSymbol: 'KMNO',
    requirements: [
      { description: 'Use Kamino vaults', type: 'protocol_interaction' },
      { description: 'Provide liquidity', type: 'other' },
      { description: 'Earn Kamino points', type: 'other' },
    ],
    minVolumeUsd: 500,
  },
  {
    protocol: 'Parcl',
    chain: 'solana',
    status: 'upcoming',
    tokenSymbol: 'PRCL',
    requirements: [
      { description: 'Trade real estate indices on Parcl', type: 'protocol_interaction' },
      { description: 'Hold positions over time', type: 'time_active' },
      { description: 'Earn Parcl points', type: 'other' },
    ],
  },
  {
    protocol: 'Drift',
    chain: 'solana',
    status: 'active',
    tokenSymbol: 'DRIFT',
    claimUrl: 'https://www.drift.trade/',
    requirements: [
      { description: 'Trade perpetuals on Drift', type: 'protocol_interaction' },
      { description: 'Trading volume > $5,000', type: 'volume', threshold: 5000 },
      { description: 'Maintain positions', type: 'time_active' },
    ],
    minTxCount: 20,
    minVolumeUsd: 5000,
  },
  {
    protocol: 'Marginfi',
    chain: 'solana',
    status: 'active',
    tokenSymbol: 'MRGN',
    requirements: [
      { description: 'Lend or borrow on Marginfi', type: 'protocol_interaction' },
      { description: 'Earn points through activity', type: 'other' },
      { description: 'Maintain deposits over time', type: 'time_active' },
    ],
  },
];

// Cache for eligibility checks
const eligibilityCache: Map<string, { result: EligibilityCheck; timestamp: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function checkWalletActivity(address: string, chain: string): Promise<{
  txCount: number;
  hasActivity: boolean;
}> {
  try {
    if (chain === 'solana') {
      const transactions = await solanaClient.getRecentTransactions(address, 50);
      return {
        txCount: transactions.length,
        hasActivity: transactions.length > 0,
      };
    }
    const transactions = await evmClient.getRecentTransactions(address as Address, chain, 50);
    return {
      txCount: transactions.length,
      hasActivity: transactions.length > 0,
    };
  } catch {
    return { txCount: 0, hasActivity: false };
  }
}

// Combined campaigns for all chains
const ALL_AIRDROP_CAMPAIGNS = [...AIRDROP_CAMPAIGNS, ...SOLANA_AIRDROP_CAMPAIGNS];

async function checkSingleAirdrop(
  address: string,
  campaign: AirdropCampaign
): Promise<AirdropInfo> {
  const completedRequirements: string[] = [];
  let meetsMinRequirements = false;

  // Check on-chain activity for supported chains
  const supportedChains = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'solana'];
  if (supportedChains.includes(campaign.chain)) {
    try {
      const activity = await checkWalletActivity(address, campaign.chain);

      // Check transaction count requirement
      if (campaign.minTxCount && activity.txCount >= campaign.minTxCount) {
        completedRequirements.push(`Made ${activity.txCount} transactions`);
        meetsMinRequirements = true;
      }

      if (activity.hasActivity) {
        completedRequirements.push('Has on-chain activity');
      }
    } catch {
      // Unable to check, status unknown
    }
  }

  // Determine status
  let status: AirdropInfo['status'] = 'unknown';
  if (campaign.status === 'claiming') {
    status = completedRequirements.length > 0 ? 'eligible' : 'unknown';
  } else if (campaign.status === 'completed') {
    status = 'claimed';
  } else if (meetsMinRequirements || completedRequirements.length >= 2) {
    status = 'eligible';
  } else if (completedRequirements.length > 0) {
    status = 'pending'; // Some progress but not fully eligible yet
  }

  return {
    protocol: campaign.protocol,
    status,
    requirements: campaign.requirements.map((r) => r.description),
    completedRequirements,
    chain: campaign.chain,
    claimUrl: campaign.claimUrl,
    claimDeadline: campaign.claimEnd,
    snapshotDate: campaign.snapshotDate,
    tokenSymbol: campaign.tokenSymbol,
  };
}

export async function checkAirdropEligibility(
  walletAddress: string,
  protocols?: string[],
  chain?: string
): Promise<EligibilityCheck> {
  const cacheKey = `${walletAddress}:${chain ?? 'all'}:${protocols?.join(',') ?? 'all'}`;
  const cached = eligibilityCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  let campaignsToCheck = ALL_AIRDROP_CAMPAIGNS;

  // Filter by chain if specified
  if (chain) {
    campaignsToCheck = campaignsToCheck.filter((c) => c.chain === chain);
  }

  // Filter by protocol if specified
  if (protocols) {
    campaignsToCheck = campaignsToCheck.filter((c) => protocols.includes(c.protocol));
  }

  const airdropPromises = campaignsToCheck.map((campaign) =>
    checkSingleAirdrop(walletAddress, campaign)
  );

  const airdrops = await Promise.all(airdropPromises);

  const result: EligibilityCheck = {
    wallet: walletAddress as Address,
    chain: chain ?? 'multi-chain',
    airdrops,
    lastChecked: new Date(),
    totalPotentialValue: airdrops
      .filter((a) => a.status === 'eligible')
      .reduce((sum, a) => sum + (a.estimatedValueUsd ?? 0), 0),
  };

  eligibilityCache.set(cacheKey, { result, timestamp: Date.now() });

  return result;
}

/**
 * Check Solana-specific airdrop eligibility
 */
export async function checkSolanaAirdropEligibility(
  walletAddress: string,
  protocols?: string[]
): Promise<EligibilityCheck> {
  return checkAirdropEligibility(walletAddress, protocols, 'solana');
}

export async function getClaimableAirdrops(
  walletAddress: Address
): Promise<AirdropInfo[]> {
  const eligibility = await checkAirdropEligibility(walletAddress);
  return eligibility.airdrops.filter(
    (a) => a.status === 'eligible' && a.claimUrl
  );
}

export async function getPendingAirdrops(
  walletAddress: Address
): Promise<AirdropInfo[]> {
  const eligibility = await checkAirdropEligibility(walletAddress);
  return eligibility.airdrops.filter((a) => a.status === 'pending');
}

export function getUpcomingAirdrops(chain?: string): Array<{
  protocol: string;
  chain: string;
  status: AirdropCampaign['status'];
  requirements: string[];
  estimatedLaunch?: string;
  tokenSymbol?: string;
}> {
  let campaigns = ALL_AIRDROP_CAMPAIGNS;
  if (chain) {
    campaigns = campaigns.filter((c) => c.chain === chain);
  }
  return campaigns.filter(
    (c) => c.status === 'upcoming' || c.status === 'active'
  ).map((c) => ({
    protocol: c.protocol,
    chain: c.chain,
    status: c.status,
    requirements: c.requirements.map((r) => r.description),
    tokenSymbol: c.tokenSymbol,
    estimatedLaunch: c.status === 'upcoming' ? 'TBD' : undefined,
  }));
}

export function getSolanaUpcomingAirdrops(): Array<{
  protocol: string;
  chain: string;
  status: AirdropCampaign['status'];
  requirements: string[];
  estimatedLaunch?: string;
  tokenSymbol?: string;
}> {
  return getUpcomingAirdrops('solana');
}

export function getActiveAirdrops(chain?: string): AirdropCampaign[] {
  let campaigns = ALL_AIRDROP_CAMPAIGNS;
  if (chain) {
    campaigns = campaigns.filter((c) => c.chain === chain);
  }
  return campaigns.filter(
    (c) => c.status === 'active' || c.status === 'claiming'
  );
}

export function getSolanaActiveAirdrops(): AirdropCampaign[] {
  return getActiveAirdrops('solana');
}

export function getAirdropByProtocol(protocol: string): AirdropCampaign | undefined {
  return ALL_AIRDROP_CAMPAIGNS.find(
    (c) => c.protocol.toLowerCase() === protocol.toLowerCase()
  );
}

export function clearEligibilityCache(): void {
  eligibilityCache.clear();
}

export const airdropEligibilityProvider = {
  name: 'airdrop-eligibility',
  description: 'Checks wallet eligibility for airdrops on EVM and Solana chains',
  // General functions
  checkAirdropEligibility,
  getClaimableAirdrops,
  getPendingAirdrops,
  getUpcomingAirdrops,
  getActiveAirdrops,
  getAirdropByProtocol,
  clearEligibilityCache,
  // Solana-specific functions
  checkSolanaAirdropEligibility,
  getSolanaUpcomingAirdrops,
  getSolanaActiveAirdrops,
};
