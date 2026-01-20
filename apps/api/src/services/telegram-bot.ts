import { Hono } from 'hono';
import { db, agents, users } from '@elizagotchi/database';
import { eq, and } from 'drizzle-orm';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Store pending link codes (code -> userId) - expires after 10 minutes
const pendingLinkCodes = new Map<string, { userId: string; expiresAt: number }>();

// Generate a link code for a user
export function generateTelegramLinkCode(userId: string): string {
  // Clean up expired codes
  const now = Date.now();
  for (const [code, data] of pendingLinkCodes) {
    if (data.expiresAt < now) pendingLinkCodes.delete(code);
  }

  // Generate 6-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  pendingLinkCodes.set(code, { userId, expiresAt: now + 10 * 60 * 1000 }); // 10 min expiry
  return code;
}

// Look up user ID by telegram chat ID from database
async function getUserIdByChatId(chatId: string): Promise<string | undefined> {
  try {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(and(
        eq(users.telegramChatId, chatId),
        eq(users.telegramEnabled, true)
      ))
      .limit(1);

    return user[0]?.id;
  } catch (error) {
    console.error('Error looking up user by chat ID:', error);
    return undefined;
  }
}

// Link a telegram chat ID to a user via verification code
async function linkTelegramAccount(chatId: number, code: string): Promise<{ success: boolean; message: string }> {
  const pendingLink = pendingLinkCodes.get(code.toUpperCase());

  if (!pendingLink) {
    return { success: false, message: 'Invalid or expired link code. Generate a new one in your dashboard settings.' };
  }

  if (pendingLink.expiresAt < Date.now()) {
    pendingLinkCodes.delete(code);
    return { success: false, message: 'Link code expired. Generate a new one in your dashboard settings.' };
  }

  try {
    // Update user with telegram chat ID and enable notifications
    await db
      .update(users)
      .set({
        telegramChatId: chatId.toString(),
        telegramEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, pendingLink.userId));

    // Remove used code
    pendingLinkCodes.delete(code);

    return { success: true, message: 'Your Telegram account has been linked! You will now receive notifications here.' };
  } catch (error) {
    console.error('Error linking telegram account:', error);
    return { success: false, message: 'Failed to link account. Please try again.' };
  }
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
    };
    message: {
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

interface TelegramMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard?: Array<Array<{
      text: string;
      callback_data?: string;
      url?: string;
    }>>;
    keyboard?: Array<Array<{
      text: string;
    }>>;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  };
}

// Send a message via Telegram API
async function sendMessage(message: TelegramMessage): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

// Answer callback query (removes loading state from button)
async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (error) {
    console.error('Failed to answer callback query:', error);
  }
}

// Handle /start command
async function handleStart(chatId: number, username?: string): Promise<void> {
  const welcomeMessage = `
🤖 *Welcome to ElizaGotchi OS!*

I'm your AI agent companion. I'll send you real-time alerts from your configured agents.

*Available Commands:*
/agents - View your configured agents
/status - Check agent status
/alerts - Manage alert preferences
/link - Link your ElizaGotchi account
/help - Get help

${username ? `Your Telegram: @${username}` : ''}
Chat ID: \`${chatId}\`

👉 Visit [elizagotchi.com](https://elizagotchi.com) to configure your agents!
`;

  await sendMessage({
    chat_id: chatId,
    text: welcomeMessage,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🌐 Open Dashboard', url: 'https://elizagotchi.com/dashboard' },
          { text: '📖 Documentation', url: 'https://elizagotchi.com/docs' },
        ],
        [
          { text: '🤖 My Agents', callback_data: 'agents' },
          { text: '⚙️ Settings', callback_data: 'settings' },
        ],
      ],
    },
  });
}

