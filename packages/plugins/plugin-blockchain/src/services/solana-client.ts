import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  type ParsedTransactionWithMeta,
} from '@solana/web3.js';

export interface SolanaBalance {
  sol: number;
  lamports: number;
}

export interface SolanaTokenBalance {
  mint: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  symbol: string;
  balance: string;
}

export interface SolanaTransaction {
  signature: string;
  slot: number;
  blockTime: number | null;
  fee: number;
  status: 'success' | 'error';
}

export class SolanaClient {
  private connection: Connection;

  constructor(rpcUrl?: string) {
    const url = rpcUrl || process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(url, 'confirmed');
  }

  async getBalance(address: string): Promise<SolanaBalance> {
    const pubkey = new PublicKey(address);
    const lamports = await this.connection.getBalance(pubkey);
    return {
      sol: lamports / LAMPORTS_PER_SOL,
      lamports,
    };
  }

  async getTokenBalances(address: string): Promise<SolanaTokenBalance[]> {
    const pubkey = new PublicKey(address);
    const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    return tokenAccounts.value.map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: info.tokenAmount.amount,
        decimals: info.tokenAmount.decimals,
        uiAmount: info.tokenAmount.uiAmount,
        symbol: '', // Symbol lookup would require token registry
        balance: info.tokenAmount.uiAmountString || info.tokenAmount.uiAmount.toString(),
      };
    });
  }

  async getRecentTransactions(
    address: string,
    limit: number = 10
  ): Promise<SolanaTransaction[]> {
    const pubkey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit,
    });

    return signatures.map((sig) => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime ?? null,
      fee: 0, // Would need to fetch full transaction for fee
      status: sig.err ? 'error' : 'success',
    }));
  }

  async getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
    return this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  }

  async getCurrentSlot(): Promise<number> {
    return this.connection.getSlot();
  }

  async getBlockTime(slot: number): Promise<number | null> {
    return this.connection.getBlockTime(slot);
  }

  subscribeToAccount(
    address: string,
    callback: (accountInfo: unknown) => void
  ): number {
    const pubkey = new PublicKey(address);
    return this.connection.onAccountChange(pubkey, callback);
  }

  unsubscribe(subscriptionId: number): Promise<void> {
    return this.connection.removeAccountChangeListener(subscriptionId);
  }
}

export const solanaClient = new SolanaClient();
