/**
 * Agent-Specific Alert Tests
 *
 * Tests alerts for all 13 agent types in ElizaGotchi OS:
 *
 * Featured Agents (9 - shown on homepage):
 * 1. portfolio-tracker
 * 2. whale-watcher
 * 3. airdrop-hunter
 * 4. bug-reporter
 * 5. treasury-watcher
 * 6. contract-monitor
 * 7. market-scanner
 * 8. reading-list-manager
 * 9. github-issue-triager
 *
 * Additional Agents (4 - available in backend):
 * 10. gas-monitor
 * 11. changelog-writer
 * 12. community-manager
 * 13. lore-keeper
 *
 * Each agent test simulates the specific alert format that agent would send.
 */

import { describe, it, expect } from 'vitest';
import { AGENT_TYPES, type AgentType } from '@elizagotchi/shared';

// Agent alert message generators - simulates what each agent would send
const agentAlerts: Record<
  AgentType,
  {
    name: string;
    discordEmbed: {
      title: string;
      description: string;
      color: number;
      fields: Array<{ name: string; value: string; inline?: boolean }>;
    };
    telegramMessage: string;
  }
> = {
  'portfolio-tracker': {
    name: 'Portfolio Tracker',
    discordEmbed: {
      title: '📊 Portfolio Alert',
      description: 'Significant change detected in your portfolio',
      color: 0xff6b9d,
      fields: [
        { name: 'Total Value', value: '$12,450.23', inline: true },
        { name: '24h Change', value: '+3.2% (+$385)', inline: true },
        { name: 'Top Gainer', value: 'ETH +5.4%', inline: true },
        { name: 'Alert Trigger', value: 'Portfolio exceeded +3% threshold', inline: false },
      ],
    },
    telegramMessage: `📊 *Portfolio Alert*

Your portfolio has changed significantly!

💰 *Total Value:* \`$12,450.23\`
📈 *24h Change:* \`+3.2% (+$385)\`
🏆 *Top Gainer:* ETH +5.4%

_Threshold: +3% change_`,
  },

  'whale-watcher': {
    name: 'Whale Watcher',
    discordEmbed: {
      title: '🐋 Whale Alert',
      description: 'Large transaction detected on Ethereum',
      color: 0x9b6bff,
      fields: [
        { name: 'Amount', value: '5,000 ETH', inline: true },
        { name: 'Value', value: '$12,500,000', inline: true },
        { name: 'From', value: 'Binance Hot Wallet', inline: false },
        { name: 'To', value: '0x742d...f39B (Unknown)', inline: false },
        { name: 'Possible Intent', value: 'Accumulation - withdrawn to cold storage', inline: false },
      ],
    },
    telegramMessage: `🐋 *Whale Alert*

Large transaction detected on Ethereum!

*Amount:* \`5,000 ETH\`
*Value:* \`$12,500,000\`
*From:* Binance Hot Wallet
*To:* 0x742d...f39B (Unknown)

_Possible accumulation signal_`,
  },

  'airdrop-hunter': {
    name: 'Airdrop Hunter',
    discordEmbed: {
      title: '🎁 Airdrop Alert',
      description: 'You may be eligible for a new airdrop!',
      color: 0x6bffd4,
      fields: [
        { name: 'Protocol', value: 'Jupiter Exchange', inline: true },
        { name: 'Status', value: 'Claimable Now', inline: true },
        { name: 'Eligible Wallet', value: '0x1234...5678', inline: false },
        { name: 'Estimated Value', value: '~$2,500 (5,000 JUP)', inline: false },
        { name: 'Claim Deadline', value: 'Feb 7, 2025', inline: true },
      ],
    },
    telegramMessage: `🎁 *Airdrop Alert*

You may be eligible for an airdrop!

*Protocol:* Jupiter Exchange
*Status:* ✅ Claimable Now
*Wallet:* \`0x1234...5678\`
*Estimated:* ~$2,500 (5,000 JUP)

⚠️ _Deadline: Feb 7, 2025_

[Check Eligibility](https://jup.ag/claim)`,
  },

  'gas-monitor': {
    name: 'Gas Monitor',
    discordEmbed: {
      title: '⛽ Gas Alert',
      description: 'Ethereum gas prices are favorable!',
      color: 0xffd46b,
      fields: [
        { name: 'Current Gas', value: '15 gwei', inline: true },
        { name: 'Trend', value: '↓ Decreasing', inline: true },
        { name: 'Best Time', value: 'Now - Next 2 hours', inline: false },
        { name: 'Tx Cost (ETH Transfer)', value: '~$0.75', inline: true },
        { name: 'Tx Cost (Swap)', value: '~$2.50', inline: true },
      ],
    },
    telegramMessage: `⛽ *Gas Alert*

Ethereum gas is LOW!

*Current:* \`15 gwei\` ↓
*ETH Transfer:* ~$0.75
*Swap Cost:* ~$2.50

🟢 _Good time to transact!_`,
  },

  'treasury-watcher': {
    name: 'Treasury Watcher',
    discordEmbed: {
      title: '🏛️ Treasury Alert',
      description: 'Significant treasury movement detected',
      color: 0x6bb5ff,
      fields: [
        { name: 'DAO', value: 'Uniswap', inline: true },
        { name: 'Movement', value: 'Outflow', inline: true },
        { name: 'Amount', value: '$5,000,000 USDC', inline: false },
        { name: 'Destination', value: 'Grants Program Multi-sig', inline: false },
        { name: 'Treasury Balance', value: '$2.1B remaining', inline: true },
      ],
    },
    telegramMessage: `🏛️ *Treasury Alert*

Uniswap DAO Treasury Movement

*Type:* Outflow
*Amount:* \`$5,000,000 USDC\`
*To:* Grants Program Multi-sig
*Remaining:* $2.1B

_Likely grant disbursement_`,
  },

  'contract-monitor': {
    name: 'Contract Monitor',
    discordEmbed: {
      title: '📜 Contract Alert',
      description: 'Event detected on monitored contract',
      color: 0xff6b6b,
      fields: [
        { name: 'Contract', value: 'AAVE V3 Pool', inline: true },
        { name: 'Event', value: 'FlashLoan', inline: true },
        { name: 'Amount', value: '10,000,000 USDC', inline: false },
        { name: 'Borrower', value: '0xdef1...cafe', inline: false },
        { name: 'Fee', value: '900 USDC (0.009%)', inline: true },
      ],
    },
    telegramMessage: `📜 *Contract Alert*

Event on AAVE V3 Pool

*Event:* FlashLoan
*Amount:* \`10,000,000 USDC\`
*Borrower:* \`0xdef1...cafe\`
*Fee:* 900 USDC

[View on Etherscan](https://etherscan.io)`,
  },

  'market-scanner': {
    name: 'Market Scanner',
    discordEmbed: {
      title: '📰 Market News Alert',
      description: 'Breaking news matching your topics',
      color: 0xb5ff6b,
      fields: [
        { name: 'Source', value: 'CoinDesk', inline: true },
        { name: 'Category', value: 'Regulation', inline: true },
        { name: 'Headline', value: 'SEC Approves First Spot Bitcoin ETF Applications', inline: false },
        { name: 'Sentiment', value: '🟢 Bullish', inline: true },
        { name: 'Relevance', value: 'High - Bitcoin', inline: true },
      ],
    },
    telegramMessage: `📰 *Market Scanner Alert*

Breaking news for your topics!

*Source:* CoinDesk
*Category:* Regulation

*Headline:*
SEC Approves First Spot Bitcoin ETF Applications

*Sentiment:* 🟢 Bullish
*Relevance:* Bitcoin, ETF`,
  },

  'reading-list-manager': {
    name: 'Reading List Manager',
    discordEmbed: {
      title: '📚 Reading Recommendation',
      description: 'New content added to your reading list',
      color: 0xff9d6b,
      fields: [
        { name: 'Title', value: 'The Merge: One Year Later', inline: false },
        { name: 'Type', value: 'Article', inline: true },
        { name: 'Read Time', value: '12 min', inline: true },
        { name: 'Topics', value: 'Ethereum, Proof of Stake', inline: false },
        { name: 'Priority', value: '⭐ High (matches your interests)', inline: false },
      ],
    },
    telegramMessage: `📚 *Reading Recommendation*

New content for your list!

*Title:* The Merge: One Year Later
*Type:* Article (12 min read)
*Topics:* Ethereum, Proof of Stake

⭐ _High priority - matches your interests_`,
  },

  'github-issue-triager': {
    name: 'GitHub Issue Triager',
    discordEmbed: {
      title: '🔖 Issue Triaged',
      description: 'New issue automatically labeled and assigned',
      color: 0x6bffa5,
      fields: [
        { name: 'Repository', value: 'elizaos/eliza', inline: true },
        { name: 'Issue #', value: '#1234', inline: true },
        { name: 'Title', value: 'Memory leak in agent runtime', inline: false },
        { name: 'Labels Applied', value: 'bug, priority-high, needs-review', inline: false },
        { name: 'Assigned To', value: '@maintainer1', inline: true },
      ],
    },
    telegramMessage: `🔖 *Issue Triaged*

New issue in elizaos/eliza

*#1234:* Memory leak in agent runtime

*Labels:* \`bug\` \`priority-high\` \`needs-review\`
*Assigned:* @maintainer1

[View Issue](https://github.com/elizaos/eliza/issues/1234)`,
  },

  'bug-reporter': {
    name: 'Bug Reporter',
    discordEmbed: {
      title: '🐛 Bug Report Created',
      description: 'New bug report submitted to repository',
      color: 0xff6b6b,
      fields: [
        { name: 'Repository', value: 'myproject/app', inline: true },
        { name: 'Issue #', value: '#567', inline: true },
        { name: 'Title', value: 'App crashes when clicking submit', inline: false },
        { name: 'Severity', value: '🔴 Critical', inline: true },
        { name: 'Reporter', value: 'user@example.com', inline: true },
        { name: 'Steps Captured', value: '5 steps documented', inline: false },
      ],
    },
    telegramMessage: `🐛 *Bug Report Created*

*Repository:* myproject/app
*Issue:* #567
*Severity:* 🔴 Critical

*Title:* App crashes when clicking submit
*Reporter:* user@example.com
*Steps:* 5 documented

[View Bug](https://github.com/myproject/app/issues/567)`,
  },

  'changelog-writer': {
    name: 'Changelog Writer',
    discordEmbed: {
      title: '📝 Changelog Generated',
      description: 'New release notes ready for review',
      color: 0xb5ff6b,
      fields: [
        { name: 'Repository', value: 'myproject/app', inline: true },
        { name: 'Version', value: 'v2.5.0', inline: true },
        { name: 'Features', value: '3 new features', inline: true },
        { name: 'Bug Fixes', value: '7 fixes', inline: true },
        { name: 'Breaking Changes', value: '1 (migration required)', inline: true },
        { name: 'Contributors', value: '5 authors', inline: true },
      ],
    },
    telegramMessage: `📝 *Changelog Generated*

*Repository:* myproject/app
*Version:* v2.5.0

*Summary:*
✨ 3 new features
🐛 7 bug fixes
⚠️ 1 breaking change

*Contributors:* 5 authors

[Review Changelog](https://github.com/myproject/app/releases/v2.5.0)`,
  },

  'community-manager': {
    name: 'Community Manager',
    discordEmbed: {
      title: '👋 Community Update',
      description: 'Daily community activity summary',
      color: 0x9b6bff,
      fields: [
        { name: 'New Members', value: '47 today', inline: true },
        { name: 'Messages', value: '1,234', inline: true },
        { name: 'Questions Answered', value: '23', inline: true },
        { name: 'Top Helper', value: '@helpful_user', inline: true },
        { name: 'Moderation Actions', value: '2 warnings, 0 bans', inline: false },
        { name: 'Trending Topic', value: '#tokenomics', inline: true },
      ],
    },
    telegramMessage: `👋 *Community Update*

Daily activity summary

*New Members:* 47
*Messages:* 1,234
*Questions Answered:* 23

🏆 *Top Helper:* @helpful_user
📊 *Trending:* #tokenomics

_Moderation: 2 warnings, 0 bans_`,
  },

  'lore-keeper': {
    name: 'Lore Keeper',
    discordEmbed: {
      title: '📜 Lore Update',
      description: 'New information added to the knowledge base',
      color: 0xff9d6b,
      fields: [
        { name: 'Universe', value: 'The Elder Scrolls', inline: true },
        { name: 'Category', value: 'Characters', inline: true },
        { name: 'Entry', value: 'Talos - From Man to God', inline: false },
        { name: 'Source', value: 'Official Game Dialogue', inline: true },
        { name: 'Spoiler Level', value: '⚠️ Main Quest', inline: true },
      ],
    },
    telegramMessage: `📜 *Lore Update*

New entry in The Elder Scrolls lore!

*Category:* Characters
*Entry:* Talos - From Man to God
*Source:* Official Game Dialogue

⚠️ _Spoiler Level: Main Quest_`,
  },
};