// Handle /agents command
async function handleAgents(chatId: number, userId?: string): Promise<void> {
  if (!userId) {
    await sendMessage({
      chat_id: chatId,
      text: `⚠️ *Account Not Linked*\n\nTo view your agents, you need to link your Telegram account.\n\nGo to your [Dashboard Settings](https://elizagotchi.com/dashboard/settings) and add your Telegram Chat ID:\n\n\`${chatId}\``,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔗 Link Account', url: 'https://elizagotchi.com/dashboard/settings' }],
        ],
      },
    });
    return;
  }

  try {
    // Fetch user's agents from database
    const userAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId));

    if (userAgents.length === 0) {
      await sendMessage({
        chat_id: chatId,
        text: `📭 *No Agents Configured*\n\nYou haven't set up any agents yet.\n\nVisit your dashboard to create your first agent!`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Create Agent', url: 'https://elizagotchi.com/dashboard/agents/new' }],
          ],
        },
      });
      return;
    }

    const statusEmoji: Record<string, string> = {
      running: '🟢',
      paused: '🟡',
      stopped: '🔴',
      error: '❌',
      starting: '🔄',
      pending: '⏳',
    };

    const agentList = userAgents
      .map((agent, i) => {
        const emoji = statusEmoji[agent.status] || '⚪';
        return `${i + 1}. ${emoji} *${agent.name}*\n   Type: ${agent.type}\n   Status: ${agent.status}`;
      })
      .join('\n\n');

    const buttons = userAgents.slice(0, 8).map((agent) => ([
      {
        text: `${statusEmoji[agent.status] || '⚪'} ${agent.name}`,
        callback_data: `agent_${agent.id}`,
      },
    ]));

    await sendMessage({
      chat_id: chatId,
      text: `🤖 *Your Agents (${userAgents.length})*\n\n${agentList}`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          ...buttons,
          [{ text: '➕ Create New Agent', url: 'https://elizagotchi.com/dashboard/agents/new' }],
        ],
      },
    });
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    await sendMessage({
      chat_id: chatId,
      text: '❌ Failed to fetch agents. Please try again later.',
    });
  }
}

// Handle /status command
async function handleStatus(chatId: number, userId?: string): Promise<void> {
  if (!userId) {
    await sendMessage({
      chat_id: chatId,
      text: `⚠️ *Account Not Linked*\n\nLink your account to view agent status.\n\nYour Chat ID: \`${chatId}\``,
      parse_mode: 'Markdown',
    });
    return;
  }

  try {
    const userAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, userId));

    const running = userAgents.filter((a) => a.status === 'running').length;
    const paused = userAgents.filter((a) => a.status === 'paused').length;
    const stopped = userAgents.filter((a) => a.status === 'stopped').length;
    const errors = userAgents.filter((a) => a.status === 'error').length;

    await sendMessage({
      chat_id: chatId,
      text: `📊 *Agent Status Overview*\n\n🟢 Running: ${running}\n🟡 Paused: ${paused}\n🔴 Stopped: ${stopped}\n❌ Errors: ${errors}\n\n📈 Total: ${userAgents.length} agents`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🤖 View Agents', callback_data: 'agents' },
            { text: '🔄 Refresh', callback_data: 'status' },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('Failed to fetch status:', error);
    await sendMessage({
      chat_id: chatId,
      text: '❌ Failed to fetch status. Please try again later.',
    });
  }
}

// Handle /alerts command
async function handleAlerts(chatId: number): Promise<void> {
  await sendMessage({
    chat_id: chatId,
    text: `🔔 *Alert Preferences*\n\nManage which notifications you receive:\n\n• Portfolio alerts\n• Whale movements\n• Airdrop notifications\n• Gas price alerts\n\nConfigure these in your dashboard.`,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚙️ Manage Alerts', url: 'https://elizagotchi.com/dashboard/settings' }],
      ],
    },
  });
}

// Handle /help command
async function handleHelp(chatId: number): Promise<void> {
  await sendMessage({
    chat_id: chatId,
    text: `📖 *ElizaGotchi Help*\n\n*Commands:*\n/start - Get started\n/agents - View your agents\n/status - Agent status overview\n/alerts - Alert preferences\n/link - Link your account\n/help - This help message\n\n*Need Support?*\nVisit our documentation or join our community.\n\nYour Chat ID: \`${chatId}\``,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📖 Docs', url: 'https://elizagotchi.com/docs' },
          { text: '💬 Community', url: 'https://discord.gg/elizagotchi' },
        ],
      ],
    },
  });
}

