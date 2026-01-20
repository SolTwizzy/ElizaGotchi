import {
  createPublicClient,
  http,
  formatEther,
  formatUnits,
  parseAbi,
  type Address,
  type PublicClient,
  type Chain,
} from 'viem';
import { mainnet, polygon, arbitrum, optimism, base } from 'viem/chains';

const CHAINS: Record<string, Chain> = {
  ethereum: mainnet,
  polygon: polygon,
  arbitrum: arbitrum,
  optimism: optimism,
  base: base,
};

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  balanceFormatted: string;
  decimals: number;
}

export interface Transaction {
  hash: string;
  from: Address;
  to: Address | null;
  value: string;
  blockNumber: bigint;
  timestamp?: number;
}

export interface GasPrice {
  chain: string;
  baseFee: string;
  priorityFee: string;
  totalGwei: number;
  usdCost: number;
}

export class EVMClient {
  private clients: Map<string, PublicClient> = new Map();
  private alchemyApiKey: string;

  constructor(alchemyApiKey?: string) {
    this.alchemyApiKey = alchemyApiKey || process.env.ALCHEMY_API_KEY || '';
    this.initializeClients();
  }

  private initializeClients(): void {
    for (const [name, chain] of Object.entries(CHAINS)) {
      const rpcUrl = this.getRpcUrl(name);
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl),
      });
      this.clients.set(name, client);
    }
  }

  private getRpcUrl(chain: string): string {
    const urls: Record<string, string> = {
      ethereum: `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      polygon: `https://polygon-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      optimism: `https://opt-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
      base: `https://base-mainnet.g.alchemy.com/v2/${this.alchemyApiKey}`,
    };
    return urls[chain] || urls.ethereum;
  }

  private getClient(chain: string): PublicClient {
    const client = this.clients.get(chain);
    if (!client) {
      throw new Error(`Client not found for chain: ${chain}`);
    }
    return client;
  }

  async getBalance(address: Address, chain: string = 'ethereum'): Promise<string> {
    const client = this.getClient(chain);
    const balance = await client.getBalance({ address });
    return formatEther(balance);
  }

  async getTokenBalance(
    walletAddress: Address,
    tokenAddress: Address,
    chain: string = 'ethereum'
  ): Promise<TokenBalance> {
    const client = this.getClient(chain);

    const erc20Abi = parseAbi([
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function name() view returns (string)',
    ]);

    const [balance, decimals, symbol, name] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      }),
    ]);

    return {
      token: name as string,
      symbol: symbol as string,
      balance: (balance as bigint).toString(),
      balanceFormatted: formatUnits(balance as bigint, decimals as number),
      decimals: decimals as number,
    };
  }

  async getGasPrice(
    chain: string = 'ethereum',
    nativeTokenPriceUsd?: number
  ): Promise<GasPrice> {
    const client = this.getClient(chain);
    const block = await client.getBlock();
    const gasPrice = await client.getGasPrice();

    const baseFeeGwei = block.baseFeePerGas
      ? Number(formatUnits(block.baseFeePerGas, 9))
      : 0;
    const gasPriceGwei = Number(formatUnits(gasPrice, 9));
    const priorityFeeGwei = gasPriceGwei - baseFeeGwei;

    // Use provided price or default to 0 (caller should fetch from price service)
    const ethPriceUsd = nativeTokenPriceUsd ?? 0;
    const usdCost = (gasPriceGwei * 21000 * ethPriceUsd) / 1e9;

    return {
      chain,
      baseFee: baseFeeGwei.toFixed(2),
      priorityFee: priorityFeeGwei.toFixed(2),
      totalGwei: gasPriceGwei,
      usdCost,
    };
  }

  async watchContractEvents(
    contractAddress: Address,
    eventAbi: string[],
    chain: string = 'ethereum',
    onEvent: (event: unknown) => void
  ): Promise<() => void> {
    const client = this.getClient(chain);
    const abi = parseAbi(eventAbi);

    const unwatch = client.watchContractEvent({
      address: contractAddress,
      abi,
      onLogs: (logs) => {
        logs.forEach((log) => onEvent(log));
      },
    });

    return unwatch;
  }

  async getRecentTransactions(
    address: Address,
    chain: string = 'ethereum',
    limit: number = 10
  ): Promise<Transaction[]> {
    const client = this.getClient(chain);
    const blockNumber = await client.getBlockNumber();

    // Get recent blocks and filter for transactions involving this address
    const transactions: Transaction[] = [];
    let currentBlock = blockNumber;

    while (transactions.length < limit && currentBlock > blockNumber - 100n) {
      const block = await client.getBlock({
        blockNumber: currentBlock,
        includeTransactions: true,
      });

      for (const tx of block.transactions) {
        if (typeof tx === 'object') {
          if (tx.from.toLowerCase() === address.toLowerCase() ||
              tx.to?.toLowerCase() === address.toLowerCase()) {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: formatEther(tx.value),
              blockNumber: tx.blockNumber || currentBlock,
            });
          }
        }
      }

      currentBlock--;
    }

    return transactions.slice(0, limit);
  }
}

export const evmClient = new EVMClient();
