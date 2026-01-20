/**
 * Setup script for ElizaGotchi Telegram Bot
 *
 * This script:
 * 1. Sets up bot commands in Telegram
 * 2. Configures the webhook URL (for production)
 * 3. Tests the bot connection
 *
 * Usage: bun run scripts/setup-telegram-bot.ts [webhook-url]
 */

import 'dotenv/config';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not set in environment');
  process.exit(1);
}

async function setCommands(): Promise<boolean> {
  console.log('📝 Setting bot commands...');

  const commands = [
    { command: 'start', description: 'Get started with ElizaGotchi' },
    { command: 'agents', description: 'View your configured agents' },
    { command: 'status', description: 'Check agent status overview' },
    { command: 'alerts', description: 'Manage alert preferences' },
    { command: 'link', description: 'Link your ElizaGotchi account' },
    { command: 'help', description: 'Get help and support' },
  ];

  try {
    const response = await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Bot commands set successfully!');
      commands.forEach(cmd => {
        console.log(`   /${cmd.command} - ${cmd.description}`);
      });
      return true;
    } else {
      console.error('❌ Failed to set commands:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting commands:', error);
    return false;
  }
}

async function setBotInfo(): Promise<void> {
  console.log('\n📋 Setting bot description...');

  // Set short description (shown in bot profile)
  await fetch(`${TELEGRAM_API}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: 'AI agent alerts for crypto: wallets, whales, airdrops & more 🤖',
    }),
  });

  // Set description (shown when user opens chat)
  await fetch(`${TELEGRAM_API}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: `🤖 ElizaGotchi OS - Your AI Agent Command Center

I deliver real-time alerts from your AI agents:
💰 Portfolio alerts & balance changes
🐋 Whale transaction notifications
🎁 Airdrop eligibility alerts
⛽ Gas price notifications
📊 Market news digests

Deploy your agents at elizagotchi.com`,
    }),
  });

  console.log('✅ Bot description set!');
}

async function setWebhook(webhookUrl: string): Promise<boolean> {
  console.log(`\n🔗 Setting webhook to: ${webhookUrl}`);

  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      return true;
    } else {
      console.error('❌ Failed to set webhook:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error);
    return false;
  }
}

async function deleteWebhook(): Promise<void> {
  console.log('\n🗑️ Deleting existing webhook (for polling mode)...');

  await fetch(`${TELEGRAM_API}/deleteWebhook`, { method: 'POST' });
  console.log('✅ Webhook deleted - bot will use polling mode');
}

async function getWebhookInfo(): Promise<void> {
  console.log('\n📊 Current webhook info:');

  const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  const result = await response.json();

  if (result.ok) {
    const info = result.result;
    console.log(`   URL: ${info.url || '(none - polling mode)'}`);
    console.log(`   Pending updates: ${info.pending_update_count}`);
    if (info.last_error_message) {
      console.log(`   Last error: ${info.last_error_message}`);
    }
  }
}

async function getBotInfo(): Promise<void> {
  console.log('\n🤖 Bot info:');

  const response = await fetch(`${TELEGRAM_API}/getMe`);
  const result = await response.json();

  if (result.ok) {
    const bot = result.result;
    console.log(`   Name: ${bot.first_name}`);
    console.log(`   Username: @${bot.username}`);
    console.log(`   Can join groups: ${bot.can_join_groups}`);
    console.log(`   Can read messages: ${bot.can_read_all_group_messages}`);
  }
}

async function sendTestMessage(chatId: string): Promise<void> {
  console.log(`\n📤 Sending test message to ${chatId}...`);

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '✅ *ElizaGotchi Bot Setup Complete!*\n\nYour bot is configured and ready to send notifications.\n\nType /help to see available commands.',
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🤖 My Agents', callback_data: 'agents' },
            { text: '📊 Status', callback_data: 'status' },
          ],
          [
            { text: '🌐 Open Dashboard', url: 'https://elizagotchi.com/dashboard' },
          ],
        ],
      },
    }),
  });

  const result = await response.json();

  if (result.ok) {
    console.log('✅ Test message sent!');
  } else {
    console.error('❌ Failed to send test message:', result);
  }
}

async function main(): Promise<void> {
  console.log('🚀 ElizaGotchi Telegram Bot Setup\n');
  console.log('='.repeat(40));

  // Get bot info
  await getBotInfo();

  // Set commands
  await setCommands();

  // Set bot description
  await setBotInfo();

  // Check webhook status
  await getWebhookInfo();

  // Handle webhook argument
  const webhookUrl = process.argv[2];

  if (webhookUrl) {
    if (webhookUrl === '--delete') {
      await deleteWebhook();
    } else {
      await setWebhook(webhookUrl);
    }
  } else {
    console.log('\n💡 Tip: Pass a webhook URL to enable webhook mode:');
    console.log('   bun run scripts/setup-telegram-bot.ts https://your-api.com/api/telegram/webhook');
    console.log('   Or use --delete to remove webhook and use polling mode');
  }

  // Send test message if chat ID is set
  const testChatId = process.env.TEST_TELEGRAM_CHAT_ID;
  if (testChatId) {
    await sendTestMessage(testChatId);
  }

  console.log('\n' + '='.repeat(40));
  console.log('✨ Setup complete!');
}

main().catch(console.error);
