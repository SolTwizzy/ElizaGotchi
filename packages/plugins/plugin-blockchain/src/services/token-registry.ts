/**
 * Token registry for common tokens across EVM chains
 */

import type { Address } from 'viem';

export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
}

// Common tokens on Ethereum mainnet
const ETHEREUM_TOKENS: TokenInfo[] = [
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
  },
  {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'ChainLink Token',
    decimals: 18,
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    symbol: 'AAVE',
    name: 'Aave Token',
    decimals: 18,
  },
  {
    address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    symbol: 'stETH',
    name: 'Lido Staked ETH',
    decimals: 18,
  },
  {
    address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
    symbol: 'cbETH',
    name: 'Coinbase Wrapped Staked ETH',
    decimals: 18,
  },
  {
    address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
    symbol: 'rETH',
    name: 'Rocket Pool ETH',
    decimals: 18,
  },
];

// Common tokens on Polygon
const POLYGON_TOKENS: TokenInfo[] = [
  {
    address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    symbol: 'WMATIC',
    name: 'Wrapped Matic',
    decimals: 18,
  },
];

// Common tokens on Arbitrum
const ARBITRUM_TOKENS: TokenInfo[] = [
  {
    address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
  },
];

// Common tokens on Optimism
const OPTIMISM_TOKENS: TokenInfo[] = [
  {
    address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x4200000000000000000000000000000000000042',
    symbol: 'OP',
    name: 'Optimism',
    decimals: 18,
  },
];

// Common tokens on Base
const BASE_TOKENS: TokenInfo[] = [
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
  },
];

const TOKEN_REGISTRY: Record<string, TokenInfo[]> = {
  ethereum: ETHEREUM_TOKENS,
  polygon: POLYGON_TOKENS,
  arbitrum: ARBITRUM_TOKENS,
  optimism: OPTIMISM_TOKENS,
  base: BASE_TOKENS,
};

class TokenRegistry {
  getTokensForChain(chain: string): TokenInfo[] {
    return TOKEN_REGISTRY[chain] ?? [];
  }

  getTokenBySymbol(chain: string, symbol: string): TokenInfo | undefined {
    const tokens = this.getTokensForChain(chain);
    return tokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase());
  }

  getTokenByAddress(chain: string, address: string): TokenInfo | undefined {
    const tokens = this.getTokensForChain(chain);
    return tokens.find((t) => t.address.toLowerCase() === address.toLowerCase());
  }

  getAllChains(): string[] {
    return Object.keys(TOKEN_REGISTRY);
  }

  getStablecoins(chain: string): TokenInfo[] {
    const stablecoinSymbols = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'];
    return this.getTokensForChain(chain).filter((t) =>
      stablecoinSymbols.includes(t.symbol.toUpperCase())
    );
  }

  getWrappedNativeToken(chain: string): TokenInfo | undefined {
    const wrappedSymbols: Record<string, string> = {
      ethereum: 'WETH',
      polygon: 'WMATIC',
      arbitrum: 'WETH',
      optimism: 'WETH',
      base: 'WETH',
    };
    const symbol = wrappedSymbols[chain];
    if (!symbol) return undefined;
    return this.getTokenBySymbol(chain, symbol);
  }
}

export const tokenRegistry = new TokenRegistry();