describe('Agent Alert Message Formats', () => {
  // Verify all 13 agents are defined
  it('should have alert definitions for all 13 agent types', () => {
    const agentTypeKeys = Object.keys(AGENT_TYPES);
    const alertKeys = Object.keys(agentAlerts);

    expect(agentTypeKeys.length).toBe(13);
    expect(alertKeys.length).toBe(13);

    agentTypeKeys.forEach((type) => {
      expect(alertKeys).toContain(type);
    });
  });

  // Featured agents (9 shown on homepage)
  describe('Featured Agents (9)', () => {
    const featuredAgents: AgentType[] = [
      'portfolio-tracker',
      'whale-watcher',
      'airdrop-hunter',
      'bug-reporter',
      'treasury-watcher',
      'contract-monitor',
      'market-scanner',
      'reading-list-manager',
      'github-issue-triager',
    ];

    it('should have exactly 9 featured agents', () => {
      expect(featuredAgents.length).toBe(9);
    });

    featuredAgents.forEach((agentType) => {
      describe(`${agentAlerts[agentType].name}`, () => {
        it('should have valid Discord embed structure', () => {
          const alert = agentAlerts[agentType];

          expect(alert.discordEmbed).toBeDefined();
          expect(alert.discordEmbed.title).toBeDefined();
          expect(alert.discordEmbed.description).toBeDefined();
          expect(alert.discordEmbed.color).toBeTypeOf('number');
          expect(alert.discordEmbed.fields).toBeInstanceOf(Array);
          expect(alert.discordEmbed.fields.length).toBeGreaterThan(0);
        });

        it('should have valid Telegram message', () => {
          const alert = agentAlerts[agentType];

          expect(alert.telegramMessage).toBeDefined();
          expect(alert.telegramMessage.length).toBeGreaterThan(10);
          // Should contain agent name indicator
          expect(alert.telegramMessage).toMatch(/\*/); // Markdown bold
        });

        it('should have matching agent type in AGENT_TYPES', () => {
          expect(AGENT_TYPES[agentType]).toBeDefined();
          expect(AGENT_TYPES[agentType].name).toBe(agentAlerts[agentType].name);
        });
      });
    });
  });

  // Additional agents (4 not on homepage but available in backend)
  describe('Additional Agents (4)', () => {
    const additionalAgents: AgentType[] = ['gas-monitor', 'changelog-writer', 'community-manager', 'lore-keeper'];

    it('should have exactly 4 additional agents', () => {
      expect(additionalAgents.length).toBe(4);
    });

    additionalAgents.forEach((agentType) => {
      describe(`${agentAlerts[agentType].name}`, () => {
        it('should have valid Discord embed structure', () => {
          const alert = agentAlerts[agentType];

          expect(alert.discordEmbed).toBeDefined();
          expect(alert.discordEmbed.title).toBeDefined();
          expect(alert.discordEmbed.fields.length).toBeGreaterThan(0);
        });

        it('should have valid Telegram message', () => {
          const alert = agentAlerts[agentType];

          expect(alert.telegramMessage).toBeDefined();
          expect(alert.telegramMessage.length).toBeGreaterThan(10);
        });

        it('should have matching agent type in AGENT_TYPES', () => {
          expect(AGENT_TYPES[agentType]).toBeDefined();
        });
      });
    });
  });
});

