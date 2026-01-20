// Crypto agents
import portfolioTracker from './crypto/portfolio-tracker.json';
import whaleWatcher from './crypto/whale-watcher.json';
import airdropHunter from './crypto/airdrop-hunter.json';
import gasMonitor from './crypto/gas-monitor.json';
import treasuryWatcher from './crypto/treasury-watcher.json';
import contractMonitor from './crypto/contract-monitor.json';

// Research agents
import marketScanner from './research/market-scanner.json';

// Personal agents
import readingListManager from './personal/reading-list-manager.json';

// Developer agents
import githubIssueTriager from './developer/github-issue-triager.json';
import bugReporter from './developer/bug-reporter.json';
import changelogWriter from './developer/changelog-writer.json';

// Community agents
import communityManager from './community/community-manager.json';

// Entertainment agents
import loreKeeper from './entertainment/lore-keeper.json';

export interface CharacterTemplate {
  name: string;
  description: string;
  modelProvider: string;
  clients: string[];
  plugins: string[];
  settings: {
    model: string;
    maxTokens: number;
  };
  bio: string[];
  lore: string[];
  knowledge: string[];
  messageExamples: Array<Array<{ user: string; content: { text: string } }>>;
  postExamples: string[];
  topics: string[];
  style: {
    all: string[];
    chat: string[];
  };
  adjectives: string[];
}

export const templates: Record<string, CharacterTemplate> = {
  'portfolio-tracker': portfolioTracker as CharacterTemplate,
  'whale-watcher': whaleWatcher as CharacterTemplate,
  'airdrop-hunter': airdropHunter as CharacterTemplate,
  'gas-monitor': gasMonitor as CharacterTemplate,
  'treasury-watcher': treasuryWatcher as CharacterTemplate,
  'contract-monitor': contractMonitor as CharacterTemplate,
  'market-scanner': marketScanner as CharacterTemplate,
  'reading-list-manager': readingListManager as CharacterTemplate,
  'github-issue-triager': githubIssueTriager as CharacterTemplate,
  'bug-reporter': bugReporter as CharacterTemplate,
  'changelog-writer': changelogWriter as CharacterTemplate,
  'community-manager': communityManager as CharacterTemplate,
  'lore-keeper': loreKeeper as CharacterTemplate,
};

export function getTemplate(type: string): CharacterTemplate | undefined {
  return templates[type];
}

export function getAllTemplates(): Record<string, CharacterTemplate> {
  return templates;
}

// Re-export individual templates
export {
  portfolioTracker,
  whaleWatcher,
  airdropHunter,
  gasMonitor,
  treasuryWatcher,
  contractMonitor,
  marketScanner,
  readingListManager,
  githubIssueTriager,
  bugReporter,
  changelogWriter,
  communityManager,
  loreKeeper,
};
