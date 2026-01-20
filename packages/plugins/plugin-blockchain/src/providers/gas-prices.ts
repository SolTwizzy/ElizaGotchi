import { evmClient, type GasPrice } from '../services/evm-client';
import { priceService } from '../services/price-service';

export interface GasAlert {
  chain: string;
  currentGwei: number;
  threshold: number;
  type: 'low' | 'high';
  timestamp: Date;
}

export interface GasHistory {
  chain: string;
  prices: Array<{
    timestamp: Date;
    gwei: number;
  }>;
  average: number;
  min: number;
  max: number;
}

const DEFAULT_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'];

export async function getCurrentGasPrices(
  chains: string[] = DEFAULT_CHAINS
): Promise<GasPrice[]> {
  // Fetch native token prices for all chains
  const nativeSymbols = chains.map((chain) => priceService.getNativeToken(chain) ?? 'ETH');
  const prices = await priceService.getPrices(nativeSymbols);

  const pricePromises = chains.map(async (chain) => {
    const nativeSymbol = priceService.getNativeToken(chain) ?? 'ETH';
    const nativePrice = prices.get(nativeSymbol) ?? 0;
    return evmClient.getGasPrice(chain, nativePrice);
  });

  return Promise.all(pricePromises);
}

export async function monitorGasPrices(
  lowThreshold: number,
  highThreshold: number,
  chains: string[] = ['ethereum'],
  onAlert: (alert: GasAlert) => void,
  intervalMs: number = 30000
): Promise<() => void> {
  const checkGas = async () => {
    for (const chain of chains) {
      try {
        const gasPrice = await evmClient.getGasPrice(chain);

        if (gasPrice.totalGwei <= lowThreshold) {
          onAlert({
            chain,
            currentGwei: gasPrice.totalGwei,
            threshold: lowThreshold,
            type: 'low',
            timestamp: new Date(),
          });
        } else if (gasPrice.totalGwei >= highThreshold) {
          onAlert({
            chain,
            currentGwei: gasPrice.totalGwei,
            threshold: highThreshold,
            type: 'high',
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error(`Error checking gas for ${chain}:`, error);
      }
    }
  };

  // Initial check
  await checkGas();

  // Set up interval
  const intervalId = setInterval(checkGas, intervalMs);

  return () => {
    clearInterval(intervalId);
  };
}

export async function getOptimalTransactionTime(
  chain: string = 'ethereum',
  targetGwei: number
): Promise<{
  likelihood: 'high' | 'medium' | 'low';
  suggestedTime?: string;
  currentGwei: number;
}> {
  const gasPrice = await evmClient.getGasPrice(chain);

  if (gasPrice.totalGwei <= targetGwei) {
    return {
      likelihood: 'high',
      suggestedTime: 'Now',
      currentGwei: gasPrice.totalGwei,
    };
  }

  // In production, would analyze historical patterns
  const likelihood = gasPrice.totalGwei > targetGwei * 2 ? 'low' : 'medium';

  return {
    likelihood,
    suggestedTime: 'Weekends, early morning UTC',
    currentGwei: gasPrice.totalGwei,
  };
}

export const gasPricesProvider = {
  name: 'gas-prices',
  description: 'Monitors and reports gas prices across chains',
  getCurrentGasPrices,
  monitorGasPrices,
  getOptimalTransactionTime,
};
