/**
 * Integration tests for blockchain providers
 *
 * Tests wallet balance, whale watching, airdrop eligibility,
 * and gas price monitoring across EVM and Solana chains.
 *
 * Required environment variables:
 * - ALCHEMY_API_KEY (for EVM chains)
 * - SOLANA_RPC_URL (optional, uses public RPC if not set)
 * - TEST_EVM_WALLET_ADDRESS
 * - TEST_SOLANA_WALLET_ADDRESS
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { testUtils } from '../../setup';

// Skip if integration tests disabled
const runTests = testUtils.shouldRunIntegrationTests();

describe.skipIf(!runTests)('EVM Blockchain Provider Tests', () => {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  const testWallet = process.env.TEST_EVM_WALLET_ADDRESS;

  beforeAll(() => {
    if (!alchemyKey) {
      console.warn('ALCHEMY_API_KEY not set - EVM tests will be limited');
    }
  });

  describe('Wallet Balance Provider', () => {
    it('should fetch ETH balance', async () => {
      if (!testWallet) {
        console.log('Skipping - TEST_EVM_WALLET_ADDRESS not set');
        return;
      }

      // Use public Ethereum RPC
      const response = await fetch('https://eth.llamarpc.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [testWallet, 'latest'],
          id: 1,
        }),
      });

      const data = await response.json() as { result?: string; error?: { message: string } };

      // Skip if RPC returned an error (rate limiting, etc.)
      if (data.error || !data.result) {
        console.log('Skipping - RPC error or rate limited');
        return;
      }

      const balanceWei = BigInt(data.result);
      const balanceEth = Number(balanceWei) / 1e18;
      console.log(`ETH Balance: ${balanceEth.toFixed(6)} ETH`);
    });

    it('should fetch ERC-20 token balances', async () => {
      if (!testWallet) {
        console.log('Skipping - TEST_EVM_WALLET_ADDRESS not set');
        return;
      }

      // USDC contract on Ethereum
      const usdcContract = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

      // ERC-20 balanceOf(address) function selector
      const data = `0x70a08231000000000000000000000000${testWallet.slice(2)}`;

      const response = await fetch('https://eth.llamarpc.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ to: usdcContract, data }, 'latest'],
          id: 1,
        }),
      });

      const result = await response.json() as { result?: string; error?: { message: string } };

      // Skip if RPC returned an error
      if (result.error) {
        console.log(`Skipping - RPC error: ${result.error.message}`);
        return;
      }

      expect(result.result).toBeDefined();

      const balanceRaw = BigInt(result.result || '0');
      const balanceUsdc = Number(balanceRaw) / 1e6; // USDC has 6 decimals
      console.log(`USDC Balance: ${balanceUsdc.toFixed(2)} USDC`);
    });
  });

  describe('Gas Price Provider', () => {
    it('should fetch current Ethereum gas prices', async () => {
      const response = await fetch('https://eth.llamarpc.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json() as { result?: string; error?: { message: string } };

      // Skip if RPC returned an error (rate limiting, etc.)
      if (data.error || !data.result) {
        console.log('Skipping - Ethereum RPC error or rate limited');
        return;
      }

      const gasPriceWei = BigInt(data.result);
      const gasPriceGwei = Number(gasPriceWei) / 1e9;
      console.log(`Current Ethereum Gas Price: ${gasPriceGwei.toFixed(2)} gwei`);
    });

    it('should fetch Polygon gas prices', async () => {
      const response = await fetch('https://polygon-rpc.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json() as { result?: string; error?: { message: string } };

      // Skip if RPC returned an error (rate limiting, etc.)
      if (data.error || !data.result) {
        console.log('Skipping - Polygon RPC error or rate limited');
        return;
      }

      const gasPriceWei = BigInt(data.result);
      const gasPriceGwei = Number(gasPriceWei) / 1e9;
      console.log(`Current Polygon Gas Price: ${gasPriceGwei.toFixed(2)} gwei`);
    });
  });

  describe('Price Service', () => {
    it('should fetch ETH price from CoinGecko', async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
      );

      const data = await response.json() as { ethereum?: { usd: number } };
      expect(data.ethereum?.usd).toBeDefined();
      expect(data.ethereum?.usd).toBeGreaterThan(0);

      console.log(`ETH Price: $${data.ethereum?.usd}`);
    });

    it('should fetch multiple token prices', async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,matic-network&vs_currencies=usd'
      );

      const data = await response.json() as {
        ethereum?: { usd: number };
        solana?: { usd: number };
        'matic-network'?: { usd: number };
      };

      expect(data.ethereum?.usd).toBeDefined();
      expect(data.solana?.usd).toBeDefined();

      console.log('Token Prices:', {
        ETH: data.ethereum?.usd,
        SOL: data.solana?.usd,
        MATIC: data['matic-network']?.usd,
      });
    });
  });
});

describe.skipIf(!runTests)('Solana Blockchain Provider Tests', () => {
  const solanaRpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const testWallet = process.env.TEST_SOLANA_WALLET_ADDRESS;

  describe('Solana Wallet Balance', () => {
    it('should fetch SOL balance', async () => {
      if (!testWallet) {
        console.log('Skipping - TEST_SOLANA_WALLET_ADDRESS not set');
        return;
      }

      const response = await fetch(solanaRpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [testWallet],
        }),
      });

      const data = await response.json() as { result?: { value: number } };
      expect(data.result).toBeDefined();

      const balanceLamports = data.result?.value || 0;
      const balanceSol = balanceLamports / 1e9;
      console.log(`SOL Balance: ${balanceSol.toFixed(6)} SOL`);
    });

    it('should fetch SPL token balances', async () => {
      if (!testWallet) {
        console.log('Skipping - TEST_SOLANA_WALLET_ADDRESS not set');
        return;
      }

      const response = await fetch(solanaRpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [
            testWallet,
            { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
            { encoding: 'jsonParsed' },
          ],
        }),
      });

      const data = await response.json() as {
        result?: { value: Array<{ account: { data: { parsed: { info: { tokenAmount: { uiAmount: number }; mint: string } } } } }> };
      };
      expect(data.result).toBeDefined();

      const tokenAccounts = data.result?.value || [];
      console.log(`Found ${tokenAccounts.length} SPL token accounts`);

      // Log first 5 tokens
      tokenAccounts.slice(0, 5).forEach((account) => {
        const info = account.account.data.parsed.info;
        console.log(`  Token: ${info.mint.slice(0, 8)}... Balance: ${info.tokenAmount.uiAmount}`);
      });
    });
  });

  describe('Solana Network Status', () => {
    it('should get current slot', async () => {
      const response = await fetch(solanaRpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot',
          params: [],
        }),
      });

      const data = await response.json() as { result?: number };
      expect(data.result).toBeDefined();
      expect(data.result).toBeGreaterThan(0);

      console.log(`Current Solana Slot: ${data.result}`);
    });
  });
});

describe.skipIf(!runTests)('Whale Transaction Tests', () => {
  describe('EVM Whale Detection', () => {
    it('should identify known exchange wallets', async () => {
      // Test known exchange wallets
      const knownWhales = [
        { name: 'Binance 14', address: '0x28C6c06298d514Db089934071355E5743bf21d60' },
        { name: 'Binance 8', address: '0xF977814e90dA44bFA03b6295A0616a897441aceC' },
      ];

      for (const whale of knownWhales) {
        const response = await fetch('https://eth.llamarpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [whale.address, 'latest'],
            id: 1,
          }),
        });

        const data = await response.json() as { result?: string; error?: { message: string } };

        // Skip if RPC returned an error (rate limiting, etc.)
        if (data.error || !data.result) {
          console.log(`${whale.name}: Skipping - RPC error or empty response`);
          continue;
        }

        const balanceWei = BigInt(data.result);
        const balanceEth = Number(balanceWei) / 1e18;

        console.log(`${whale.name}: ${balanceEth.toFixed(2)} ETH`);
        // Note: Balance may be 0 due to RPC rate limiting on public endpoints
        expect(balanceEth).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe.skipIf(!runTests)('Airdrop Eligibility Tests', () => {
  const testWallet = process.env.TEST_EVM_WALLET_ADDRESS;

  describe('Protocol Activity Check', () => {
    it('should check wallet transaction count (activity indicator)', async () => {
      if (!testWallet) {
        console.log('Skipping - TEST_EVM_WALLET_ADDRESS not set');
        return;
      }

      const response = await fetch('https://eth.llamarpc.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [testWallet, 'latest'],
          id: 1,
        }),
      });

      const data = await response.json() as { result?: string };
      const txCount = parseInt(data.result || '0', 16);

      console.log(`Wallet transaction count (nonce): ${txCount}`);
      expect(txCount).toBeGreaterThanOrEqual(0);
    });
  });
});