// Handle /link command
async function handleLink(chatId: number, code?: string): Promise<void> {
  if (!code) {
    await sendMessage({
      chat_id: chatId,
      text: `🔗 *Link Your Account*\n\nTo link your Telegram:\n\n1. Go to Dashboard → Settings\n2. Click "Generate Link Code"\n3. Send me: \`/link YOUR_CODE\`\n\nExample: \`/link ABC123\``,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚙️ Open Settings', url: 'https://elizagotchi.com/dashboard/settings' }],
        ],
      },
    });
    return;
  }

  // Try to link with the provided code
  const result = await linkTelegramAccount(chatId, code);

  await sendMessage({
    chat_id: chatId,
    text: result.success ? `✅ ${result.message}` : `❌ ${result.message}`,
    parse_mode: 'Markdown',
    reply_markup: result.success ? {
      inline_keyboard: [
        [
          { text: '🤖 My Agents', callback_data: 'agents' },
          { text: '📊 Status', callback_data: 'status' },
        ],
      ],
    } : {
      inline_keyboard: [
        [{ text: '⚙️ Open Settings', url: 'https://elizagotchi.com/dashboard/settings' }],
      ],
    },
  });
}

// Handle callback queries (button presses)
async function handleCallbackQuery(
  callbackQueryId: string,
  chatId: number,
  data: string,
  userId?: string
): Promise<void> {
  await answerCallbackQuery(callbackQueryId);

  switch (data) {
    case 'agents':
      await handleAgents(chatId, userId);
      break;
    case 'status':
      await handleStatus(chatId, userId);
      break;
    case 'settings':
      await handleAlerts(chatId);
      break;
    default:
      if (data.startsWith('agent_')) {
        const agentId = data.replace('agent_', '');
        // Handle individual agent view
        await sendMessage({
          chat_id: chatId,
          text: `🤖 Agent details coming soon!\n\nView full details on the dashboard.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📊 View Agent', url: `https://elizagotchi.com/dashboard/agents/${agentId}` }],
            ],
          },
        });
      }
  }
}

// Main webhook handler
export async function handleTelegramWebhook(update: TelegramUpdate): Promise<void> {
  try {
    // Handle regular messages
    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const username = update.message.from.username;

      // Look up user ID from database by chat ID
      const userId = await getUserIdByChatId(chatId.toString());

      // Handle commands
      if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase().replace('@elizagotchi_bot', '');

        switch (command) {
          case '/start':
            await handleStart(chatId, username);
            break;
          case '/agents':
            await handleAgents(chatId, userId);
            break;
          case '/status':
            await handleStatus(chatId, userId);
            break;
          case '/alerts':
            await handleAlerts(chatId);
            break;
          case '/help':
            await handleHelp(chatId);
            break;
          case '/link':
            const linkCode = text.split(' ')[1]; // Get code after /link
            await handleLink(chatId, linkCode);
            break;
          default:
            await sendMessage({
              chat_id: chatId,
              text: `Unknown command. Type /help for available commands.`,
            });
        }
      }
    }

    // Handle callback queries (inline button presses)
    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data = update.callback_query.data;
      const userId = await getUserIdByChatId(chatId.toString());

      await handleCallbackQuery(
        update.callback_query.id,
        chatId,
        data,
        userId
      );
    }
  } catch (error) {
    console.error('Error handling Telegram update:', error);
  }
}

// Create Hono router for webhook
export const telegramBotRouter = new Hono();

// Webhook endpoint
telegramBotRouter.post('/webhook', async (c) => {
  const update = await c.req.json<TelegramUpdate>();
  await handleTelegramWebhook(update);
  return c.json({ ok: true });
});

// Set webhook URL (call this once during setup)
export async function setTelegramWebhook(webhookUrl: string): Promise<boolean> {
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
    console.log('Webhook set result:', result);
    return response.ok;
  } catch (error) {
    console.error('Failed to set webhook:', error);
    return false;
  }
}

// Delete webhook (for switching to polling)
export async function deleteTelegramWebhook(): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
      method: 'POST',
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return false;
  }
}

// Get webhook info
export async function getTelegramWebhookInfo(): Promise<unknown> {
  try {
    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get webhook info:', error);
    return null;
  }
}
