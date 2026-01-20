import { evmClient } from '../services/evm-client';
import { solanaClient } from '../services/solana-client';
import { priceService } from '../services/price-service';
import { tokenRegistry } from '../services/token-registry';
import type { Address } from 'viem';

export interface WhaleTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  valueUsd: number;
  chain: string;
  timestamp: number;
  type: 'transfer' | 'swap' | 'bridge' | 'unknown';
  tokenSymbol?: string;
}

export interface WhaleAlert {
  transaction: WhaleTransaction;
  walletLabel?: string;
  significance: 'high' | 'medium' | 'low';
}

export interface WhaleWallet {
  address: string;
  label: string;
  type: 'exchange' | 'fund' | 'protocol' | 'individual';
}

// Known EVM whale wallets database
const KNOWN_EVM_WHALES: Record<string, WhaleWallet> = {
  // Market Makers
  '0x9507c04b10486547584c37bcbd931b2a4fee9a41': { address: '0x9507c04b10486547584c37bcbd931b2a4fee9a41', label: 'Jump Trading', type: 'fund' },
  '0x00000000ae347930bd1e7b0f35588b92280f9e75': { address: '0x00000000ae347930bd1e7b0f35588b92280f9e75', label: 'Wintermute', type: 'fund' },
  '0xdbf5e9c5206d0db70a90108bf936da60221dc080': { address: '0xdbf5e9c5206d0db70a90108bf936da60221dc080', label: 'Wintermute 2', type: 'fund' },
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe': { address: '0x0d0707963952f2fba59dd06f2b425ace40b492fe', label: 'Alameda Research', type: 'fund' },
  // Exchanges
  '0x28c6c06298d514db089934071355e5743bf21d60': { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549', label: 'Binance 2', type: 'exchange' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d', label: 'Binance 3', type: 'exchange' },
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { address: '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', label: 'Coinbase', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', label: 'Coinbase 2', type: 'exchange' },
  '0x503828976d22510aad0201ac7ec88293211d23da': { address: '0x503828976d22510aad0201ac7ec88293211d23da', label: 'Coinbase 3', type: 'exchange' },
  '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2': { address: '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2', label: 'FTX', type: 'exchange' },
  '0xc098b2a3aa256d2140208c3de6543aaef5cd3a94': { address: '0xc098b2a3aa256d2140208c3de6543aaef5cd3a94', label: 'FTX 2', type: 'exchange' },
  '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852': { address: '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852', label: 'Uniswap V2 ETH/USDT', type: 'protocol' },
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640': { address: '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', label: 'Uniswap V3 ETH/USDC', type: 'protocol' },
  // Bridges
  '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf': { address: '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf', label: 'Polygon Bridge', type: 'protocol' },
  '0x8eb8a3b98659cce290402893d0123abb75e3ab28': { address: '0x8eb8a3b98659cce290402893d0123abb75e3ab28', label: 'Avalanche Bridge', type: 'protocol' },
  '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { address: '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1', label: 'Optimism Bridge', type: 'protocol' },
  '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f': { address: '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f', label: 'Arbitrum Bridge', type: 'protocol' },
};

// Known Solana whale wallets database
const KNOWN_SOLANA_WHALES: Record<string, WhaleWallet> = {
  // Exchanges
  '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9': { address: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', label: 'Binance', type: 'exchange' },
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Binance 2', type: 'exchange' },
  'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS': { address: 'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS', label: 'Coinbase', type: 'exchange' },
  'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE': { address: 'GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE', label: 'Coinbase 2', type: 'exchange' },
  '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S': { address: '2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S', label: 'Kraken', type: 'exchange' },
  'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq': { address: 'CuieVDEDtLo7FypA9SbLM9saXFdb1dsshEkyErMqkRQq', label: 'Kraken 2', type: 'exchange' },
  'AobVSwdW9BbpMdJvTqeCN4hPAmh4rHm7vwLnQ5ATSyrS': { address: 'AobVSwdW9BbpMdJvTqeCN4hPAmh4rHm7vwLnQ5ATSyrS', label: 'OKX', type: 'exchange' },
  // Market Makers / Funds
  '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E': { address: '3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E', label: 'Jump Trading', type: 'fund' },
  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1': { address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', label: 'Raydium Authority', type: 'protocol' },
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', label: 'Jupiter', type: 'protocol' },
  // Protocols / DeFi
  '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin': { address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin', label: 'Serum DEX', type: 'protocol' },
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': { address: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', label: 'Orca Whirlpool', type: 'protocol' },
  'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD': { address: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD', label: 'Marinade Finance', type: 'protocol' },
  // Bridges
  'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb': { address: 'wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb', label: 'Wormhole Bridge', type: 'protocol' },
};

// Combined lookup for all chains
const KNOWN_WHALES: Record<string, WhaleWallet> = {
  ...KNOWN_EVM_WHALES,
  ...KNOWN_SOLANA_WHALES,
};

// Token address to symbol cache for lookups
const tokenSymbolCache: Map<string, string> = new Map();

async function getTokenSymbol(tokenAddress: Address, chain: string): Promise<string> {
  const cacheKey = `${chain}:${tokenAddress.toLowerCase()}`;
  if (tokenSymbolCache.has(cacheKey)) {
    return tokenSymbolCache.get(cacheKey)!;
  }

  const tokenInfo = tokenRegistry.getTokenByAddress(chain, tokenAddress);
  if (tokenInfo) {
    tokenSymbolCache.set(cacheKey, tokenInfo.symbol);
    return tokenInfo.symbol;
  }

  // Default to ETH for native transfers
  return priceService.getNativeToken(chain) ?? 'ETH';
}

function getWhaleLabel(address: string): string | undefined {
  const whale = KNOWN_WHALES[address.toLowerCase()];
  return whale?.label;
}

function determineTransactionType(from: string, to: string | null, chain: string = 'ethereum'): WhaleTransaction['type'] {
  // Solana addresses are case-sensitive, EVM are not
  const normalizeAddress = (addr: string) => chain === 'solana' ? addr : addr.toLowerCase();

  const fromWhale = KNOWN_WHALES[normalizeAddress(from)];
  const toWhale = to ? KNOWN_WHALES[normalizeAddress(to)] : undefined;

  // Bridge detection
  if (fromWhale?.type === 'protocol' || toWhale?.type === 'protocol') {
    const labels = [fromWhale?.label, toWhale?.label].filter(Boolean);
    if (labels.some(l => l?.includes('Bridge') || l?.includes('Wormhole'))) {
      return 'bridge';
    }
    // DEX detection for EVM
    if (labels.some(l => l?.includes('Uniswap'))) {
      return 'swap';
    }
    // DEX detection for Solana
    if (labels.some(l => l?.includes('Raydium') || l?.includes('Jupiter') || l?.includes('Orca') || l?.includes('Serum'))) {
      return 'swap';
    }
    return 'swap';
  }

  return 'transfer';
}

export async function monitorWhaleTransactions(
  tokenAddresses: Address[],
  minValueUsd: number,
  chain: string = 'ethereum',
  onWhaleAlert: (alert: WhaleAlert) => void
): Promise<() => void> {
  const eventAbi = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  const unwatchers: Array<() => void> = [];

  for (const tokenAddress of tokenAddresses) {
    // Get token info for price lookups
    const tokenSymbol = await getTokenSymbol(tokenAddress, chain);

    const unwatch = await evmClient.watchContractEvents(
      tokenAddress,
      eventAbi,
      chain,
      async (event: any) => {
        const value = event.args?.value;
        const from = event.args?.from as Address;
        const to = event.args?.to as Address | null;

        if (!value || !from) return;

        // Get token info for decimals
        const tokenInfo = tokenRegistry.getTokenByAddress(chain, tokenAddress);
        const decimals = tokenInfo?.decimals ?? 18;

        // Calculate actual USD value
        const tokenPrice = await priceService.getPrice(tokenSymbol);
        const valueFormatted = Number(value) / Math.pow(10, decimals);
        const valueUsd = valueFormatted * tokenPrice;

        if (valueUsd >= minValueUsd) {
          const transaction: WhaleTransaction = {
            hash: event.transactionHash,
            from,
            to,
            value: valueFormatted.toString(),
            valueUsd,
            chain,
            timestamp: Date.now(),
            type: determineTransactionType(from, to, chain),
            tokenSymbol,
          };

          const alert: WhaleAlert = {
            transaction,
            walletLabel: getWhaleLabel(from) || (to ? getWhaleLabel(to) : undefined),
            significance:
              valueUsd > 10_000_000 ? 'high' :
              valueUsd > 1_000_000 ? 'medium' : 'low',
          };

          onWhaleAlert(alert);
        }
      }
    );

    unwatchers.push(unwatch);
  }

  return () => {
    unwatchers.forEach((unwatch) => unwatch());
  };
}

export async function getRecentWhaleActivity(
  tokenAddress: Address,
  minValueUsd: number,
  chain: string = 'ethereum',
  limit: number = 20
): Promise<WhaleTransaction[]> {
  // Get token info
  const tokenSymbol = await getTokenSymbol(tokenAddress, chain);
  const tokenInfo = tokenRegistry.getTokenByAddress(chain, tokenAddress);
  const decimals = tokenInfo?.decimals ?? 18;
  const tokenPrice = await priceService.getPrice(tokenSymbol);

  // Get recent transactions from known whale addresses
  const whaleTransactions: WhaleTransaction[] = [];
  const whaleAddresses = Object.keys(KNOWN_WHALES).slice(0, 10); // Check top 10 whales

  for (const whaleAddress of whaleAddresses) {
    try {
      const transactions = await evmClient.getRecentTransactions(
        whaleAddress as Address,
        chain,
        5
      );

      for (const tx of transactions) {
        const valueFormatted = parseFloat(tx.value);
        const valueUsd = valueFormatted * tokenPrice;

        if (valueUsd >= minValueUsd) {
          whaleTransactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            valueUsd,
            chain,
            timestamp: tx.timestamp ?? Date.now(),
            type: determineTransactionType(tx.from, tx.to ?? null, chain),
            tokenSymbol,
          });
        }
      }
    } catch {
      // Skip failed whale lookups
      continue;
    }
  }

  // Sort by value and return top results
  return whaleTransactions
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, limit);
}