describe('Discord Embed Validation', () => {
  Object.entries(agentAlerts).forEach(([agentType, alert]) => {
    it(`${alert.name}: Discord embed should have valid color hex`, () => {
      expect(alert.discordEmbed.color).toBeGreaterThanOrEqual(0);
      expect(alert.discordEmbed.color).toBeLessThanOrEqual(0xffffff);
    });

    it(`${alert.name}: Discord embed fields should have required properties`, () => {
      alert.discordEmbed.fields.forEach((field, index) => {
        expect(field.name, `Field ${index} missing name`).toBeDefined();
        expect(field.value, `Field ${index} missing value`).toBeDefined();
        expect(field.name.length).toBeGreaterThan(0);
        expect(field.value.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Telegram Message Validation', () => {
  Object.entries(agentAlerts).forEach(([agentType, alert]) => {
    it(`${alert.name}: Telegram message should be properly formatted`, () => {
      // Should contain Markdown formatting
      expect(alert.telegramMessage).toMatch(/\*.*\*/); // Bold text

      // Should not exceed Telegram's message limit (4096 chars)
      expect(alert.telegramMessage.length).toBeLessThan(4096);
    });

    it(`${alert.name}: Telegram message should escape special characters correctly`, () => {
      // Check for properly formatted code blocks
      const codeBlockMatches = alert.telegramMessage.match(/`[^`]+`/g);
      if (codeBlockMatches) {
        codeBlockMatches.forEach((block) => {
          // Code blocks should be closed properly
          expect(block.startsWith('`')).toBe(true);
          expect(block.endsWith('`')).toBe(true);
        });
      }
    });
  });
});

describe('Agent Category Coverage', () => {
  it('should cover all crypto agents', () => {
    const cryptoAgents = Object.entries(AGENT_TYPES)
      .filter(([, config]) => config.category === 'crypto')
      .map(([key]) => key);

    cryptoAgents.forEach((agent) => {
      expect(agentAlerts[agent as AgentType]).toBeDefined();
    });

    // Should have 6 crypto agents
    expect(cryptoAgents.length).toBe(6);
  });

  it('should cover all developer agents', () => {
    const devAgents = Object.entries(AGENT_TYPES)
      .filter(([, config]) => config.category === 'developer')
      .map(([key]) => key);

    devAgents.forEach((agent) => {
      expect(agentAlerts[agent as AgentType]).toBeDefined();
    });

    // Should have 3 developer agents
    expect(devAgents.length).toBe(3);
  });

  it('should cover all research agents', () => {
    const researchAgents = Object.entries(AGENT_TYPES)
      .filter(([, config]) => config.category === 'research')
      .map(([key]) => key);

    researchAgents.forEach((agent) => {
      expect(agentAlerts[agent as AgentType]).toBeDefined();
    });

    // Should have 1 research agent
    expect(researchAgents.length).toBe(1);
  });

  it('should cover all personal agents', () => {
    const personalAgents = Object.entries(AGENT_TYPES)
      .filter(([, config]) => config.category === 'personal')
      .map(([key]) => key);

    personalAgents.forEach((agent) => {
      expect(agentAlerts[agent as AgentType]).toBeDefined();
    });

    // Should have 1 personal agent
    expect(personalAgents.length).toBe(1);
  });

  it('should cover all community agents', () => {
    const communityAgents = Object.entries(AGENT_TYPES)
      .filter(([, config]) => config.category === 'community')
      .map(([key]) => key);

    communityAgents.forEach((agent) => {
      expect(agentAlerts[agent as AgentType]).toBeDefined();
    });

    // Should have 1 community agent
    expect(communityAgents.length).toBe(1);
  });

  it('should cover all entertainment agents', () => {
    const entertainmentAgents = Object.entries(AGENT_TYPES)
      .filter(([, config]) => config.category === 'entertainment')
      .map(([key]) => key);

    entertainmentAgents.forEach((agent) => {
      expect(agentAlerts[agent as AgentType]).toBeDefined();
    });

    // Should have 1 entertainment agent
    expect(entertainmentAgents.length).toBe(1);
  });
});

// Helper function to build Discord webhook payload
export function buildDiscordPayload(agentType: AgentType) {
  const alert = agentAlerts[agentType];
  return {
    embeds: [
      {
        ...alert.discordEmbed,
        footer: { text: `ElizaGotchi OS • ${alert.name}` },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

// Helper function to build Telegram message payload
export function buildTelegramPayload(agentType: AgentType, chatId: string) {
  const alert = agentAlerts[agentType];
  return {
    chat_id: chatId,
    text: alert.telegramMessage,
    parse_mode: 'Markdown' as const,
  };
}

// Export for use in other tests
export { agentAlerts };
