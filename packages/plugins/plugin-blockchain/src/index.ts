// Internal imports for plugin definition
import { evmClient as _evmClient } from './services/evm-client';
import { solanaClient as _solanaClient } from './services/solana-client';
import { priceService as _priceService } from './services/price-service';
import { tokenRegistry as _tokenRegistry } from './services/token-registry';
import { walletBalanceProvider as _walletBalanceProvider } from './providers/wallet-balance';
import { whaleTransactionsProvider as _whaleTransactionsProvider } from './providers/whale-transactions';
import { gasPricesProvider as _gasPricesProvider } from './providers/gas-prices';
import { contractEventsProvider as _contractEventsProvider } from './providers/contract-events';
import { airdropEligibilityProvider as _airdropEligibilityProvider } from './providers/airdrop-eligibility';
import { sendAlertAction as _sendAlertAction } from './actions/send-alert';

// Services
export { EVMClient, evmClient } from './services/evm-client';
export type { TokenBalance, Transaction, GasPrice } from './services/evm-client';

export { SolanaClient, solanaClient } from './services/solana-client';
export type { SolanaBalance, SolanaTokenBalance, SolanaTransaction } from './services/solana-client';

export { priceService } from './services/price-service';
export type { TokenPrice, PriceCache } from './services/price-service';

export { tokenRegistry } from './services/token-registry';
export type { TokenInfo } from './services/token-registry';

// Providers
export { walletBalanceProvider, getEVMWalletBalance, getSolanaWalletBalance, getPortfolioSummary } from './providers/wallet-balance';
export type { WalletPortfolio, PortfolioSummary, TokenBalanceWithUsd, SolanaTokenBalanceWithUsd } from './providers/wallet-balance';

export { whaleTransactionsProvider, monitorWhaleTransactions, getRecentWhaleActivity, getKnownWhales, isKnownWhale } from './providers/whale-transactions';
export type { WhaleTransaction, WhaleAlert, WhaleWallet } from './providers/whale-transactions';

export { gasPricesProvider, getCurrentGasPrices, monitorGasPrices, getOptimalTransactionTime } from './providers/gas-prices';
export type { GasAlert, GasHistory } from './providers/gas-prices';

export { contractEventsProvider, watchContractEvents, watchMultipleContracts, getEventSummary, createContractConfig, getContractInfo, getAbiForType, getStoredEvents, clearStoredEvents, COMMON_ABIS } from './providers/contract-events';
export type { ContractEvent, ContractConfig, EventSummary, ContractType, DecodedEventData } from './providers/contract-events';

export { airdropEligibilityProvider, checkAirdropEligibility, getClaimableAirdrops, getPendingAirdrops, getUpcomingAirdrops, getActiveAirdrops, getAirdropByProtocol, clearEligibilityCache } from './providers/airdrop-eligibility';
export type { AirdropInfo, EligibilityCheck, AirdropCampaign, AirdropRequirement } from './providers/airdrop-eligibility';

// Actions
export { sendAlertAction, sendAlert } from './actions/send-alert';
export type { AlertConfig, Alert } from './actions/send-alert';

// Plugin definition
export const blockchainPlugin = {
  name: '@elizagotchi/plugin-blockchain',
  version: '0.1.0',
  description: 'Blockchain integration plugin for monitoring wallets, transactions, and contracts',

  providers: [
    _walletBalanceProvider,
    _whaleTransactionsProvider,
    _gasPricesProvider,
    _contractEventsProvider,
    _airdropEligibilityProvider,
  ],

  actions: [
    _sendAlertAction,
  ],

  services: {
    evmClient: _evmClient,
    solanaClient: _solanaClient,
    priceService: _priceService,
    tokenRegistry: _tokenRegistry,
  },
};

export default blockchainPlugin;