/**
 * Monitor Solana whale wallets for large transactions
 * Subscribes to account changes on known whale addresses
 */
export async function monitorSolanaWhaleTransactions(
  minValueUsd: number,
  onWhaleAlert: (alert: WhaleAlert) => void
): Promise<() => void> {
  const subscriptionIds: number[] = [];
  const solPrice = await priceService.getPrice('SOL');

  // Subscribe to known Solana whale addresses
  const solanaWhaleAddresses = Object.keys(KNOWN_SOLANA_WHALES);

  for (const whaleAddress of solanaWhaleAddresses) {
    try {
      const subscriptionId = solanaClient.subscribeToAccount(
        whaleAddress,
        async (accountInfo: any) => {
          // Account change detected - fetch recent transactions
          const recentTxs = await solanaClient.getRecentTransactions(whaleAddress, 1);
          if (recentTxs.length === 0) return;

          const latestTx = recentTxs[0];

          // Get the full transaction to extract value
          const fullTx = await solanaClient.getTransaction(latestTx.signature);
          if (!fullTx?.meta) return;

          // Calculate SOL value from pre/post balances
          const preBalance = fullTx.meta.preBalances[0] ?? 0;
          const postBalance = fullTx.meta.postBalances[0] ?? 0;
          const lamportsDiff = Math.abs(postBalance - preBalance);
          const solValue = lamportsDiff / 1e9; // LAMPORTS_PER_SOL
          const valueUsd = solValue * solPrice;

          if (valueUsd >= minValueUsd) {
            // Determine sender/receiver based on balance change
            const isSending = postBalance < preBalance;
            const from = isSending ? whaleAddress : 'unknown';
            const to = isSending ? 'unknown' : whaleAddress;

            const transaction: WhaleTransaction = {
              hash: latestTx.signature,
              from,
              to,
              value: solValue.toString(),
              valueUsd,
              chain: 'solana',
              timestamp: latestTx.blockTime ? latestTx.blockTime * 1000 : Date.now(),
              type: determineTransactionType(from, to, 'solana'),
              tokenSymbol: 'SOL',
            };

            const alert: WhaleAlert = {
              transaction,
              walletLabel: getWhaleLabel(whaleAddress),
              significance:
                valueUsd > 10_000_000 ? 'high' :
                valueUsd > 1_000_000 ? 'medium' : 'low',
            };

            onWhaleAlert(alert);
          }
        }
      );
      subscriptionIds.push(subscriptionId);
    } catch {
      // Skip failed subscriptions
      continue;
    }
  }

  // Return unsubscribe function
  return async () => {
    for (const id of subscriptionIds) {
      await solanaClient.unsubscribe(id);
    }
  };
}

