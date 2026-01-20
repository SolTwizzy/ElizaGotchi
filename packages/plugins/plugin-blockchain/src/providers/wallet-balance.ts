import { evmClient, type TokenBalance } from '../services/evm-client';
import { solanaClient, type SolanaTokenBalance } from '../services/solana-client';
import { priceService } from '../services/price-service';
import { tokenRegistry } from '../services/token-registry';
import type { Address } from 'viem';

export interface TokenBalanceWithUsd extends TokenBalance {
  priceUsd: number;
  valueUsd: number;
}

export interface SolanaTokenBalanceWithUsd extends SolanaTokenBalance {
  priceUsd: number;
  valueUsd: number;
}

export interface WalletPortfolio {
  address: string;
  chain: string;
  nativeBalance: string;
  nativeBalanceUsd: number;
  tokens: TokenBalanceWithUsd[] | SolanaTokenBalanceWithUsd[];
  totalValueUsd: number;
}

export interface PortfolioSummary {
  wallets: WalletPortfolio[];
  totalValueUsd: number;
  lastUpdated: Date;
}

export async function getEVMWalletBalance(
  address: Address,
  chain: string = 'ethereum'
): Promise<WalletPortfolio> {
  const nativeBalance = await evmClient.getBalance(address, chain);

  // Get native token price
  const nativeTokenPrice = await priceService.getNativeTokenPrice(chain);
  const nativeBalanceUsd = parseFloat(nativeBalance) * nativeTokenPrice;

  // Fetch balances for registered tokens
  const registeredTokens = tokenRegistry.getTokensForChain(chain);
  const tokenBalances: TokenBalanceWithUsd[] = [];

  // Collect symbols for batch price fetch
  const symbols = registeredTokens.map((t) => t.symbol);
  const prices = await priceService.getPrices(symbols);

  for (const tokenInfo of registeredTokens) {
    try {
      const balance = await evmClient.getTokenBalance(address, tokenInfo.address, chain);
      const balanceNum = parseFloat(balance.balanceFormatted);

      if (balanceNum > 0) {
        const priceUsd = prices.get(tokenInfo.symbol) ?? 0;
        const valueUsd = balanceNum * priceUsd;

        tokenBalances.push({
          ...balance,
          priceUsd,
          valueUsd,
        });
      }
    } catch {
      // Token might not be held or contract call failed
      continue;
    }
  }

  const tokensValueUsd = tokenBalances.reduce((sum, t) => sum + t.valueUsd, 0);

  return {
    address,
    chain,
    nativeBalance,
    nativeBalanceUsd,
    tokens: tokenBalances,
    totalValueUsd: nativeBalanceUsd + tokensValueUsd,
  };
}

export async function getSolanaWalletBalance(
  address: string
): Promise<WalletPortfolio> {
  const balance = await solanaClient.getBalance(address);
  const tokens = await solanaClient.getTokenBalances(address);

  // Get SOL price
  const solPrice = await priceService.getPrice('SOL');
  const nativeBalanceUsd = balance.sol * solPrice;

  // Add USD values to tokens
  const symbols = tokens.map((t) => t.symbol).filter(Boolean);
  const prices = await priceService.getPrices(symbols);

  const tokensWithUsd: SolanaTokenBalanceWithUsd[] = tokens.map((token) => {
    const priceUsd = prices.get(token.symbol) ?? 0;
    const balanceNum = parseFloat(token.balance);
    return {
      ...token,
      priceUsd,
      valueUsd: balanceNum * priceUsd,
    };
  });

  const tokensValueUsd = tokensWithUsd.reduce((sum, t) => sum + t.valueUsd, 0);

  return {
    address,
    chain: 'solana',
    nativeBalance: balance.sol.toString(),
    nativeBalanceUsd,
    tokens: tokensWithUsd,
    totalValueUsd: nativeBalanceUsd + tokensValueUsd,
  };
}

export async function getPortfolioSummary(
  walletAddresses: Array<{ address: string; chain: string }>
): Promise<PortfolioSummary> {
  const walletPromises = walletAddresses.map(async ({ address, chain }) => {
    if (chain === 'solana') {
      return getSolanaWalletBalance(address);
    }
    return getEVMWalletBalance(address as Address, chain);
  });

  const wallets = await Promise.all(walletPromises);
  const totalValueUsd = wallets.reduce((sum, w) => sum + w.totalValueUsd, 0);

  return {
    wallets,
    totalValueUsd,
    lastUpdated: new Date(),
  };
}

export const walletBalanceProvider = {
  name: 'wallet-balance',
  description: 'Provides wallet balance information across chains',
  getEVMWalletBalance,
  getSolanaWalletBalance,
  getPortfolioSummary,
};
