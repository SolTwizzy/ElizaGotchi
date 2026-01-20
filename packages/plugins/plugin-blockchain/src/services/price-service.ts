/**
 * Price service using CoinGecko API for fetching cryptocurrency prices
 */

export interface TokenPrice {
  id: string;
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  lastUpdated: Date;
}

export interface PriceCache {
  prices: Map<string, TokenPrice>;
  lastFetch: Date;
}

// CoinGecko IDs for common tokens
const COINGECKO_IDS: Record<string, string> = {
  // Native tokens
  ETH: 'ethereum',
  MATIC: 'matic-network',
  ARB: 'arbitrum',
  OP: 'optimism',
  SOL: 'solana',
  // Stablecoins
  USDC: 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  // Popular tokens
  WETH: 'weth',
  WBTC: 'wrapped-bitcoin',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  CRV: 'curve-dao-token',
  LDO: 'lido-dao',
  RPL: 'rocket-pool',
  cbETH: 'coinbase-wrapped-staked-eth',
  rETH: 'rocket-pool-eth',
  stETH: 'staked-ether',
};

// Chain native token mapping
const CHAIN_NATIVE_TOKENS: Record<string, string> = {
  ethereum: 'ETH',
  polygon: 'MATIC',
  arbitrum: 'ETH',
  optimism: 'ETH',
  base: 'ETH',
  solana: 'SOL',
};

class PriceService {
  // Internal cache (not part of public API)
  _cache: PriceCache = {
    prices: new Map(),
    lastFetch: new Date(0),
  };
  _cacheTtlMs = 60_000; // 1 minute cache

  async getPrice(symbol: string): Promise<number> {
    const normalizedSymbol = symbol.toUpperCase();
    const cached = this.getCachedPrice(normalizedSymbol);
    if (cached !== null) return cached;

    await this.fetchPrices([normalizedSymbol]);
    return this._cache.prices.get(normalizedSymbol)?.currentPrice ?? 0;
  }

  async getPrices(symbols: string[]): Promise<Map<string, number>> {
    const normalizedSymbols = symbols.map((s) => s.toUpperCase());
    const result = new Map<string, number>();

    // Check which symbols need fetching
    const needsFetch: string[] = [];
    for (const symbol of normalizedSymbols) {
      const cached = this.getCachedPrice(symbol);
      if (cached !== null) {
        result.set(symbol, cached);
      } else {
        needsFetch.push(symbol);
      }
    }

    if (needsFetch.length > 0) {
      await this.fetchPrices(needsFetch);
      for (const symbol of needsFetch) {
        result.set(symbol, this._cache.prices.get(symbol)?.currentPrice ?? 0);
      }
    }

    return result;
  }

  async getNativeTokenPrice(chain: string): Promise<number> {
    const nativeToken = CHAIN_NATIVE_TOKENS[chain];
    if (!nativeToken) return 0;
    return this.getPrice(nativeToken);
  }

  async getTokenPriceData(symbol: string): Promise<TokenPrice | null> {
    const normalizedSymbol = symbol.toUpperCase();
    await this.fetchPrices([normalizedSymbol]);
    return this._cache.prices.get(normalizedSymbol) ?? null;
  }

  // Internal method
  getCachedPrice(symbol: string): number | null {
    const cached = this._cache.prices.get(symbol);
    if (!cached) return null;

    const now = Date.now();
    const cacheAge = now - this._cache.lastFetch.getTime();
    if (cacheAge > this._cacheTtlMs) return null;

    return cached.currentPrice;
  }

  // Internal method
  async fetchPrices(symbols: string[]): Promise<void> {
    const coingeckoIds = symbols
      .map((s) => COINGECKO_IDS[s])
      .filter(Boolean)
      .join(',');

    if (!coingeckoIds) return;

    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = (await response.json()) as Record<
        string,
        { usd: number; usd_24h_change?: number }
      >;

      const now = new Date();
      this._cache.lastFetch = now;

      // Map CoinGecko IDs back to symbols and store
      for (const symbol of symbols) {
        const coingeckoId = COINGECKO_IDS[symbol];
        if (coingeckoId && data[coingeckoId]) {
          this._cache.prices.set(symbol, {
            id: coingeckoId,
            symbol,
            currentPrice: data[coingeckoId].usd,
            priceChange24h: data[coingeckoId].usd_24h_change ?? 0,
            lastUpdated: now,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch prices from CoinGecko:', error);
    }
  }

  clearCache(): void {
    this._cache.prices.clear();
    this._cache.lastFetch = new Date(0);
  }

  getCoingeckoId(symbol: string): string | undefined {
    return COINGECKO_IDS[symbol.toUpperCase()];
  }

  getNativeToken(chain: string): string | undefined {
    return CHAIN_NATIVE_TOKENS[chain];
  }
}

export const priceService = new PriceService();