/**
 * Get recent whale activity on Solana
 */
export async function getRecentSolanaWhaleActivity(
  minValueUsd: number,
  limit: number = 20
): Promise<WhaleTransaction[]> {
  const solPrice = await priceService.getPrice('SOL');
  const whaleTransactions: WhaleTransaction[] = [];

  // Check top Solana whales
  const solanaWhaleAddresses = Object.keys(KNOWN_SOLANA_WHALES).slice(0, 10);

  for (const whaleAddress of solanaWhaleAddresses) {
    try {
      const transactions = await solanaClient.getRecentTransactions(whaleAddress, 5);

      for (const tx of transactions) {
        // Get full transaction for value
        const fullTx = await solanaClient.getTransaction(tx.signature);
        if (!fullTx?.meta) continue;

        // Calculate SOL value
        const preBalance = fullTx.meta.preBalances[0] ?? 0;
        const postBalance = fullTx.meta.postBalances[0] ?? 0;
        const lamportsDiff = Math.abs(postBalance - preBalance);
        const solValue = lamportsDiff / 1e9;
        const valueUsd = solValue * solPrice;

        if (valueUsd >= minValueUsd) {
          const isSending = postBalance < preBalance;

          whaleTransactions.push({
            hash: tx.signature,
            from: isSending ? whaleAddress : 'unknown',
            to: isSending ? 'unknown' : whaleAddress,
            value: solValue.toString(),
            valueUsd,
            chain: 'solana',
            timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
            type: determineTransactionType(whaleAddress, null, 'solana'),
            tokenSymbol: 'SOL',
          });
        }
      }
    } catch {
      // Skip failed lookups
      continue;
    }
  }

  return whaleTransactions
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, limit);
}

/**
 * Get known whales for a specific chain
 */
export function getKnownWhalesByChain(chain: string): WhaleWallet[] {
  if (chain === 'solana') {
    return Object.values(KNOWN_SOLANA_WHALES);
  }
  return Object.values(KNOWN_EVM_WHALES);
}

export function getKnownWhales(): WhaleWallet[] {
  return Object.values(KNOWN_WHALES);
}

export function isKnownWhale(address: string): boolean {
  return address.toLowerCase() in KNOWN_WHALES;
}

export const whaleTransactionsProvider = {
  name: 'whale-transactions',
  description: 'Monitors and reports whale transactions on EVM and Solana chains',
  // EVM functions
  monitorWhaleTransactions,
  getRecentWhaleActivity,
  // Solana functions
  monitorSolanaWhaleTransactions,
  getRecentSolanaWhaleActivity,
  // Utility functions
  getKnownWhales,
  getKnownWhalesByChain,
  isKnownWhale,
};
